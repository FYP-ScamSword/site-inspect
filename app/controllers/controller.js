const isUrl = require("is-url");
const { tall } = require('tall');

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

  url = await this.unshortenUrl(url);
  console.log("🚀 ~ file: controller.js:24 ~ exports.inspectLink= ~ url", url)
  decodedUrl = this.decodeUrl(url);
  console.log("🚀 ~ file: controller.js:25 ~ exports.inspectLink= ~ decodedUrl", decodedUrl)


  res.status(200).send({
    message: "success"
  });
};

exports.unshortenUrl = async (url) => {
  try {
    const unshortenedUrl = await tall(
      url
    )

    return unshortenedUrl;
  } catch (err) {
    console.error(err);

    return url;
  }
};

exports.decodeUrl = (url) => {
  return decodeURIComponent(url);
}

exports.checkIsUrl = (url) => {
  return isUrl(url);
}
