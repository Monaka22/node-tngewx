require("dotenv").config();
const sharp = require("sharp");
const S3 = require("aws-sdk/clients/s3");
const Jimp = require("jimp");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const uuidCreateName = () =>
  uuidv4({
    msecs: moment.unix(),
  });

const compressImage = (file, quality) =>
  new Promise((resolve, reject) => {
    let mimetype;
    if (file.mimetype === "image/jpeg") {
      mimetype = Jimp.MIME_JPEG;
    } else if (file.mimetype === "image/webp") {
      reject("Unsupported MIME type: image/webp");
    } else if (file.mimetype === "image/png") {
      mimetype = Jimp.MIME_PNG;
    } else {
      reject("Not Image File");
    }
    Jimp.read(file.data, (error, image) => {
      if (error) {
        reject(error);
      } else {
        image
          .quality(quality) // set JPEG quality
          .getBuffer(mimetype, (error, buffer) => {
            if (error) {
              reject(error);
            } else {
              sharp(buffer)
                .resize(800)
                .toBuffer()
                .then((dataResize) => {
                  resolve({
                    name: file.name,
                    mimetype: file.mimetype,
                    data: dataResize,
                  });
                })
                .catch((err) => {
                  reject(err);
                });
            }
          });
      }
    });
  });

const compressQRcode = (file, quality) =>
  new Promise((resolve, reject) => {
    Jimp.read(file, (error, image) => {
      if (error) {
        reject(error);
      } else {
        image
          .quality(quality) // set JPEG quality
          .getBuffer("image/jpeg", (error, buffer) => {
            if (error) {
              reject(error);
            } else {
              sharp(buffer)
                .resize(800)
                .toBuffer()
                .then((dataResize) => {
                  resolve({
                    name: uuidCreateName(),
                    mimetype: "image/jpeg",
                    data: dataResize,
                  });
                })
                .catch((err) => {
                  reject(err);
                });
            }
          });
      }
    });
  });

// uploads a file to s3
function uploadFile(objFileData, imgName, folder) {
  const fileName = `${folder}/${imgName}`;
  const fileUpload = objFileData.data;

  const uploadParams = {
    Bucket: bucketName,
    Body: fileUpload,
    Key: fileName,
  };
  return s3.upload(uploadParams).promise();
}

function uploadFileXlsx(objFileData, imgName, folder) {
  const fileName = `${folder}/${imgName}`;
  const fileUpload = objFileData;

  const uploadParams = {
    Bucket: bucketName,
    Body: fileUpload,
    ContentType: "application/vnd.ms-excel",
    Key: fileName,
  };
  return s3.upload(uploadParams).promise();
}

// downloads a file from s3
function getUrlFromBucket(fileName) {
  const url = s3.getSignedUrl("getObject", {
    Bucket: bucketName,
    Key: fileName,
    Expires: 60 * 5,
  });
  return url;
}

module.exports = {
  getUrlFromBucket,
  compressImage,
  uploadFile,
  uuidCreateName,
  compressQRcode,
  uploadFileXlsx,
};
