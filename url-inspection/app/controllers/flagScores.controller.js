const { parentPort, workerData } = require("worker_threads");

// Base scores
const comboLevelsquattingFlagScore = 2.0;
const domainAgeFlagScore = 2.0;
const safeBrowsingFlagScore = 2.0;

//typobitsquatting scenario 1: jarowinkler > 0.9
const jaroWinklerOnlyFlagScore = 2.0;
// typobitsquatting scenario 2: jaro winkler > 0.75 && levenshtein < threshold
const jaroWinklerPartialFlagScore = 1.5;
const levenshteinDistanceFlagScore = 0.5;

const registrationPeriodFlagScore = 1.5;
const redirectionsFlagScore = 1.5;
const subdomainLenFlagScore = 1.5;
const homographsquattingFlagScore = 3.0;
const entropyFlagScore = 2.0;

// blacklist keywords
const blacklistFlagScore = 2.0;
const blacklistLow = 0.5;
const blacklistMedium = 1.0;
const blacklistHigh = 1.5;

const flagScore = (score) => {
  if (parentPort) parentPort.postMessage(["flagScore", score]);
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
  flagScore(redirectionsFlagScore - (1 / numRedirections));
};

exports.subdomainLenPostScore = (string) => {
  flagScore(subdomainLenFlagScore - (1 / (string.length - 15 + 1)));
};

exports.homographsquattingPostScore = (homoglyphsFound) => {
  flagScore((Math.min(homoglyphsFound.length, 10) / 10) * homographsquattingFlagScore);
};

exports.entropyPostScore = (entropyScore) => {
  flagScore((Math.min(entropyScore, 10) / 10) * entropyFlagScore);
};

exports.blacklistKeywordPostScore = (blacklistedKeywords) => {
  var score = 0.0;

  for (var i = 0; i < blacklistedKeywords.length; i++) {
    if (blacklistedKeywords[i].flag_rating == "low") score += blacklistLow;
    else if (blacklistedKeywords[i].flag_rating == "medium") score += blacklistMedium;
    else if (blacklistedKeywords[i].flag_rating == "high") score += blacklistHigh;
  }

  return blacklistFlagScore - (1 / (score * 5));
};
