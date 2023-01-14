const { Worker } = require("worker_threads");
const isUrl = require("is-url");
const request = require("request");
const whoiser = require("whoiser");
const fetch = require("node-fetch");

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

  const worker = new Worker("./app/controllers/inspectionWorker.js", {
    workerData: { url: url },
  });

  worker.once("message", (result) => {
    console.log("result" + result);
  });

  worker.on("error", (error) => {
    console.log(error);
  });

  worker.on("exit", (exitCode) => {
    console.log(`It exited with code ${exitCode}`);
  });

  res.send({
    message: "success",
  });
};

exports.checkIsUrl = (url) => {
  return isUrl(url);
};

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

exports.decodeUrl = (url) => {
  return decodeURIComponent(url);
};

exports.whoisLookup = async (url) => {
  let domainInfo = await whoiser(url);

  return domainInfo;
};

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
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(
    "🚀 ~ file: controller.js:111 ~ exports.googleSafeLookupAPI= ~ data",
    data
  );

  if (Object.keys(data).length == 0)
    console.log("no output from safe browsing lookup api");
};

exports.googleWebRiskLookupAPI = async (url) => {
  const response = await fetch(
    `https://webrisk.googleapis.com/v1/uris:search?threatTypes=SOCIAL_ENGINEERING&threatTypes=MALWARE&uri=${url}&key=` +
      process.env.GOOGLE_API_KEY
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(
    "🚀 ~ file: controller.js:132 ~ exports.googleWebRiskLookupAPI= ~ data",
    data
  );

  if (Object.keys(data).length == 0)
    console.log("no output from web risk lookup api");
};
