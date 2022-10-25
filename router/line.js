const express = require("express");

const router = express.Router();
const lineController = require("../controllers/lineController/lineController");

router.post("/pushMessageLine", lineController.replyMessage);

module.exports = router;
