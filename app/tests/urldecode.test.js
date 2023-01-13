const controller = require("../controllers/controller");

it("should decode an encoded url", () => {
  const decodedUrl = controller.decodeUrl(
    "https://www.google.com/search%3Fq%3Dgeeks%20for%20geeks"
  );

  expect(decodedUrl).toBe("https://www.google.com/search?q=geeks for geeks");
});
