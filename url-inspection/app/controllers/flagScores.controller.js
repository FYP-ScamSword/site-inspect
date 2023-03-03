const { parentPort, workerData } = require("worker_threads");

// Base scores
comboLevelsquattingFlagScore = 2.0;
domainAgeFlagScore = 2.0;
safeBrowsingFlagScore = 2.0;

//typobitsquatting scenario 1: jarowinkler > 0.9
jaroWinklerOnlyFlagScore = 2.0;
// typobitsquatting scenario 2: jaro winkler > 0.75 && levenshtein < threshold
jaroWinklerPartialFlagScore = 1.5;
levenshteinDistanceFlagScore = 0.5;

registrationPeriodFlagScore = 1.5;
redirectionsFlagScore = 1.5;
subdomainLenFlagScore = 1.5;
homographsquattingFlagScore = 3.0;
entropyFlagScore = 2.0;

checkParentPort = () => {
  if (parentPort) return true;

  return false;
};

flagScore = (score) => {
  if (checkParentPort) parentPort.postMessage(["flagScore", score]);
};

exports.comboLevelSquattingPostScore = (flags) => {
  flagScore(comboLevelsquattingFlagScore * (flags.split(" ").length - 1));
};

exports.domainAgePostScore = () => {
  flagScore(domainAgeFlagScore);
};

exports.safeBrowsingPostScore = () => {
  flagScore(safeBrowsingFlagScore);
};

exports.typoBitsquattingCaseOnePostScore = (jaroWinkerScore) => {
  flagScore(jaroWinklerOnlyFlagScore * jaroWinkerScore);
};

exports.typoBitsquattingCaseTwoPostScore = (
  jaroWinkerScore,
  string,
  levenshteinScore
) => {
  flagScore(
    jaroWinklerPartialFlagScore * jaroWinkerScore +
      levenshteinDistanceFlagScore * (string.length / levenshteinScore)
  );
};

exports.registrationPeriodPostScore = () => {
  flagScore(registrationPeriodFlagScore);
};

exports.redirectionsPostScore = (numRedirections) => {
  flagScore(redirectionsFlagScore - 1 / numRedirections);
};

exports.subdomainLenPostScore = (string) => {
  flagScore(subdomainLenFlagScore - 1 / (string.length - 15 + 1));
};

exports.homographsquattingPostScore = (homoglyphsFound) => {
  flagScore((homoglyphsFound.length / 10) * homographsquattingFlagScore);
};

exports.entropyPostScore = (entropyScore) => {
  flagScore((entropyScore / 10) * entropyFlagScore);
};
