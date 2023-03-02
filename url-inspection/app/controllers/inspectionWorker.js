const moment = require("moment");
const { parentPort, workerData } = require("worker_threads");
const {
  decodeUrl,
  unshortenUrl,
  whoisLookup,
  googleSafeLookupAPI,
  googleWebRiskLookupAPI,
} = require("./inspection.controller");
const db = require("../models");
const InspectLinks = db.inspected_links;
const KnownSites = db.cybersquat_known_sites;
const KeywordBlacklist = db.keyword_blacklist;
const parse = require("parse-domains");
const {
  checkTyposquattingBitsquatting,
  checkLevelsquattingCombosquatting,
  checkHomographsquatting,
} = require("./cybersquat.controller");
const {
  cybersquattingCheckStringsLog,
  obtainDomainAgeErrorLog,
  obtainDomainAgeLog,
  domainAgeFlag,
  processingUrlUnshortenLog,
  processingUrlDecodeLog,
  calculateRegistrationPeriodLog,
  registrationPeriodFlag,
  calculateRegistrationPeriodErrorLog,
  entropyDetectionDGAFlag,
  entropyDetectionDGALog,
  abnormalStringLenLog,
  abnormalStringLenFlag,
  blacklistedKeywordLog,
  blacklistedKeywordFlag,
} = require("./logging.controller");
const { entropy } = require("./stringSimilarity");
const { calculateRelativeEntropy } = require("./entropy");

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
  inspectedLink.registration_period = whoisUrl["registration_period"];

  /* ------------ Check URL using Google's Safe Browsing Lookup API ----------- */
  await googleSafeLookupAPI(url);

  /* -------------- Check URL using Google's Web Risk Lookup API -------------- */
  await googleWebRiskLookupAPI(url);

  /* ---------------------- Check subdomain string length --------------------- */
  await checkSubdStrLength(url);

  /* ------------------------- Keyword blacklist check ------------------------ */
  await checkKeywordBlacklist(url);

  /* ------------------- Inspecting Link for Cybersquatting ------------------- */
  let cyberSquattingDetected = await checkCybersquatting(url);

  if (!cyberSquattingDetected) inspectedLink.to_flag = false; // means this is a legitimate domain that is kept as a record in our DB, both the SLD and TLD matches hence it is legitimate

  /* ----------- Entropy Check for Domain Generation Algorithm (DGA) ---------- */
  await entropyDGADetection(url);

  inspectedLink.status = "processed";

  // Updating the record in DB with "processed" status as well as processedUrl, calculated domain age.
  await InspectLinks.findByIdAndUpdate(inspectedLink._id, inspectedLink, {
    useFindAndModify: false,
  });

  terminatingWorker(inspectedLink);

  db.mongoose.disconnect();
};

processingUrl = async (url) => {
  /* ------------------ unshorten url and count redirections ------------------ */
  const unshortenedUrl = await unshortenUrl(url);
  processingUrlUnshortenLog(processingUrl.name, unshortenedUrl);

  /* ------------------------ decode url encoded links ------------------------ */
  const decodedUrl = decodeUrl(unshortenedUrl);
  processingUrlDecodeLog(processingUrl.name, decodedUrl);

  return decodedUrl;
};

obtainWhoisInfo = async (url) => {
  /* ------------------------------ obtain domain age using whois ------------------------------ */
  const urlObj = new URL(url);
  const urlHostname = urlObj.hostname.startsWith("www.")
    ? urlObj.hostname.slice(4)
    : urlObj.hostname;

  var whoisUrl = {
    domain_age: null,
    registrar_abuse_contact: null,
    registration_period: null,
  }

  try {
    const urlDomainInfo = await whoisLookup(urlHostname);

    whoisUrl = {
      domain_age: calculateDomainAge(urlDomainInfo),
      registrar_abuse_contact: obtainRegistrar(urlDomainInfo),
      registration_period: calculateDomainRegistrationPeriod(urlDomainInfo),
    };
  } catch (error) {
    console.log(error)
  }

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
      const numDaysOfCreation = moment().diff(
        moment(new Date(urlCreatedDate).toISOString()),
        "days"
      );

      obtainDomainAgeLog(calculateDomainAge.name, numDaysOfCreation);

      // Flag if domain is less than 3 months old
      if (numDaysOfCreation < 90) {
        domainAgeFlag();
      }

      return numDaysOfCreation;
    } catch (error) {
      obtainDomainAgeErrorLog(calculateDomainAge.name, error);

      return null;
    }
  } else {
    obtainDomainAgeLog(calculateDomainAge.name, "Domain not found");

    return null;
  }
};

calculateDomainRegistrationPeriod = (urlDomainInfo) => {
  /* ------------- Calculate the registration period of the domain ------------ */
  const urlCreatedDate =
    urlDomainInfo[Object.keys(urlDomainInfo)[0]]["Created Date"];
  const urlExpiryDate =
    urlDomainInfo[Object.keys(urlDomainInfo)[0]]["Expiry Date"];

  if (urlCreatedDate && urlExpiryDate) {
    try {
      const registrationPeriod = moment(
        new Date(urlExpiryDate).toISOString()
      ).diff(moment(new Date(urlCreatedDate).toISOString()), "days");

      calculateRegistrationPeriodLog(
        calculateDomainRegistrationPeriod.name,
        registrationPeriod
      );

      if (registrationPeriod <= 366) {
        // 366 because of leap year
        // phishing sites usually only register for a year, but legitimate sites will register several years, and in advance
        registrationPeriodFlag();
      }

      return registrationPeriod;
    } catch (error) {
      calculateRegistrationPeriodErrorLog(
        calculateDomainRegistrationPeriod.name,
        error
      );
      return null;
    }
  } else {
    calculateRegistrationPeriodLog(
      calculateDomainRegistrationPeriod.name,
      "Domain not found"
    );

    return null;
  }
};

entropyDGADetection = async (url) => {
  let parsedUrl = await parse(url);

  urlToCheck = parsedUrl.hostname.replace(`.${parsedUrl.tld}`, "");
  if (urlToCheck.startsWith("www.")) urlToCheck = urlToCheck.slice(4);
  stringsToCheck = urlToCheck.split(".");

  let entropyDetected = false;

  for (var i = 0; i < stringsToCheck.length; i++) {
    let entropyScore = calculateRelativeEntropy(stringsToCheck[i]);
    entropyDetectionDGALog(entropyDGADetection.name, stringsToCheck[i], entropyScore);

    if (entropyScore > 3.5) {
      entropyDetected = true;
      entropyDetectionDGAFlag(stringsToCheck[i], entropyScore);
    }
  }

  return entropyDetected;
};

checkSubdStrLength = async (url) => {
  let parsedDomain = await parse(url);

  const checkStrings = parsedDomain.subdomain
    .split(".")
    .concat(parsedDomain.siteName)
    .filter((str) => str !== "");

  for (let i = 0; i < checkStrings.length; i++) {
    abnormalStringLenLog(checkSubdStrLength.name, checkStrings[i]);
    if (checkStrings[i].length >= 15) {
      abnormalStringLenFlag(checkStrings[i]);
    }
  }
};

checkKeywordBlacklist = async (url) => {
  var blacklist = await KeywordBlacklist.find({});
  blacklist = blacklist.map((record) => record.blacklist_keyword);

  for (let i = 0; i < blacklist.length; i++) {
    blacklistedKeywordLog(checkKeywordBlacklist.name, blacklist[i]);
    if (url.includes(blacklist[i])) {
      blacklistedKeywordFlag(blacklist[i]);
    }
  }
};

/* -------------------------------------------------------------------------- */
/*                            Cybersquatting Checks                           */
/* -------------------------------------------------------------------------- */
checkCybersquatting = async (url) => {

  /* ---------------------- Check For Homographsquatting ---------------------- */
  const homographProcessedUrl = checkHomographsquatting(url);

  let homographDetected = homographProcessedUrl !== url;
  url = homographProcessedUrl;

  let parsedDomain = await parse(url);

  // checkStrings will comprise of the subdomain and the site name:
  // e.g. internet-banking.dhs.com.sg
  // checkStrings = [internet, banking, dhs]
  const checkStrings = url.replace(parsedDomain.protocol, "").slice(2)
    .split(/[-./]/)
    .concat(parsedDomain.siteName)
    .filter((str) => str !== "");

  cybersquattingCheckStringsLog(checkCybersquatting.name, checkStrings);

  /* --------------- Check For Levelsquatting or Combosquatting --------------- */
  const trademarks = await KnownSites.find({});
  const levelCombosquattingDetected = await checkLevelsquattingCombosquatting(
    trademarks,
    parsedDomain.hostname,
    homographDetected
  );

  if (levelCombosquattingDetected) return true;
  else if (levelCombosquattingDetected == null) return false; //is a legitimate domain, stop the checks

  /* ---- Check for Typosquatting/Bitsquatting with string similarity algos --- */
  const typoBitsquattingDetected = checkTyposquattingBitsquatting(
    trademarks,
    checkStrings
  );

  if (typoBitsquattingDetected) return true;
};

terminatingWorker = (inspectedLink) => {
  inspectedLink._id = inspectedLink._id.toString();
  parentPort.postMessage(["termination", inspectedLink]);
};
