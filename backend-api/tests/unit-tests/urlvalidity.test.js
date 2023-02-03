const controller = require("../../app/controllers/inspection.controller");

it("should check if a url is valid", async () => {
  expect(controller.checkIsUrl("google")).toBe(false);
  expect(controller.checkIsUrl("http:/google.com")).toBe(false);
  expect(controller.checkIsUrl("http://google")).toBe(false);
  expect(controller.checkIsUrl("https://google.com")).toBe(true);
  expect(controller.checkIsUrl("ftp://google.com")).toBe(true);
  expect(controller.checkIsUrl("http://www.google.com")).toBe(true);
});
