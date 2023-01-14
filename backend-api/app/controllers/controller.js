const { Worker, parentPort } = require("worker_threads");
const isUrl = require("is-url");
const request = require("request");
const whoiser = require("whoiser");
const fetch = require("node-fetch");
const fs = require("fs");
const moment = require("moment");

exports.inspectLink = async (req, res) => {
  /* -------------------------------------------------------------------------- */
  /*                              Validate Request                              */
  /* -------------------------------------------------------------------------- */
  if (!req.body.inspectURL) {
    res.status(400).send({
      message: "Link to be inspected must be provided.",
    });

    return;
  } else if (!this.checkIsUrl(req.body.inspectURL)) {
    res.status(400).send({
      message: "Invalid URL",
    });

    return;
  }

  var url = req.body.inspectURL;

  /* -------------------------------------------------------------------------- */
  /*                             Create new log file                            */
  /* -------------------------------------------------------------------------- */
  const fileName = moment().format("YYYY-MM-DD[_]hh-mm-ss-SSS") + ".txt";
  fs.closeSync(fs.openSync(fileName, "w"));
  var logger = fs.createWriteStream(fileName, {
    flags: "a", // 'a' means appending (old data will be preserved)
  });

  this.writeLine(
    logger,
    `exports.inspectLink= ~ | Starting inspection on ${url}`
  );

  /* -------------------------------------------------------------------------- */
  /*                  Create new Worker Thread to inspect link                  */
  /* -------------------------------------------------------------------------- */
  const worker = new Worker("./app/controllers/inspectionWorker.js", {
    workerData: { url: url },
  });

  worker.on("message", (message) => {
    this.writeLine(logger, message); // receive message on parent port, write message to log file
  });

  worker.on("error", (error) => {
    this.writeLine(logger, error); 
  });

  worker.on("exit", (exitCode) => {
    this.writeLine(logger, "Link inspection completed."); 
  });

  res.send({
    message: "Link inspection request successful.",
  });
};

/* ------------------------- Checks if URL is valid ------------------------- */
exports.checkIsUrl = (url) => {
  return isUrl(url);
};

/* ------------ Unshorten any shortened URLs, e.g. bit.ly, goo.gl ----------- */
exports.unshortenUrl = async (url) => {
  const options = {
    url: url,
    followRedirect: false,
  };

  // Return new promise
  return new Promise(function (resolve, reject) {
    request.get(options, function (err, resp, body) {
      if (err) {
        console.log(err); // log the error
        resolve(url); // return the original url back
      } else {
        if (resp.headers.location == null) resolve(url);
        else resolve(resp.headers.location);
      }
    });
  });
};

/* ------------------------ Decode URL-encoded links ------------------------ */
exports.decodeUrl = (url) => {
  return decodeURIComponent(url);
};

/* ------------------------- Whois lookup on domain ------------------------- */
exports.whoisLookup = async (url) => {
  let domainInfo = await whoiser(url);

  return domainInfo;
};

/* --------------------- Google Safe Browsing Lookup API -------------------- */
exports.googleSafeLookupAPI = async (url) => {
  var req = {
    client: {
      clientId: "ScamSword",
      clientVersion: "1.5.2",
    },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url: url }],
    },
  };

  const response = await fetch(
    "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" +
      process.env.GOOGLE_API_KEY,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    }
  );

  if (!response.ok) {
    parentPort.postMessage(
      "exports.googleSafeLookupAPI= ~ | HTTP error response " + response.status
    );
  }

  const data = await response.json();
  parentPort.postMessage(
    "exports.googleSafeLookupAPI= ~ data | " + JSON.stringify(data)
  );

  if (Object.keys(data).length == 0)
    // no data returned from safe browsing lookup
    parentPort.postMessage(
      "exports.googleSafeLookupAPI= ~ | Google's Safe Browsing Lookup API returned no results."
    );
};

/* ----------------------- Google Web Risk Lookup API ----------------------- */
exports.googleWebRiskLookupAPI = async (url) => {
  const urlObj = new URL(url);
  urlObj.search = "";

  const response = await fetch(
    `https://webrisk.googleapis.com/v1/uris:search?threatTypes=SOCIAL_ENGINEERING&threatTypes=MALWARE&uri=${urlObj.href}&key=` +
      process.env.GOOGLE_API_KEY
  );

  if (!response.ok) {
    parentPort.postMessage(
      "exports.googleSafeLookupAPI= ~ | HTTP error response " + response.status
    );
  }

  const data = await response.json();
  parentPort.postMessage(
    "exports.googleWebRiskLookupAPI= ~ data | " + JSON.stringify(data)
  );

  if (Object.keys(data).length == 0)
    // no data returned from web risk lookup
    parentPort.postMessage(
      "exports.googleWebRiskLookupAPI= ~ | Google's Web Risk Lookup API returned no results."
    );
};

/* ------------------- Appends a new line to the log file ------------------- */
exports.writeLine = (logger, line) =>
  logger.write(`\n${moment().toISOString()} ${line}`);
