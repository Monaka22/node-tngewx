require("dotenv").config();
const request = require("request");
// eslint-disable-next-line consistent-return
const checkToken = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    request(
      {
        url: `https://api.line.me/oauth2/v2.1/verify`,
        method: "GET",
        qs: {
          access_token: token,
          // client_id: process.env.LINE_LOGIN_CHANNEL_ID,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
      (error, response, body) => {
        if (error) {
          return next({
            status: 401,
            message: "กรุณาล็อกอินใหม่อีกครั้ง",
            error: error,
          });
        } else if (response.statusCode === 200) {
          const data = JSON.parse(body);
          if (data.client_id === process.env.LINE_LOGIN_CHANNEL_ID) {
            return next();
          } else {
            return next({
              status: 401,
              message: "กรุณาล็อกอินใหม่อีกครั้ง",
              error: error,
            });
          }
        } else {
          return next({
            status: 401,
            message: "กรุณาล็อกอินใหม่อีกครั้ง",
            error: error,
          });
        }
      }
    );
  } else {
    let error = new Error("กรุณาล็อกอินใหม่อีกครั้ง");
    error.status = 401;
    error.error = "No header.";
    return next(error);
  }
};

// eslint-disable-next-line consistent-return
const getLineId = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    request(
      {
        url: "https://api.line.me/v2/profile",
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
      (error, response, body) => {
        if (error) {
          return next({
            status: 401,
            message: "กรุณาล็อกอินใหม่อีกครั้ง",
            error: error,
          });
        } else if (response.statusCode === 200) {
          const data = JSON.parse(body);
          req.user = data;
          return next();
        } else {
          return next({
            status: 401,
            message: "กรุณาล็อกอินใหม่อีกครั้งsss",
            error: error,
          });
        }
      }
    );
  } else {
    let error = new Error("กรุณาล็อกอินใหม่อีกครั้ง");
    error.status = 401;
    error.error = "No header.";
    return next(error);
  }
};

module.exports = {
  checkToken,
  getLineId,
};
