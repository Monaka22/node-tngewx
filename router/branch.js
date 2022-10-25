const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const isAuth = require("../middleware/auth.js");
const branchsController = require("../controllers/branchsController/branchsController");

router.get(
  "/:brandId/all",
  isAuth.checkToken,
  isAuth.getLineId,
  branchsController.getBranchs
);

router.get(
  "/:id",
  isAuth.checkToken,
  isAuth.getLineId,
  branchsController.getBranchById
);

router.get(
  "/type/get",
  isAuth.checkToken,
  isAuth.getLineId,
  branchsController.getType
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
    body("userId")
      .isInt()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
  ],
  branchsController.createBranch
);

router.put(
  "/:id/edit",
  isAuth.checkToken,
  isAuth.getLineId,
  [
    body("branchName")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("businessType")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("brandId")
      .isInt()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
  ],
  branchsController.editBranch
);

router.put(
  "/:branchId/bank/:bankId",
  isAuth.checkToken,
  isAuth.getLineId,
  [
    body("status")
      .isInt()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
  ],
  branchsController.connectBank
);

router.delete(
  "/:id/delete",
  isAuth.checkToken,
  isAuth.getLineId,
  branchsController.deleteBranch
);
module.exports = router;
