// Handles: grabbing a thumbnail frame from the chosen video, opening a Drive
// resumable-upload session, and PUTting the video straight to Google so it
// never passes through our own serverless function.
const Uploader = (() => {
  function captureThumbnail(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      video.addEventListener('loadeddata', () => {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 4);
      });
      video.addEventListener('seeked', () => {
        // On some large/slow-to-decode files, 'seeked' can fire a frame or two
        // before the video's dimensions/pixels are actually painted. A couple
        // of rAF ticks ensures there's real image data before we snapshot it.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (!video.videoWidth || !video.videoHeight) {
            URL.revokeObjectURL(url);
            reject(new Error('Video frame was not ready to capture.'));
            return;
          }
          const canvas = document.createElement('canvas');
          const maxW = 480;
          const scale = Math.min(1, maxW / video.videoWidth);
          canvas.width = video.videoWidth * scale;
          canvas.height = video.videoHeight * scale;
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          URL.revokeObjectURL(url);
          if (!dataUrl || dataUrl.length < 100) {
            reject(new Error('Captured thumbnail was empty.'));
            return;
          }
          resolve({ dataUrl, base64: dataUrl.split(',')[1] });
        }));
      });
      video.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read the video file.'));
      });
    });
  }

  async function uploadVideo(file, onProgress) {
    const sessionRes = await fetch('/api/upload-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, mimeType: file.type, sizeBytes: file.size }),
    });
    if (!sessionRes.ok) throw new Error('Could not start the upload.');
    const session = await sessionRes.json();

    if (session.devMode) {
      return simulateUpload(onProgress, session.fakeFileId);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', session.uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText);
            resolve(body.id);
          } catch (err) {
            reject(new Error('Upload succeeded but Drive response was unreadable.'));
          }
        } else {
          reject(new Error(`Upload failed (status ${xhr.status}).`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload.'));
      xhr.send(file);
    });
  }

  function simulateUpload(onProgress, fakeFileId) {
    return new Promise((resolve) => {
      let pct = 0;
      const interval = setInterval(() => {
        pct += 20;
        onProgress(Math.min(pct, 100));
        if (pct >= 100) {
          clearInterval(interval);
          resolve(fakeFileId);
        }
      }, 150);
    });
  }

  return { captureThumbnail, uploadVideo };
})();
