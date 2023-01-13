const { tall } = require('tall');

exports.inspectLink = async (req, res) => {
  // Validate request
  if (!req.body.inspectURL) {
    res.status(400).send({
      message: "Link to be inspected must be provided.",
    });

    return;
  }

  var url = req.body.inspectURL;

  url = await this.unshortenUrl(url);
  console.log("🚀 ~ file: controller.js:24 ~ exports.inspectLink= ~ url", url)

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
