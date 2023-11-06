export function getCompletionRate(signedValidators, totalWeight) {
  let signedWeight = 0;
  signedValidators.map(({ weight }, key) => {
    signedWeight += weight;
  });
  let rate = signedWeight / totalWeight;
  while (rate > 1) {
    rate /= 10;
  }
  return rate.toPrecision(2);
}
