const { parentPort } = require("worker_threads");

exports.logging = (message) => {
  parentPort.postMessage(["log", message]);
};

exports.flagging = (message) => {
  parentPort.postMessage(["flag", message]);
};
