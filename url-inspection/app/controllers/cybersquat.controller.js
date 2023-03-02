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

  for (let i = 0; i < checkStrings.length; i++) {
    for (let j = 0; j < keywords.length; j++) {
      var jaroWinklerSimilarity = jaroWinklerDistance(
        checkStrings[i],
        keywords[j]
      );

      if (jaroWinklerSimilarity != 0) {
        typosquattingBitsquattingJaroWinklerLog([
          checkStrings[i],
          keywords[j],
          jaroWinklerSimilarity,
        ]);
      }

      if (parseFloat(jaroWinklerSimilarity) >= 0.75) {
        flagged = true;
        typosquattingBitsquattingJaroWinklerFlag([
          checkStrings[i],
          keywords[j],
          jaroWinklerSimilarity,
        ]);
      }

      if (jaroWinklerSimilarity > 0.6) {
        var levenshteinDistSimilarity = levenshteinDistance(
          checkStrings[i],
          keywords[j]
        );

        typosquattingBitsquattingLevenshteinDistLog([
          checkStrings[i],
          keywords[j],
          levenshteinDistSimilarity,
        ]);

        if (levenshteinDistSimilarity / checkStrings[i].length <= 1 / 3) {
          typosquattingBitsquattingLevenshteinDistFlag([
            checkStrings[i],
            keywords[j],
            levenshteinDistSimilarity,
          ]);
        }
      }
    }
  }

  return flagged;
};
