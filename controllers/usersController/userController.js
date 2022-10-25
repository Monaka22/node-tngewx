const log4js = require("log4js");
const db = require("../../models");
const AWS = require("../../middleware/aws");
const { getLineId } = require("../lineController/lineController");

const logger = log4js.getLogger();
const UsersAdmin = db.user_admins;
const UserBrand = db.user_brands;
const UserName = db.user_admin_name;
const Brand = db.brands;
const Branch = db.branchs;
const PagekageBrands = db.pagekage_brands;

const checkUser = async (req, res, next) => {
  try {
    UsersAdmin.findAll({
      attributes: ["id", "lineName", "uuidLine", "status"],
      where: { uuidLine: req.user.userId },
    })
      .then((doc) => {
        if (doc.length !== 0) {
          UserBrand.findAll({
            attributes: ["userId", "editBrand", "inviteUser"],
            where: {
              userId: doc[0].id,
              status: 1,
            },
            include: [
              {
                attributes: ["id", "brandName", "brandImage"],
                model: Brand,
                where: {
                  status: 1,
                },
              },
            ],
          })
            .then(async (brands) => {
              const userJons = {
                id: doc[0].id,
                lineName: doc[0].lineName,
                uuidLine: doc[0].uuidLine,
                status: doc[0].status,
                editBrand: brands[0].editBrand || 0,
                inviteUser: brands[0].inviteUser || 0,
              };
              const brandsArray = [];
              for (let i = 0; i < brands.length; i++) {
                const pic =
                  brands[i].dataValues.brands[0].dataValues.brandImage &&
                  brands[i].dataValues.brands[0].dataValues.brandImage !== ""
                    ? (await AWS.getUrlFromBucket(
                        brands[i].dataValues.brands[0].dataValues.brandImage
                      )) || ""
                    : null;
                brandsArray.push({
                  brandImage: pic,
                  id: brands[i].dataValues.brands[0].dataValues.id,
                  brandName:
                    brands[i].dataValues.brands[0].dataValues.brandName,
                });
              }
              res.status(200).send({
                result: userJons,
                message: "find user.",
                brands: brandsArray,
              });
            })
            .catch((err) => {
              res.status(400).send({
                message:
                  err.message || "Some error occurred while finding the user.",
              });
            });
        } else {
          res.status(400).send({
            message: "Not Found user.",
          });
        }
      })
      .catch(async (err) => {
        res.status(400).send({
          message:
            err.message || "Some error occurred while creating the user.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the user.",
    });
  }
};

const getUserAdminsByBrand = async (req, res, next) => {
  try {
    const { brandId } = req.params;
    UserBrand.findAll({
      attributes: [],
      where: { brandId: +brandId, status: 1 },
      include: [
        {
          model: UsersAdmin,
          where: { status: 1 },
        },
      ],
    })
      .then(async (user) => {
        const result = [];
        for (let i = 0; i < user.length; i++) {
          const userData = await getLineId(user[i].user_admin.uuidLine);
          result.push({
            image: userData.pictureUrl,
            id: user[i].user_admin ? user[i].user_admin.id : "",
            lineName: user[i].user_admin ? user[i].user_admin.lineName : "",
            uuidLine: user[i].user_admin ? user[i].user_admin.uuidLine : "",
          });
        }
        res.status(200).send({
          message: "find user.",
          result: result,
        });
      })
      .catch((err) => {
        res.status(400).send({
          message: err.message || "Some error occurred while finding the user.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the user.",
    });
  }
};

const getUserAdminById = async (req, res, next) => {
  try {
    const { id, brandId } = req.params;
    UsersAdmin.findOne({
      attributes: ["id", "lineName", "uuidLine"],
      where: { id },
      include: [
        {
          attributes: ["id", "userId", "userName", "branchId", "status"],
          model: UserName,
        },
        {
          attributes: ["editBrand", "inviteUser"],
          model: UserBrand,
          where: { brandId: brandId },
        },
      ],
    })
      .then(async (user) => {
        const branch = await Branch.findAll({
          attributes: ["id", "branchName", "branchIcon"],
          where: { status: 1, brandId: brandId },
        });
        const branchArray = [];
        await Promise.all([
          branch.forEach(async (doc) => {
            var id = 0;
            var userName = "";
            const statusfetch = await user.user_admin_names.filter((item) => {
              if (item.branchId === doc.id) {
                id = item.branchId;
                userName = item.userName;
                return item.status;
              } else {
                return 0;
              }
            });
            branchArray.push({
              userId: user.id,
              userName: userName,
              branchId: doc.id,
              status: statusfetch[0] ? statusfetch[0].status : 0,
              branchName: doc.branchName,
              branchIcon: doc.branchIcon,
            });
          }),
        ]);
        delete user.dataValues.user_admin_names;
        user.dataValues.user_brands = user.dataValues.user_brands[0] || {};
        res.status(200).send({
          message: "find user.",
          result: user.dataValues,
          branch: branchArray,
        });
      })
      .catch((err) => {
        res.status(400).send({
          message: err.message || "Some error occurred while finding the user.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the user.",
    });
  }
};

const createAdminToBrand = async (req, res, next) => {
  try {
    const { brandId } = req.body;
    const BrandPagekage = await PagekageBrands.findOne({
      where: { brandId: +brandId },
    });
    const Branch = await UserBrand.count({
      where: { brandId: +brandId, status: 1 },
    });
    const countPagekage =
      BrandPagekage.adminNumber === 0
        ? 10000000000000
        : BrandPagekage.adminNumber;
    if (Branch < countPagekage) {
      UsersAdmin.create({
        lineName: "ผู้จัดการสาขาใหม่",
        uuidLine: "",
        status: 0,
      })
        .then((done) => {
          UserBrand.create({
            userId: +done.id,
            brandId: brandId,
            editBrand: 0,
            inviteUser: 0,
            status: 1,
          })
            .then((userBrand) => {
              res.status(200).send({
                result: done,
                message: "เพิ่ม User สำเร็จ ",
                userBrand,
                qrCodeInvite: `code:${done.id}`,
              });
            })
            .catch((error) => {
              logger.error({ error });
              res.status(400).send({
                message:
                  error || "Some error occurred while creating the User.",
              });
            });
        })
        .catch(async (err) => {
          res.status(400).send({
            message:
              err.message || "Some error occurred while creating the user.",
          });
        });
    } else {
      res.status(400).send({
        message: `Pagekage ${BrandPagekage.packageName} สามารถเพิ่ม admin ได้สูงสุด ${countPagekage} คน`,
      });
    }
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the user.",
    });
  }
};

const editAdmin = async (req, res, next) => {
  try {
    const { lineName } = req.body;
    const { id } = req.params;
    const count = await UsersAdmin.count({
      where: { id: +id },
    });
    if (count !== 0) {
      UsersAdmin.update(
        {
          lineName: lineName,
        },
        {
          where: {
            id: +id,
          },
        }
      )
        .then(() => {
          res.status(200).send({
            message: "แก้ไข User สำเร็จ ",
          });
        })
        .catch(async (err) => {
          res.status(400).send({
            message: err.message || "Some error occurred while edit the user.",
          });
        });
    } else {
      res.status(400).send({
        message: "ไม่มีผู้ใช้คนนี้ในระบบ",
      });
    }
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while edit the user.",
    });
  }
};

const editPermission = async (req, res, next) => {
  try {
    const { editBrand, inviteUser, branchId } = req.body;
    const { id } = req.params;
    UserBrand.update(
      {
        editBrand,
        inviteUser,
      },
      {
        where: {
          userId: +id,
          branchId: +branchId,
        },
      }
    )
      .then(() => {
        res.status(200).send({
          message: "แก้ไข User สำเร็จ ",
        });
      })
      .catch(async (err) => {
        res.status(400).send({
          message: err.message || "Some error occurred while edit the user.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while edit the user.",
    });
  }
};

const editAdminBranch = async (req, res, next) => {
  try {
    const { userName, status } = req.body;
    const { id, branchId } = req.params;
    const count = await UserName.count({
      where: { userId: +id },
    });
    if (count !== 0) {
      UserName.update(
        {
          userName,
          status,
        },
        {
          where: {
            userId: +id,
          },
        }
      )
        .then(() => {
          res.status(200).send({
            message: "แก้ไข User สำเร็จ ",
          });
        })
        .catch(async (err) => {
          res.status(400).send({
            message: err.message || "Some error occurred while edit the user.",
          });
        });
    } else {
      UserName.create({
        userId: +id,
        userName,
        branchId,
        status: status,
      })
        .then(() => {
          res.status(200).send({
            message: "แก้ไข User สำเร็จ ",
          });
        })
        .catch(async (err) => {
          res.status(400).send({
            message: err.message || "Some error occurred while edit the user.",
          });
        });
    }
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while edit the user.",
    });
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const count = await UsersAdmin.count({
      where: { id: +id },
    });
    if (count !== 0) {
      UsersAdmin.update(
        {
          status: 0,
        },
        {
          where: {
            id: +id,
          },
        }
      )
        .then(() => {
          res.status(200).send({
            message: "ลบ User สำเร็จ ",
          });
        })
        .catch(async (err) => {
          res.status(400).send({
            message:
              err.message || "Some error occurred while delete the user.",
          });
        });
    } else {
      res.status(400).send({
        message: "ไม่มีผู้ใช้คนนี้ในระบบ",
      });
    }
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while delete the user.",
    });
  }
};

module.exports = {
  checkUser,
  createAdminToBrand,
  editAdminBranch,
  editAdmin,
  deleteAdmin,
  getUserAdminById,
  getUserAdminsByBrand,
  editPermission,
};
