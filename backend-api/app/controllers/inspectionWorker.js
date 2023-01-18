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
  inspectLink.domain_age = await obtainDomainAge(url);

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
  parentPort.postMessage([
    "log",
    "processingUrl= ~ unshortenedUrl | " + unshortenedUrl,
  ]);

  /* ------------------------ decode url encoded links ------------------------ */
  const decodedUrl = decodeUrl(unshortenedUrl);
  parentPort.postMessage([
    "log",
    "processingUrl= ~ decodedUrl | " + decodedUrl,
  ]);

  return decodedUrl;
};

obtainDomainAge = async (url) => {
  /* ------------------------------ obtain domain age using whois ------------------------------ */
  const urlObj = new URL(url);
  const urlHostname = urlObj.hostname.startsWith("www.")
    ? urlObj.hostname.slice(4)
    : urlObj.hostname;

  const urlDomainInfo = await whoisLookup(urlHostname);

  /* ------------------------ Calculate the domain age ------------------------ */
  const urlCreatedDate =
    urlDomainInfo[Object.keys(urlDomainInfo)[0]]["Created Date"];

  if (urlCreatedDate) {
    const numDaysOfCreation = moment().diff(moment(urlCreatedDate), "days");
    parentPort.postMessage([
      "log",
      "obtainDomainAge= ~ numDaysOfCreation | " + numDaysOfCreation,
    ]);

    // Flag if domain is less than 3 months old
    if (numDaysOfCreation < 90) {
      parentPort.postMessage(["flag", "- Domain is less than 3 months old."]);
    }

    return numDaysOfCreation;
  } else {
    parentPort.postMessage([
      "log",
      "obtainDomainAge= ~ numDaysOfCreation | Domain not found",
    ]);

    return null;
  }
};

terminatingWorker = (inspectLink) => {
  inspectLink._id = inspectLink._id.toString();
  parentPort.postMessage(["termination", inspectLink]);
};

startLinkInspection(workerData.url, workerData.inspectLink);
