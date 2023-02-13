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
const parse = require("parse-domains");
const {
  checkTyposquattingBitsquatting,
  checkLevelsquattingCombosquatting,
} = require("./cybersquat.controller");
const { logging, flagging } = require("./logging.controller");

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
  let cyberSquattingDetected = await checkCybersquatting(url);

  if (!cyberSquattingDetected) inspectedLink.toFlag = false; // means this is a legitimate domain that is kept as a record in our DB, both the SLD and TLD matches hence it is legitimate

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
      const numDaysOfCreation = moment().diff(
        moment(new Date(urlCreatedDate).toISOString()),
        "days"
      );
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

  // checkStrings will comprise of the subdomain and the site name:
  // e.g. internet-banking.dhs.com.sg
  // checkStrings = [internet, banking, dhs]
  const checkStrings = parsedDomain.subdomain
    .split("-")
    .concat(parsedDomain.siteName)
    .filter((str) => str !== "");

  logging(`checkCybersquatting= ~checkStrings | ${checkStrings}`);

  /* --------------- Check For Levelsquatting or Combosquatting --------------- */
  const trademarks = await KnownSites.find({});
  const levelCombosquattingDetected = await checkLevelsquattingCombosquatting(
    trademarks,
    parsedDomain.hostname
  );

  if (levelCombosquattingDetected[0]) {
    logging(
      `checkLevelsquattingCombosquatting= ~trademark |${levelCombosquattingDetected[1]}`
    );

    flagging(
      `- Levelsquatting/Combosquatting Detected\n\t- Direct usage of trademark(s) {${levelCombosquattingDetected[1]} } found`
    );

    return true;
  } else {
    if (levelCombosquattingDetected[1] == "legit") {
      logging(
        `checkLevelsquattingCombosquatting= ~This is a legitimate domain.`
      );
      return false;
    }
  }

  /* ---- Check for Typosquatting/Bitsquatting with string similarity algos --- */
  const typoBitsquattingDetected = checkTyposquattingBitsquatting(
    trademarks,
    checkStrings
  );

  logging(typoBitsquattingDetected[1]);

  if (typoBitsquattingDetected[0]) {
    flagging(typoBitsquattingDetected[2]);

    return true;
  }
};

terminatingWorker = (inspectedLink) => {
  inspectedLink._id = inspectedLink._id.toString();
  parentPort.postMessage(["termination", inspectedLink]);
};
