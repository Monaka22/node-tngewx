require("dotenv").config();
const express = require("express");
const moment = require("moment");
const log4js = require("log4js");
const json2xls = require("json2xls");

const logger = log4js.getLogger();
logger.level = "debug";
const app = express();
const fileUpload = require("express-fileupload");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const swaggerDocument = YAML.load("./swagger.yaml");
const middleware = require("./middleware/middleware");
const router = require("./router/index");
require("./config/cronjob");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Referrer-Policy", "no-referrer-when-downgrade");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("X-Frame-Options", "SAMEORIGIN");
  res.header(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

app.use(fileUpload({}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(json2xls.middleware);

app.all("/", (req, res, next) => {
  res.json({
    date: moment().format("MMMM Do YYYY, h:mm:ss a"),
    status: "UP",
  });
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api", router);

app.use(middleware.handlerErrorPath);
app.use(middleware.handlerError);

app.listen(process.env.APP_PORT || 3000, () => {
  logger.info("Server start");
});
