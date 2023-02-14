const { Worker, parentPort } = require("worker_threads");
const fs = require("fs");
const moment = require("moment");
const prependFile = require("prepend-file");
const AWS = require("aws-sdk");
const db = require("../models");
const { checkIsUrl } = require("./inspection.controller");
const InspectLinks = db.inspected_links;
const { ObjectId } = require("mongodb");

// var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
// AWS.config.credentials = credentials;
const s3 = new AWS.S3();

exports.inspectLink = (req, res) => {
  /* -------------------------------------------------------------------------- */
  /*                              Validate Request                              */
  /* -------------------------------------------------------------------------- */
  if (!req.body.inspectURL) {
    res.status(400).send({
      message: "Link to be inspected must be provided.",
    });

    return;
  } else if (!checkIsUrl(req.body.inspectURL)) {
    res.status(400).send({
      message: "Invalid URL",
    });

    return;
  }

  var url = req.body.inspectURL;

  /* --------------------- Creating an InspectLinks object --------------------- */
  var inspectedLink = {
    processed_url: "",
    original_url: url,
    status: "processing", // status as "processing" to indicate that the processing is still ongoing
    report: "",
    image: "",
    domain_age: null,
    flag_points: 0,
    registrar_abuse_contact: "",
    toFlag: null
  };

  /* -------------------------------------------------------------------------- */
  /*                             Create new log file                            */
  /* -------------------------------------------------------------------------- */
  const fileName = moment().format("YYYY-MM-DD[_]hh-mm-ss-SSS") + ".txt";
  fs.closeSync(fs.openSync(fileName, "w"));
  var logger = fs.createWriteStream(fileName, {
    flags: "a", // 'a' means appending (old data will be preserved)
  });

  writeLine(logger, `---------------- Inspection Logs ----------------`);
  writeLine(logger, `exports.inspectLink= ~ | Starting inspection on ${url}`);

  /* -------------------------------------------------------------------------- */
  /*                  Create new Worker Thread to inspect link                  */
  /* -------------------------------------------------------------------------- */
  const worker = new Worker("./app/controllers/inspectionWorker.js", {
    workerData: { url: url, inspectedLink: inspectedLink },
  });

  worker.on("message", (message) => {
    if (message[0] == "log") {
      // receive message on parent port, write message to log file
      writeLine(logger, message[1]);
    } else if (message[0] == "flag") {
      prependLine(fileName, message[1]);
    } else if (message[0] == "termination") {
      inspectedLink = message[1];
      inspectedLink._id = ObjectId(inspectedLink._id);
    }
  });

  worker.on("error", (error) => {
    writeLine(logger, error);
  });

  worker.on("exit", (exitCode) => {
    console.log(exitCode);
    if (exitCode == 0) {
      writeLine(logger, "Link inspection completed.");
      prependLine(
        fileName,
        "--------------------- Flags ----------------------"
      ).then(() => {
        //configuring parameters
        var params = {
          Bucket: "scam-sword-link-inspection-reports",
          Body: fs.createReadStream(fileName),
          Key: fileName,
        };

        s3.upload(params, function (err, data) {
          //handle error
          if (err) {
            console.log("Error", err);
          }

          //success
          if (data) {
            console.log(inspectedLink._id);
            console.log("Uploaded in:", data.Location);
            fs.unlinkSync(fileName);
            InspectLinks.findOne(
              { _id: inspectedLink._id },
              function (error, record) {
                if (error) console.log(error);
                else {
                  record.report = data.Location;
                  record.save();
                }
              }
            );
          }
        });
      });
    }
  });

  res.send({
    message: "Link inspection request successful.",
  });
};

/* ------------------- Appends a new line to the log file ------------------- */
writeLine = (logger, line) =>
  logger.write(`\n${moment().toISOString()} ${line}`);

/* ------------------- Prepends a new line to the log file ------------------- */
prependLine = (fileName, line) => prependFile(fileName, `${line}\n`);
