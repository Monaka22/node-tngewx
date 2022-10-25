const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const isAuth = require("../middleware/auth.js");
const brandsController = require("../controllers/brandsController/brandsController");
router.post(
  "/create",
  isAuth.checkToken,
  isAuth.getLineId,
  brandsController.createBrand
);

router.put(
  "/:id/edit",
  isAuth.checkToken,
  isAuth.getLineId,
  [
    body("brandName")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("brandType")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("brandComment")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("businessType")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("brandTel")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
  ],
  brandsController.editBrand
);
router.get(
  "/:userId/user",
  isAuth.checkToken,
  isAuth.getLineId,
  brandsController.getBrands
);
router.get(
  "/:id",
  isAuth.checkToken,
  isAuth.getLineId,
  brandsController.getBrandsById
);

router.get(
  "/transaction/report",
  isAuth.checkToken,
  isAuth.getLineId,
  brandsController.getReport
);

router.get(
  "/transaction/report/toexcel",
  isAuth.checkToken,
  isAuth.getLineId,
  brandsController.getReportToExcel
);

router.get(
  "/transaction/report/only",
  isAuth.checkToken,
  isAuth.getLineId,
  brandsController.getReportOne
);

router.delete(
  "/:id/delete",
  isAuth.checkToken,
  isAuth.getLineId,
  brandsController.deleteBrand
);

router.put(
  "/:id/renew/:packageId",
  isAuth.checkToken,
  isAuth.getLineId,
  brandsController.renew
);

router.put(
  "/:id/change/:packageId",
  isAuth.checkToken,
  isAuth.getLineId,
  brandsController.change
);
module.exports = router;
