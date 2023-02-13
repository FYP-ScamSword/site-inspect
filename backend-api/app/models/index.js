const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = process.env.DBCONN;
db.inspected_links = require("./inspectedLink.model.js")(mongoose);
db.cybersquat_known_sites = require("./knownSite.model.js")(mongoose);

module.exports = db;