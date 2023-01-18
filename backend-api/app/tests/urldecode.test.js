const controller = require("../controllers/inspectionmethods");

it("should decode an encoded url", () => {
  expect(
    controller.decodeUrl(
      "https://www.google.com/search%3Fq%3Dgeeks%20for%20geeks"
    )
  ).toBe("https://www.google.com/search?q=geeks for geeks");

  expect(
    controller.decodeUrl("http://www.google.com:login@%65%76%69%6c%2e%63%6f%6d")
  ).toBe("http://www.google.com:login@evil.com");
});
