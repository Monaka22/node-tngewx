const express = require('express');
const Sequelize = require('sequelize');

const router = express.Router();

const env = process.env.NODE_ENV;
const config = require(__dirname + '/../config/db.config.js')[env];

router.all('/', ((req, res, next) => {
  res.status(200).json({
    status: 'Ok',
  });
}));
router.all('/CheckDB', ((req, res, next) => {
  const sequelize = new Sequelize(config);
  sequelize
    .authenticate()
    .then(() => {
      res.status(200).json({
        status: 'Connection has been established successfully.',
      });
    })
    .catch((err) => {
      next(err);
    });
}));
router.all('/Starting', ((req, res, next) => {
  res.status(200).json({
    status: 'Starting',
  });
}));
router.all('/Up', ((req, res, next) => {
  res.status(200).json({
    status: 'Up',
  });
}));
router.all('/Stopping', ((req, res, next) => {
  res.status(200).json({
    status: 'Stopping',
  });
}));
router.all('/Down', ((req, res, next) => {
  res.status(503).json({
    status: 'Down',
  });
}));
router.all('/Errored', ((req, res, next) => {
  res.status(500).json({
    status: 'Errored',
  });
}));

module.exports = router;
