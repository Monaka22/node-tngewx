const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const isAuth = require("../middleware/auth.js");
const bankController = require("../controllers/banksController/bankController");

router.get(
  "/:brandId/all",
  isAuth.checkToken,
  isAuth.getLineId,
  bankController.getBanks
);
router.get(
  "/:id",
  isAuth.checkToken,
  isAuth.getLineId,
  bankController.getBankById
);

router.post(
  "/create",
  isAuth.checkToken,
  isAuth.getLineId,
  [
    body("brandId")
      .isInt()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
  ],
  bankController.createBankAccount
);
router.put(
  "/:id/edit",
  isAuth.checkToken,
  isAuth.getLineId,
  [
    body("bankAccountNo")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("accountName")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("bankName")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("brandId")
      .isInt()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    param("id").isInt().withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง").not().isEmpty(),
  ],
  bankController.editBankAccount
);
router.delete(
  "/:id/delete",
  isAuth.checkToken,
  isAuth.getLineId,
  [param("id").isInt().withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง").not().isEmpty()],
  bankController.deleleBankAccount
);

module.exports = router;
