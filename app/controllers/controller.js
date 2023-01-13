const isUrl = require("is-url");
const request = require("request");

exports.inspectLink = async (req, res) => {
  // Validate request
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
  
  // unshorten url
  url = await this.unshortenUrl(url);
  console.log("🚀 ~ file: controller.js:25 ~ exports.inspectLink= ~ url", url)

  // decode url encoded links
  decodedUrl = this.decodeUrl(url);
  console.log("🚀 ~ file: controller.js:29 ~ exports.inspectLink= ~ decodedUrl", decodedUrl)

  res.status(200).send({
    message: "success",
  });
};

exports.unshortenUrl = async (url) => {
  const options = {
    url: url,
    followRedirect: false
  };

  // Return new promise
  return new Promise(function(resolve, reject) {
    request.get(options, function(err, resp, body) {
      if (err) {
        console.log(err); // log the error
        resolve(url); // return the original url back
      } else {
        if (resp.headers.location == null) resolve(url);
        else resolve(resp.headers.location);
      }
    })
  });
};

exports.decodeUrl = (url) => {
  return decodeURIComponent(url);
};

exports.checkIsUrl = (url) => {
  return isUrl(url);
};
