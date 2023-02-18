const isUrl = require("is-url");
const whoiser = require("whoiser");
const fetch = require("node-fetch");
const parse = require("parse-domains");
var unshort = require("unshort-tracer");
const {
  googleSafeLookupAPILog,
  googleSafeLookupAPIErrorLog,
  googleSafeLookupAPINoResultsLog,
  googleSafeLookupAPIFlag,
  googleWebRiskLookupAPIErrorLog,
  googleWebRiskLookupAPILog,
  googleWebRiskLookupAPINoResultsLog,
  googleWebRiskLookupAPIFlag,
  processingUrlCountRedirectsLog,
  processingUrlRedirectsLog,
  abnormalNumRedirections,
} = require("./logging.controller");

/* ------------------------- Checks if URL is valid ------------------------- */
exports.checkIsUrl = (url) => {
  return isUrl(url);
};

/* ------------ Unshorten any shortened URLs, e.g. bit.ly, goo.gl ----------- */
exports.unshortenUrl = async (url) => {
  try {
    let urls = await unshort(this.decodeUrl(url));
    processingUrlRedirectsLog("unshortenUrl", urls);

    let numRedirections = urls.length - 1;
    processingUrlCountRedirectsLog("unshortenUrl", numRedirections);

    if (numRedirections > 2) {
      abnormalNumRedirections(numRedirections);
    }

    return urls[urls.length - 1];
  } catch (error) {
    processingUrlCountRedirectsLog("unshortenUrl", 0);
    return url;
  }
};

/* ------------------------ Decode URL-encoded links ------------------------ */
exports.decodeUrl = (url) => {
  return decodeURIComponent(url);
};

/* ------------------------- Whois lookup on domain ------------------------- */
exports.whoisLookup = async (url) => {
  let parsedDomain = await parse(url);
  let domainInfo = await whoiser(parsedDomain.domain);

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
    googleSafeLookupAPIErrorLog(response.status);
  }

  const data = await response.json();
  googleSafeLookupAPILog(JSON.stringify(data));

  if (Object.keys(data).length == 0) {
    // no data returned from safe browsing lookup
    googleSafeLookupAPINoResultsLog();
  } else {
    googleSafeLookupAPIFlag(
      data["matches"]
        .map((entry) => {
          return entry.threatType;
        })
        .toString()
    );
  }
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
    googleWebRiskLookupAPIErrorLog(response.status);
  }

  const data = await response.json();
  googleWebRiskLookupAPILog(JSON.stringify(data));

  if (Object.keys(data).length == 0) {
    // no data returned from web risk lookup
    googleWebRiskLookupAPINoResultsLog();
  } else {
    googleWebRiskLookupAPIFlag(data["threat"]["threatTypes"].toString());
  }
};
