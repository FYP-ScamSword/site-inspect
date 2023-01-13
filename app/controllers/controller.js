const { Worker } = require("worker_threads");
const isUrl = require("is-url");
const request = require("request");
const whoiser = require("whoiser");

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

  const worker = new Worker("./app/controllers/inspectionWorker.js", {workerData: {url: url}});

  worker.once("message", result => {
    console.log("result" + result);
  });

  worker.on("error", error => {
      console.log(error);
  });

  worker.on("exit", exitCode => {
      console.log(`It exited with code ${exitCode}`);
  })

  res.send({
    message:"success"
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