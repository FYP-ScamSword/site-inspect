const controller = require("../controllers/controller");

it("should unshorten a shortened URL", async () => {
  const unshortenedURL = await controller.unshortenUrl("https://bit.ly/3GCJYqi");

  expect(unshortenedURL).toBe(
    "https://google.com/"
  );
});

it("should return the same url if it cannot be unshortened", async () => {
  const originalURL = "https://www.google.com/";
  const unshortenedURL = await controller.unshortenUrl(originalURL);

  expect(unshortenedURL).toBe(
    originalURL
  );
});
