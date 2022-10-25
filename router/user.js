const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const isAuth = require("../middleware/auth.js");
const userController = require("../controllers/usersController/userController");

router.get(
  "/auth",
  isAuth.checkToken,
  isAuth.getLineId,
  userController.checkUser
);

router.get(
  "/admins/:id/brand/:brandId",
  isAuth.checkToken,
  isAuth.getLineId,
  [param("id").isInt().withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง").not().isEmpty()],
  userController.getUserAdminById
);

router.get(
  "/admins/:brandId/brand",
  isAuth.checkToken,
  isAuth.getLineId,
  [
    param("brandId")
      .isInt()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
  ],
  userController.getUserAdminsByBrand
);

router.post(
  "/admin",
  isAuth.checkToken,
  isAuth.getLineId,
  [
    body("brandId")
      .isInt()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
  ],
  userController.createAdminToBrand
);
router.put(
  "/admin/:id",
  isAuth.checkToken,
  isAuth.getLineId,
  [
    param("id").isInt().withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง").not().isEmpty(),
    body("lineName")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
  ],
  userController.editAdmin
);
router.put(
  "/admin/:id/:branchId",
  isAuth.checkToken,
  isAuth.getLineId,
  [
    param("id").isInt().withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง").not().isEmpty(),
    body("userName")
      .isString()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("status")
      .isInt()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
  ],
  userController.editAdminBranch
);

router.put(
  "/admin/:id/:brandId/permission",
  isAuth.checkToken,
  isAuth.getLineId,
  [
    param("id").isInt().withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง").not().isEmpty(),
    body("editBrand")
      .isInt()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
    body("inviteUser")
      .isInt()
      .withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง")
      .not()
      .isEmpty(),
  ],
  userController.editPermission
);
router.delete(
  "/admin/:id",
  isAuth.checkToken,
  isAuth.getLineId,
  [param("id").isInt().withMessage("กรุณาใส่ข้อมูลให้ถูกต้อง").not().isEmpty()],
  userController.deleteAdmin
);

module.exports = router;
