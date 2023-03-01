const parse = require("parse-domains");
const { valid, homoglyphsList } = require("./homoglyphs");
const {
  typosquattingBitsquattingLevenshteinDistLog,
  typosquattingBitsquattingJaroWinklerLog,
  levelsquattingCombosquattingFlag,
  levelsquattingCombosquattingLog,
  levelsquattingCombosquattingLegitimateLog,
  typosquattingBitsquattingJaroWinklerFlag,
  typosquattingBitsquattingLevenshteinDistFlag,
  homographsquattingLog,
  homographsquattingFlag,
  homographsquattingProcessedLog,
  homographsquattingBeforeProcessLog,
} = require("./logging.controller");
const {
  jaroWinklerDistance,
  levenshteinDistance,
} = require("./stringSimilarity");

/* -- Homographsquatting - Detect homoglyphs, convert to corresponding char - */
exports.checkHomographsquatting = (url) => {
  var homoglyphsDetected = false;
  let homoglyphsFound = [];
  var processedUrl = url;

  [...url].forEach((e, i) => {
    // This part checks each character in the URL to see if there are any homoglyphs
    // homoglyphs.js contains a list of valid characters, if its not in it, there's a homoglyph
    if (valid.includes(convertToUnicode(e)) == false) {
      homoglyphsDetected = true;
      homoglyphsFound.push(e);

      // find the corresponding character (key) from homographsList in homoglyphs.js
      let corrCharacter = Object.keys(homoglyphsList).find((key) =>
        homoglyphsList[key].includes(convertToUnicode(e))
      );

      // replace the homoglyph with the corresponding character
      processedUrl = processedUrl.replace(
        e,
        String.fromCharCode(parseInt(corrCharacter, 16))
      ); // replace e with the corresponding character
    }
  });

  homographsquattingLog(homoglyphsDetected);
  if (homoglyphsDetected == true) {
    homographsquattingFlag(homoglyphsFound);
    homographsquattingBeforeProcessLog(url);
    homographsquattingProcessedLog(processedUrl);

    return processedUrl;
  }

  return url;
};

convertToUnicode = (character) => {
  return character.charCodeAt(0).toString(16);
};

exports.checkLegitimateDomain = async (legitDomain, compareDomain) => {
  let parsedLegitDomain = await parse(legitDomain);
  let parsedCompareDomain = await parse(compareDomain);

  if (
    parsedLegitDomain.siteName == parsedCompareDomain.siteName &&
    parsedLegitDomain.tld == parsedCompareDomain.tld
  )
    return true;
  return false;
};

/* --- Levelquatting or Combosquatting - detect direct usage of trademark --- */
exports.checkLevelsquattingCombosquatting = async (
  trademarks,
  parsedHostname,
  homographDetected
) => {
  // remove any "-" or "." to account for cases like dh-s.bank, or db.s.bank
  let processedparsedHostname = parsedHostname.replace(/[\-\.]/g, "");

  var flags = "";
  for (let i = 0; i < trademarks.length; i++) {
    if (processedparsedHostname.includes(trademarks[i].keyword)) {
      flags += `${trademarks[i].keyword}`;

      // only check if that was a legitimate domain if homograph wasnt detected, because the processed url from
      // checking homograph squatting will replace the homoglyph with the corresponding character (so that further checks are more accurate)
      // which means it may be seem "legitimate" after processing
      // e.g. https://microsoꬵt.com will be become https://microsoft.com after homograph processing but its not actually https://microsoft.com
      // so skip the legitimate domain check
      if (homographDetected == false) {
        if (
          await this.checkLegitimateDomain(trademarks[i].url, parsedHostname)
        ) {
          levelsquattingCombosquattingLegitimateLog();
          return null;
        }
      }
    }
  }

  if (flags != "") {
    levelsquattingCombosquattingFlag(flags);
    levelsquattingCombosquattingLog(flags);
    return true;
  }

  return false;
};

/* --- Typosquatting or Bitsquatting - detect indirect usage of trademark --- */
exports.checkTyposquattingBitsquatting = (keywords, checkStrings) => {
  keywords = keywords.map((record) => record.keyword);

  var flagged = false;

  // get unique values in checkStrings
  checkStrings = [...new Set(checkStrings)];

  for (let i = 0; i < checkStrings.length; i++) {
    for (let j = 0; j < keywords.length; j++) {
      var levenshteinThreshold = false;

      var jaroWinklerSimilarity = jaroWinklerDistance(
        checkStrings[i],
        keywords[j]
      );

      typosquattingBitsquattingJaroWinklerLog([
        checkStrings[i],
        keywords[j],
        jaroWinklerSimilarity,
      ]);

      var levenshteinDistSimilarity = levenshteinDistance(
        checkStrings[i],
        keywords[j]
      );

      typosquattingBitsquattingLevenshteinDistLog([
        checkStrings[i],
        keywords[j],
        levenshteinDistSimilarity,
      ]);

      /* --------- check if levenshtein distance similarity hit threshold --------- */
      // dist < (num chars - 1) / 2 and rounddown.
      // example case 1: num chars 3-4
      // (3-1)/2 and (4-1)/2 round down is 1 (so max 1 char can be modified for strings of length 3-4 to be considered typosquatting)
      // example case 2: num chars 5-6
      // (5-1)/2 and (6-1)/2 round down is 2 (max 2 chars can be modified for len 5-6 to be considered typosquatting)
      // example case 3: num chars 7-8
      // (7-1)/2 and (8-1)/2 round down is 3 (max 3 chars can be modified for len 7-8 to be considered typosquatting)
      // example case 4: num chars 9-10
      // (9-1)/2 and (10-1)/2 round down is 4 (max 4 chars can be modified for len 9-10 to be considered typosquatting)
      // but for the rest of the cases (where len > 10 chars, max 5 chars can be modified - thats the upper limit)

      var calcThreshold = Math.floor((checkStrings[i].length - 1)/2);

      if (calcThreshold > 5) calcThreshold = 5;

      if (levenshteinDistSimilarity <= calcThreshold) {
        levenshteinThreshold = true;
      }

      /* ------ check if algos thresholds were met to fulfil typobitsquatting ----- */
      if (jaroWinklerSimilarity >= 0.9) {
        flagged = true;

        typosquattingBitsquattingJaroWinklerFlag([
          checkStrings[i],
          keywords[j],
          jaroWinklerSimilarity,
        ]);
      } else if (jaroWinklerSimilarity >= 0.75 && levenshteinThreshold == true) {
        flagged = true;

        typosquattingBitsquattingLevenshteinDistFlag([
          checkStrings[i],
          keywords[j],
          levenshteinDistSimilarity,
        ]);
      }
    }
  }

  return flagged;
};
