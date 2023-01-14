module.exports = app => {
    const controller = require("../controllers/controller.js");
  
    var router = require("express").Router();
  
    // post a request
    router.post("/", controller.inspectLink);
  
    app.use('/api/linkinspect', router);
};