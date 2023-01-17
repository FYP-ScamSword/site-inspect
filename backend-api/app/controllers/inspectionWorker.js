const moment = require("moment");
const { parentPort, workerData } = require("worker_threads");
const {
  decodeUrl,
  unshortenUrl,
  whoisLookup,
  googleSafeLookupAPI,
  googleWebRiskLookupAPI,
} = require("./controller");
const db = require("../models");
const InspectLink = db.inspected_links;

db.mongoose
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
  inspectLink = new InspectLink(inspectLink);
  await inspectLink.save(); // add new entry to DB with status "processing"

  /* ----------------------------- Processing URL ----------------------------- */
  url = await processingUrl(url);

  inspectLink["_doc"].processed_url = url;

  /* ------------------- Check number of days since creation ------------------ */
  inspectLink["_doc"].domain_age = await obtainDomainAge(url);

  /* ------------ Check URL using Google's Safe Browsing Lookup API ----------- */
  await googleSafeLookupAPI(url);

  /* -------------- Check URL using Google's Web Risk Lookup API -------------- */
  await googleWebRiskLookupAPI(url);

  inspectLink["_doc"].status = "processed";

  // Updating the record in DB with "processed" status as well as processedUrl, calculated domain age.
  await InspectLink.findByIdAndUpdate(
    inspectLink["_doc"]._id,
    inspectLink["_doc"],
    { useFindAndModify: false }
  );

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

    if (numDaysOfCreation < 14) {
      parentPort.postMessage(["flag", "- Domain is less than 2 weeks old."]);
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

startLinkInspection(workerData.url, workerData.inspectLink);
