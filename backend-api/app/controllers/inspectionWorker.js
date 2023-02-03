const moment = require("moment");
const { parentPort, workerData } = require("worker_threads");
const {
  decodeUrl,
  unshortenUrl,
  whoisLookup,
  googleSafeLookupAPI,
  googleWebRiskLookupAPI,
} = require("./inspectionmethods");
const db = require("../models");
const InspectLinks = db.inspected_links;
const KnownSites = db.cybersquat_known_sites;
const parse = require("parse-domains");
const {
  jaroWinklerDistance,
  levenshteinDistance,
} = require("./stringSimilarity");

db.mongoose
  .set("strictQuery", true)
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database!");
    startLinkInspection(workerData.url, workerData.inspectedLink);
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

startLinkInspection = async (url, inspectedLink) => {
  const inspectLinkObj = await new InspectLinks(inspectedLink).save(); // add new entry to DB with status "processing"
  inspectedLink._id = inspectLinkObj["_id"];

  /* ----------------------------- Processing URL ----------------------------- */
  url = await processingUrl(url);

  inspectedLink.processed_url = url;

  /* ------------------- Check number of days since creation ------------------ */
  const whoisUrl = await obtainWhoisInfo(url);
  inspectedLink.domain_age = whoisUrl["domain_age"];
  inspectedLink.registrar_abuse_contact = whoisUrl["registrar_abuse_contact"];

  /* ------------ Check URL using Google's Safe Browsing Lookup API ----------- */
  await googleSafeLookupAPI(url);

  /* -------------- Check URL using Google's Web Risk Lookup API -------------- */
  await googleWebRiskLookupAPI(url);

  /* ------------------- Inspecting Link for Cybersquatting ------------------- */
  await checkCybersquatting(url);

  inspectedLink.status = "processed";

  // Updating the record in DB with "processed" status as well as processedUrl, calculated domain age.
  await InspectLinks.findByIdAndUpdate(inspectedLink._id, inspectedLink, {
    useFindAndModify: false,
  });

  terminatingWorker(inspectedLink);

  db.mongoose.disconnect();
};

processingUrl = async (url) => {
  /* ------------------------------ unshorten url ----------------------------- */
  const unshortenedUrl = await unshortenUrl(url);
  logging("processingUrl= ~ unshortenedUrl | " + unshortenedUrl);

  /* ------------------------ decode url encoded links ------------------------ */
  const decodedUrl = decodeUrl(unshortenedUrl);
  logging("processingUrl= ~ decodedUrl | " + decodedUrl);

  return decodedUrl;
};

obtainWhoisInfo = async (url) => {
  /* ------------------------------ obtain domain age using whois ------------------------------ */
  const urlObj = new URL(url);
  const urlHostname = urlObj.hostname.startsWith("www.")
    ? urlObj.hostname.slice(4)
    : urlObj.hostname;

  const urlDomainInfo = await whoisLookup(urlHostname);

  const whoisUrl = {
    domain_age: calculateDomainAge(urlDomainInfo),
    registrar_abuse_contact: obtainRegistrar(urlDomainInfo),
  };

  return whoisUrl;
};

obtainRegistrar = (urlDomainInfo) => {
  const registrarAbuseContact =
    urlDomainInfo[Object.keys(urlDomainInfo)[0]][
      "Registrar Abuse Contact Email"
    ];

  return registrarAbuseContact ? registrarAbuseContact : null;
};

calculateDomainAge = (urlDomainInfo) => {
  /* ------------------------ Calculate the domain age ------------------------ */
  const urlCreatedDate =
    urlDomainInfo[Object.keys(urlDomainInfo)[0]]["Created Date"];

  if (urlCreatedDate) {
    try {
      const numDaysOfCreation = moment().diff(moment(urlCreatedDate), "days");
      logging("obtainDomainAge= ~ numDaysOfCreation | " + numDaysOfCreation);

      // Flag if domain is less than 3 months old
      if (numDaysOfCreation < 90) {
        flagging("- Domain is less than 3 months old.");
      }

      return numDaysOfCreation;
    } catch (error) {
      logging(
        "obtainDomainAge= ~ numDaysOfCreation | An error occured\n" + error
      );

      return null;
    }
  } else {
    logging("obtainDomainAge= ~ numDaysOfCreation | Domain not found");

    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                            Cybersquatting Checks                           */
/* -------------------------------------------------------------------------- */
checkCybersquatting = async (url) => {
  let parsedDomain = await parse(url);

  const checkStrings = parsedDomain.subdomain
    .split("-")
    .concat(parsedDomain.siteName)
    .filter((str) => str !== "");

  logging(`checkCybersquatting= ~checkStrings | ${checkStrings}`);

  /* --------------- Check For Levelsquatting or Combosquatting --------------- */
  const levelCombosquattingDetected = await checkLevelsquattingCombosquatting(
    checkStrings
  );
  if (levelCombosquattingDetected) return;

  /* ---- Check for Typosquatting/Bitsquatting with string similarity algos --- */
  const typoBitsquattingDetected = await checkTyposquattingBitsquatting(
    checkStrings
  );
  if (typoBitsquattingDetected) return;
};

// /* --- Levelquatting or Combosquatting - detect direct usage of trademark --- */
// checkLevelsquattingCombosquatting = async (checkStrings) => {
//   console.log(checkStrings);
//   const regex = checkStrings.map(function (k) {
//     return new RegExp(k);
//   });

//   const trademarks = await KnownSites.find({
//     keyword: { $in: regex },
//   });

//   if (trademarks) {
//     var flags = trademarks[0].keyword;
//     for (let i = 1; i < trademarks.length; i++) {
//       flags += `, ${trademarks[i].keyword}`;
//     }

//     logging(
//       `checkLevelsquattingCombosquatting= ~trademark | ${flags}`
//     );

//     flagging(
//       `- Levelsquatting/Combosquatting Detected\n\t- Direct usage of trademark(s) {${flags}} found`
//     );

//     return true;
//   }

//   return false;
// };

/* --- Levelquatting or Combosquatting - detect direct usage of trademark --- */
checkLevelsquattingCombosquatting = async (checkStrings) => {
  const trademarks = await KnownSites.find({});

  var flags = "";
  for (let i = 0; i < checkStrings.length; i++) {
    for (let j = 0; j < trademarks.length; j++) {
      if (checkStrings[i].includes(trademarks[j].keyword)) {
        flags += ` ${trademarks[j].keyword}`;
      }
    }
  }

  if (flags != "") {
    logging(`checkLevelsquattingCombosquatting= ~trademark |${flags}`);

    flagging(
      `- Levelsquatting/Combosquatting Detected\n\t- Direct usage of trademark(s) {${flags} } found`
    );

    return true;
  }

  return false;
};

/* --- Typosquatting or Bitsquatting - detect indirect usage of trademark --- */
checkTyposquattingBitsquatting = async (checkStrings) => {
  var keywords = await KnownSites.find({});
  keywords = keywords.map((record) => record.keyword);

  var flags = "";

  for (let i = 0; i < checkStrings.length; i++) {
    for (let j = 0; j < keywords.length; j++) {
      var jaroWinklerSimilarity = jaroWinklerDistance(
        checkStrings[i],
        keywords[j]
      );
      logging(
        `checkTyposquattingBitsquatting= ~jaroWinklerSimilarity | Comparing ${checkStrings[i]} with ${keywords[j]}: ${jaroWinklerSimilarity}`
      );

      if (parseFloat(jaroWinklerSimilarity) >= 0.75) {
        if (flags.length != 0) flags += "\n";
        flags += `- Typosquatting/Bitsquatting Detected with Jaro-Winkler Algorithm\n\t- Similarity of {${checkStrings[i]}} with trademark {${keywords[j]}} is ${jaroWinklerSimilarity}`;
      }

      if (jaroWinklerSimilarity > 0.6) {
        var levenshteinDistSimilarity = levenshteinDistance(
          checkStrings[i],
          keywords[j]
        );
        logging(
          `checkTyposquattingBitsquatting= ~levenshteinDistSimilarity | Comparing ${checkStrings[i]} with ${keywords[j]}: ${levenshteinDistSimilarity}`
        );

        if (levenshteinDistSimilarity / checkStrings[i].length <= 1 / 3) {
          if (flags.length != 0) flags += "\n";
          flags += `- Typosquatting/Bitsquatting Detected with Levenshtein Distance\n\t- Distance of {${checkStrings[i]}} with trademark {${keywords[j]}} is ${levenshteinDistSimilarity}`;
        }
      }
    }
  }

  if (flags.length != 0) {
    flagging(flags);
    return true;
  }

  return false;
};

logging = (message) => {
  parentPort.postMessage(["log", message]);
};

flagging = (message) => {
  parentPort.postMessage(["flag", message]);
};

terminatingWorker = (inspectedLink) => {
  inspectedLink._id = inspectedLink._id.toString();
  parentPort.postMessage(["termination", inspectedLink]);
};
