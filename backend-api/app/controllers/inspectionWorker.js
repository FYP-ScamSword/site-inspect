const moment = require("moment");
const { parentPort, workerData } = require("worker_threads");
const {
  decodeUrl,
  unshortenUrl,
  whoisLookup,
  googleSafeLookupAPI,
  googleWebRiskLookupAPI,
} = require("./controller");

startLinkInspection = async (url) => {
  /* ----------------------------- Processing URL ----------------------------- */
  url = await processingUrl(url);

  /* ------------------- Check number of days since creation ------------------ */
  obtainDomainAge = await obtainDomainAge(url);

  /* ------------ Check URL using Google's Safe Browsing Lookup API ----------- */
  await googleSafeLookupAPI(url);

  /* -------------- Check URL using Google's Web Risk Lookup API -------------- */
  await googleWebRiskLookupAPI(url);
};

processingUrl = async (url) => {
  /* ------------------------------ unshorten url ----------------------------- */
  const unshortenedUrl = await unshortenUrl(url);
  parentPort.postMessage("processingUrl= ~ unshortenedUrl | " + unshortenedUrl);

  /* ------------------------ decode url encoded links ------------------------ */
  const decodedUrl = decodeUrl(unshortenedUrl);
  parentPort.postMessage("processingUrl= ~ decodedUrl | " + decodedUrl);

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
    parentPort.postMessage(
      "obtainDomainAge= ~ numDaysOfCreation | " + numDaysOfCreation
    );
  } else {
    parentPort.postMessage(
      "obtainDomainAge= ~ numDaysOfCreation | Domain not found"
    );
  }
};

startLinkInspection(workerData.url);
