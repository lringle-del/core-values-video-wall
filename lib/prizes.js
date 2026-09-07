// Placeholder prize list — edit freely before launch.
// `weight` only controls how big/rare each slice LOOKS on the wheel.
// Every spin is a guaranteed win; weight has no effect on real odds unless
// you also change the assignment logic in api/finalize-submission.js.
const PRIZES = [
  { label: '$10 Gift Card', weight: 3 },
  { label: '$25 Gift Card', weight: 1 },
  { label: 'Company Swag Pack', weight: 3 },
  { label: 'Extra PTO Hour', weight: 1 },
  { label: 'Coffee Gift Card', weight: 3 },
  { label: 'Mystery Prize', weight: 2 },
];

// Every submission wins — this just picks *which* prize/segment index to
// land on, weighted by how "common" it should feel.
function pickPrizeIndex() {
  const total = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < PRIZES.length; i++) {
    roll -= PRIZES[i].weight;
    if (roll <= 0) return i;
  }
  return PRIZES.length - 1;
}

module.exports = { PRIZES, pickPrizeIndex };
