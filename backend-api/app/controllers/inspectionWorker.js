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
const InspectLink = db.inspected_links;

db.mongoose
  .set("strictQuery", true)
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

startLinkInspection = async (url, inspectLink) => {
  const inspectLinkObj = await new InspectLink(inspectLink).save(); // add new entry to DB with status "processing"
  inspectLink._id = inspectLinkObj["_id"];

  /* ----------------------------- Processing URL ----------------------------- */
  url = await processingUrl(url);

  inspectLink.processed_url = url;

  /* ------------------- Check number of days since creation ------------------ */
  const whoisUrl = await obtainWhoisInfo(url);
  inspectLink.domain_age = whoisUrl["domain_age"];
  inspectLink.registrar_abuse_contact = whoisUrl["registrar_abuse_contact"];

  /* ------------ Check URL using Google's Safe Browsing Lookup API ----------- */
  await googleSafeLookupAPI(url);

  /* -------------- Check URL using Google's Web Risk Lookup API -------------- */
  await googleWebRiskLookupAPI(url);

  inspectLink.status = "processed";

  // Updating the record in DB with "processed" status as well as processedUrl, calculated domain age.
  await InspectLink.findByIdAndUpdate(inspectLink._id, inspectLink, {
    useFindAndModify: false,
  });

  terminatingWorker(inspectLink);

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

logging = (message) => {
  parentPort.postMessage(["log", message]);
};

flagging = (message) => {
  parentPort.postMessage(["flag", message]);
};

terminatingWorker = (inspectLink) => {
  inspectLink._id = inspectLink._id.toString();
  parentPort.postMessage(["termination", inspectLink]);
};

startLinkInspection(workerData.url, workerData.inspectLink);
