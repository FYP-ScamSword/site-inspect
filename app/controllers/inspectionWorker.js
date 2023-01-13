const moment = require("moment");
const { parentPort, workerData } = require("worker_threads");
const { decodeUrl, unshortenUrl, whoisLookup } = require("./controller");

startLinkInspection = async (url) => {
  /* -------------------------------------------------------------------------- */
  /*                               Processing URL                               */
  /* -------------------------------------------------------------------------- */
  url = await processingUrl(url);

  /* -------------------------------------------------------------------------- */
  /*                     Check number of days since creation                    */
  /* -------------------------------------------------------------------------- */
  obtainDomainAge = await obtainDomainAge(url);
}

processingUrl = async (url) => {
  /* ------------------------------ unshorten url ----------------------------- */
  url = await unshortenUrl(url);
  console.log("🚀 ~ file: controller.js:25 ~ exports.inspectLink= ~ url", url);

  /* ------------------------ decode url encoded links ------------------------ */
  decodedUrl = decodeUrl(url);
  console.log(
    "🚀 ~ file: controller.js:29 ~ exports.inspectLink= ~ decodedUrl",
    decodedUrl
  );

  return decodedUrl;
}

obtainDomainAge = async (url) => {
  /* ------------------------------ obtain domain age using whois ------------------------------ */
  const urlObj = new URL(url);
  const urlDomainInfo = await whoisLookup(urlObj.hostname);
  const urlCreatedDate = moment(
    urlDomainInfo[Object.keys(urlDomainInfo)[0]]["Created Date"]
  );

  if (urlCreatedDate) {
    const numDaysOfCreation = moment().diff(urlCreatedDate, "days");
    console.log(
      "🚀 ~ file: controller.js:38 ~ exports.inspectLink= ~ numDaysOfCreation",
      numDaysOfCreation
    );
  }
}

startLinkInspection(workerData.url);