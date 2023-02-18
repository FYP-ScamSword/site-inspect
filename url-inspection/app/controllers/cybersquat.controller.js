const parse = require("parse-domains");
const {
  typosquattingBitsquattingLevenshteinDistLog,
  typosquattingBitsquattingJaroWinklerLog,
  levelsquattingCombosquattingFlag,
  levelsquattingCombosquattingLog,
  levelsquattingCombosquattingLegitimateLog,
  typosquattingBitsquattingJaroWinklerFlag,
  typosquattingBitsquattingLevenshteinDistFlag,
} = require("./logging.controller");
const {
  jaroWinklerDistance,
  levenshteinDistance,
} = require("./stringSimilarity");

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
  parsedHostname
) => {
  // remove any "-" or "." to account for cases like dh-s.bank, or db.s.bank
  let processedparsedHostname = parsedHostname.replace(/[\-\.]/g, "");

  var flags = "";
  for (let i = 0; i < trademarks.length; i++) {
    if (processedparsedHostname.includes(trademarks[i].keyword)) {
      flags += ` ${trademarks[i].keyword}`;
      if (await this.checkLegitimateDomain(trademarks[i].url, parsedHostname)) {
        levelsquattingCombosquattingLegitimateLog();
        return null;
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

      typosquattingBitsquattingJaroWinklerLog([
        checkStrings[i],
        keywords[j],
        jaroWinklerSimilarity,
      ]);

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
