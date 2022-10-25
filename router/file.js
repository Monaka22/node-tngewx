const express = require("express");
const router = express.Router();
const path = require("path");
const isAuth = require("../middleware/auth.js");
const AWS = require("../middleware/aws");

router.post("/upload", isAuth.checkToken, isAuth.getLineId, (req, res) => {
  try {
    const { files } = req.files;
    if (files) {
      const nameImgProfile = `${AWS.uuidCreateName()}${path.extname(
        files.name
      )}`;
      AWS.compressImage(files, 65)
        .then(async (objFile) => {
          const result = await AWS.uploadFile(
            objFile,
            nameImgProfile,
            "brands"
          );
          res.status(200).send({
            result: result.key,
            message: "อัพโหลดสำเร็จ ",
          });
        })
        .catch((err) => {
          res.status(400).send({
            message: err,
          });
        });
    } else {
      res.status(400).send({
        message: "กรุณาอัพโหลดไฟล์",
      });
    }
  } catch (error) {
    res.status(400).send({
      message: error || "Some error occurred while creating the User.",
    });
  }
});

router.post("/url", async (req, res) => {
  try {
    const { fileName } = req.body;
    const url = await AWS.getUrlFromBucket(fileName);
    res.status(200).send({
      url,
    });
  } catch (error) {
    res.status(400).send({
      message: error || "Some error occurred while creating the User.",
    });
  }
});

router.post("/qrcode", (req, res) => {
  try {
    const { files } = req.files;
    if (files) {
      AWS.compressImage(files, 65)
        .then(async (objFile) => {
          const Jimp = require("jimp");
          const QrCode = require("qrcode-reader");
          const img = await Jimp.read(objFile.data);
          img.getBuffer(Jimp.MIME_PNG, (err, bufferCover) => {
            Jimp.read(bufferCover, function (err, image) {
              if (err) {
                console.error(err);
                resolve(null);
              }
              const qr = new QrCode();
              qr.callback = function (err, value) {
                if (err) {
                  console.error(err);
                  resolve(null);
                }
                if (value) {
                  console.log(value.result);
                } else {
                  resolve(null);
                }
              };
              qr.decode(image.bitmap);
            });
          });
        })
        .catch((err) => {
          res.status(400).send({
            message: err,
          });
        });
    } else {
      res.status(400).send({
        message: "กรุณาอัพโหลดไฟล์",
      });
    }
  } catch (error) {
    res.status(400).send({
      message: error || "Some error occurred while creating the User.",
    });
  }
});

module.exports = router;
