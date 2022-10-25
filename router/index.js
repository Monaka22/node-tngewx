const express = require("express");

const router = express.Router();
const healthz = require("./healthz");
const userRouter = require("./user");
const brandRouter = require("./brand");
const branchRouter = require("./branch");
const bankRouter = require("./bank");
const lineRouter = require("./line");
const fileRouter = require("./file");

router.all("/", (req, res) => {
  res.send(
    `<div style="margin: auto; width: 50%; padding: 10px">
            <h1>Welcome to The API</h1>
            <p>You Should call the customer services</p>
            <p style="color: tomato">You have permission denied!</p>
            <p>${req.hostname}${req.baseUrl.toString()}</p>
        </div>`
  );
});

router.use("/user", userRouter);
router.use("/brand", brandRouter);
router.use("/branch", branchRouter);
router.use("/bank", bankRouter);
router.use("/line", lineRouter);
router.use("/file", fileRouter);

router.use("/healthz", healthz);
router.get("/test", (req, res) => {
  res.send(
    `<div style="margin: auto; width: 50%; padding: 10px">
            <h1>Welcome to The API</h1>
            <p>You Should call the customer services</p>
            <p style="color: tomato">You have permission denied!</p>
            <p>${req.hostname}${req.baseUrl.toString()}</p>
        </div>`
  );
});

module.exports = router;
