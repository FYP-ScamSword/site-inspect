const { probabilities } = require("./entropy.probabilities");

exports.calculateRelativeEntropy = (stringToCheck) => {
  if (stringToCheck.length < 5) return;

  let entropyScore = 0.0;

  let charFrequencies = [...stringToCheck].reduce(
    (res, char) => ((res[char] = (res[char] || 0) + 1), res),
    {}
  );

  const chars = Object.keys(charFrequencies);

  try {
    for (var i = 0; i < chars.length; i++) {
      var observed = charFrequencies[chars[i].toString()] / stringToCheck.length;
      var expected = probabilities[chars[i].toString()];
      entropyScore += observed * Math.log2(observed / expected);
    }
  } catch (error) {
    console.log(error);
  }

  return entropyScore;
};
