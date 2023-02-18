const { parentPort } = require("worker_threads");

/* --------------------------------- Logging -------------------------------- */

logging = (message) => {
  if (parentPort) parentPort.postMessage(["log", message]);
};

formatMessage = (methodName, variableName, value) => {
  return `${methodName} = ~${variableName} | ${value}`;
};

exports.googleSafeLookupAPILog = (value) => {
  logging(formatMessage("googleSafeLookupAPI", "data", value));
};

exports.googleSafeLookupAPINoResultsLog = () => {
  logging(
    formatMessage(
      "googleSafeLookupAPI",
      "",
      "Google's Safe Browsing Lookup API returned no results."
    )
  );
};

exports.googleSafeLookupAPIErrorLog = (error) => {
  logging(formatMessage("googleSafeLookupAPI", "HTTP Error Response", error));
};

exports.googleWebRiskLookupAPILog = (value) => {
  logging(formatMessage("googleWebRiskLookupAPI", "data", value));
};

exports.googleWebRiskLookupAPINoResultsLog = () => {
  logging(
    formatMessage(
      "googleWebRiskLookupAPI",
      "",
      "Google's Web Risk Lookup API returned no results."
    )
  );
};

exports.googleWebRiskLookupAPIErrorLog = (error) => {
  logging(
    formatMessage("googleWebRiskLookupAPI", "HTTP Error Response", error)
  );
};

exports.processingUrlUnshortenLog = (methodName, value) => {
  logging(formatMessage(methodName, "unshortenedUrl", value));
};

exports.processingUrlDecodeLog = (methodName, value) => {
  logging(formatMessage(methodName, "decodedUrl", value));
};

exports.obtainDomainAgeLog = (methodName, value) => {
  logging(formatMessage(methodName, "numDaysOfCreation", value));
};

exports.obtainDomainAgeErrorLog = (methodName, error) => {
  logging(
    formatMessage(methodName, "numDaysOfCreation", "An error occured\n" + error)
  );
};

exports.calculateRegistrationPeriodLog = (methodName, value) => {
  logging(formatMessage(methodName, "registrationPeriod", value));
};

exports.calculateRegistrationPeriodErrorLog = (methodName, error) => {
  logging(
    formatMessage(
      methodName,
      "registrationPeriod",
      "An error occured\n" + error
    )
  );
};

exports.entropyDetectionDGALog = (methodName, entropyScore) => {
  logging(formatMessage(methodName, "entropyScore", entropyScore));
};

exports.abnormalStringLenLog = (methodName, checkedStr) => {
  logging(
    formatMessage(
      methodName,
      "stringLength",
      `Checking length of string ${checkedStr}: ${checkedStr.length}`
    )
  );
};

exports.blacklistedKeywordLog = (methodName, keyword) => {
  logging(
    formatMessage(
      methodName,
      "blacklistKeyword",
      `Checking url for blacklisted keyword ${keyword}`
    )
  );
};

exports.cybersquattingCheckStringsLog = (methodName, value) => {
  logging(formatMessage(methodName, "checkStrings", value));
};

exports.levelsquattingCombosquattingLog = (value) => {
  logging(
    formatMessage(
      "checkLevelsquattingCombosquatting",
      "levelCombosquattingDetected",
      value
    )
  );
};

exports.levelsquattingCombosquattingLegitimateLog = () => {
  logging(
    formatMessage(
      "checkLevelsquattingCombosquatting",
      "levelCombosquattingDetected",
      "This is a legitimate domain."
    )
  );
};

exports.typosquattingBitsquattingJaroWinklerLog = (values) => {
  logging(
    formatMessage(
      "checkTyposquattingBitsquatting",
      "jaroWinklerSimilarity",
      `Comparing ${values[0]} with ${values[1]}: ${values[2]}`
    )
  );
};

exports.typosquattingBitsquattingLevenshteinDistLog = (values) => {
  logging(
    formatMessage(
      "checkTyposquattingBitsquatting",
      "levenshteinDistSimilarity",
      `Comparing ${values[0]} with ${values[1]}: ${values[2]}`
    )
  );
};

/* -------------------------------- Flagging -------------------------------- */

flagging = (message) => {
  if (parentPort) parentPort.postMessage(["flag", message]);
};

exports.googleSafeLookupAPIFlag = (flags) => {
  flagging(`- Flagged by Google's Safe Browsing Lookup API\n\
  ${flags}`);
};

exports.googleWebRiskLookupAPIFlag = (flags) => {
  flagging(`- Flagged by Google's Web Risk Lookup API\n\
  ${flags}`);
};

exports.domainAgeFlag = () => {
  flagging("- Domain is less than 3 months old.");
};

exports.registrationPeriodFlag = () => {
  flagging("- Domain is registered for only a year or lesser.");
};

exports.entropyDetectionDGAFlag = (entropyScore) => {
  flagging(
    `- Likely to be a link generated with DGA (Domain Generation Algorithm), entropy score is > 3.5: ${entropyScore}`
  );
};

exports.abnormalStringLenFlag = (abnormalString) => {
  flagging(
    `- The length of the subdomain ${abnormalString} is abnormal (>= 15) with a length of ${abnormalString.length}`
  );
};

exports.blacklistedKeywordFlag = (keyword) => {
  flagging(
    `- The blacklisted keyword ${keyword} was spotted in the url submitted.`
  );
};

exports.levelsquattingCombosquattingFlag = (trademarks) => {
  flagging(
    `- Levelsquatting/Combosquatting Detected\n\t- Direct usage of trademark(s) {${trademarks} } found`
  );
};

exports.typosquattingBitsquattingJaroWinklerFlag = (values) => {
  flagging(
    `- Typosquatting/Bitsquatting Detected with Jaro-Winkler Algorithm\n\t- Similarity of {${values[0]}} with trademark {${values[1]}} is ${values[2]}`
  );
};

exports.typosquattingBitsquattingLevenshteinDistFlag = (values) => {
  flagging(
    `- Typosquatting/Bitsquatting Detected with Levenshtein Distance\n\t- Distance of {${values[0]}} with trademark {${values[1]}} is ${values[2]}`
  );
};

exports.typosquattingBitsquattingFlag = (flags) => {
  let flagArray = flags.split("\n");

  for (let i = 0; i < flagArray.length; i++) {
    flagging(flagArray);
  }
};
