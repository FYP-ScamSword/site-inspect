const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = process.env.DBCONN;
db.inspected_links = require("./inspectlink.model.js")(mongoose);

module.exports = db;