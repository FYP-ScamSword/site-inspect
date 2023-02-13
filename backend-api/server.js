const express = require("express");
require("dotenv").config({ path: __dirname + "/.env" });

const app = express();

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");

db.mongoose
  .set("strictQuery", true)
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database in server.js!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database in server.js!", err);
    process.exit();
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Server is up and running." });
});

// include routes
require("./app/routes/routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
