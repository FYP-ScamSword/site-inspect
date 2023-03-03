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

exports.processingUrlUnshortenLog = (methodName, value) => {
  logging(formatMessage(methodName, "unshortenedUrl", value));
};

exports.processingUrlRedirectsLog = (methodName, redirectsArray) => {
  logging(formatMessage(methodName, "redirections", redirectsArray));
};

exports.processingUrlCountRedirectsLog = (methodName, value) => {
  logging(formatMessage(methodName, "numRedirections", value));
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

exports.entropyDetectionDGALog = (methodName, urlPartial, entropyScore) => {
  logging(formatMessage(methodName, "entropyScore", `${urlPartial}: ${entropyScore}`));
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

exports.homographsquattingLog = (homoglyphsDetected) => {
  logging(
    formatMessage(
      "checkHomographSquatting",
      "homoglyphsDetected",
      homoglyphsDetected
    )
  );
};

exports.homographsquattingBeforeProcessLog = (url) => {
  logging(
    formatMessage("checkHomographSquatting", "beforeProcessHomographUrl", url)
  );
};

exports.homographsquattingProcessedLog = (processedUrl) => {
  logging(
    formatMessage(
      "checkHomographSquatting",
      "processedHomographUrl",
      processedUrl
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

flagging = (message, flag_type) => {
  if (parentPort) parentPort.postMessage(["flag", message, flag_type]);
};

exports.abnormalNumRedirectionsFlag = (numRedirections) => {
  flagging(
    `- The number of redirections is abnormal (> 2): ${numRedirections}`,
    "redirections_flag"
  );
};

exports.googleSafeLookupAPIFlag = (flags) => {
  flagging(
    `- Flagged by Google's Safe Browsing Lookup API\n\
  ${flags}`,
    "safe_browsing_flag"
  );
};

exports.domainAgeFlag = () => {
  flagging("- Domain is less than 3 months old.", "domain_age_flag");
};

exports.registrationPeriodFlag = () => {
  flagging(
    "- Domain is registered for only a year or lesser.",
    "registration_period_flag"
  );
};

exports.entropyDetectionDGAFlag = (urlPartial, entropyScore) => {
  flagging(
    `- Likely to be a link generated with DGA (Domain Generation Algorithm), { ${urlPartial} } has an entropy score of > 3.5: ${entropyScore}`,
    "dga_flag"
  );
};

exports.abnormalStringLenFlag = (abnormalString) => {
  flagging(
    `- The length of the subdomain ${abnormalString} is abnormal (>= 15) with a length of ${abnormalString.length}`,
    "subdomain_len_flag"
  );
};

exports.blacklistedKeywordFlag = (keyword) => {
  flagging(
    `- The blacklisted keyword { ${keyword} } was spotted in the url submitted.`,
    "blacklisted_keyword_flag"
  );
};

exports.homographsquattingFlag = (homoglyphs) => {
  flagging(
    `- Homoglyphs Detected in the URL\n\t- { ${homoglyphs} }`,
    "homographsquatting_flag"
  );
};

exports.levelsquattingCombosquattingFlag = (trademarks) => {
  flagging(
    `- Levelsquatting/Combosquatting Detected\n\t- Direct usage of trademark(s) {${trademarks} } found`,
    "combolevelsquatting_flag"
  );
};

exports.typosquattingBitsquattingJaroWinklerFlag = (values) => {
  flagging(
    `- Typosquatting/Bitsquatting Detected with Jaro-Winkler Algorithm\n\t- Similarity of {${values[0]}} with trademark {${values[1]}} is ${values[2]}`,
    "typobitsquatting_flag"
  );
};

exports.typosquattingBitsquattingLevenshteinDistFlag = (values) => {
  flagging(
    `- Typosquatting/Bitsquatting Detected with Levenshtein Distance\n\t- Distance of {${values[0]}} with trademark {${values[1]}} is ${values[2]}`,
    "typobitsquatting_flag"
  );
};
