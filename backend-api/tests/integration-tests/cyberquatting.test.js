const db = require("../../app/models");
const cybersquatController = require("../../app/controllers/cybersquat.controller");

var knownSites = [
  {
    url: "https://www.dbs.com.sg",
    organization: "DBS Bank Ltd",
    keyword: "dbs",
  },
  {
    url: "https://www.paypal.com",
    organization: "PayPal Holdings, Inc.",
    keyword: "paypal",
  },
  {
    url: "https://www.apple.com",
    organization: "Apple Inc.",
    keyword: "apple",
  },
  {
    url: "https://www.amazon.sg",
    organization: "Amazon.com, Inc.",
    keyword: "amazon",
  }
];

describe("Link Inspection Cybersquatting", () => {
  beforeAll(async () => {
    await db.mongoose
      .set("strictQuery", true)
      .connect("mongodb://mongodb:27017/test", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .catch((err) => {
        console.log("Cannot connect to the database!", err);
        process.exit();
      });

    await db.cybersquat_known_sites.insertMany(knownSites);
  });

  // run before each test
  afterAll(async () => {
    await db.cybersquat_known_sites.deleteMany({});
    await db.mongoose.disconnect();
  });

  it("Should detect levelsquatting or combosquatting", () => {
    db.cybersquat_known_sites.find({}).then((records) => {
      // positive records
      expect(cybersquatController.checkLevelsquattingCombosquatting(records, "bankd.bs.com")).toStrictEqual([true, " dbs"]);
      expect(cybersquatController.checkLevelsquattingCombosquatting(records, "db.sbank.com")).toStrictEqual([true, " dbs"]);
      expect(cybersquatController.checkLevelsquattingCombosquatting(records, "db-sbank.com")).toStrictEqual([true, " dbs"]);
      expect(cybersquatController.checkLevelsquattingCombosquatting(records, "db-s.bank.com")).toStrictEqual([true, " dbs"]);
      expect(cybersquatController.checkLevelsquattingCombosquatting(records, "dbsbank.com")).toStrictEqual([true, " dbs"]);
      expect(cybersquatController.checkLevelsquattingCombosquatting(records, "dbs.bank.com")).toStrictEqual([true, " dbs"]);
      expect(cybersquatController.checkLevelsquattingCombosquatting(records, "amazon.dbs.com")).toStrictEqual([true, " dbs amazon"]);

      // negative records
      expect(cybersquatController.checkLevelsquattingCombosquatting(records, "dhs.bank.com")).toStrictEqual([false, null]);
      expect(cybersquatController.checkLevelsquattingCombosquatting(records, "amazn.ds.com")).toStrictEqual([false, null]);
      expect(cybersquatController.checkLevelsquattingCombosquatting(records, "amazodbns.com")).toStrictEqual([false, null]);
    });
  });

  it("Should detect typosquatting or bitsquatting", () => {
    db.cybersquat_known_sites.find({}).then((records) => {
      // positive records
      expect(cybersquatController.checkTyposquattingBitsquatting(records, ["internet", "banking", "dhs"])[0]).toBe(true);
      expect(cybersquatController.checkTyposquattingBitsquatting(records, ["amaz0n", "dhs"])[0]).toBe(true);
      expect(cybersquatController.checkTyposquattingBitsquatting(records, ["amaz0n", "internet"])[0]).toBe(true);
      expect(cybersquatController.checkTyposquattingBitsquatting(records, ["amaz0n"])[0]).toBe(true);

      // negative records
      expect(cybersquatController.checkTyposquattingBitsquatting(records, ["internet", "banking", "dhh"])[0]).toBe(false);
      expect(cybersquatController.checkTyposquattingBitsquatting(records, ["4m4z0n"])[0]).toBe(false);
    });
  });
});
