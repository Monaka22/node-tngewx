const log4js = require("log4js");
const { validationResult } = require("express-validator");
const db = require("../../models");

const logger = log4js.getLogger();
const Branchs = db.branchs;
const UserAdminName = db.user_admin_name;
const BankBranchs = db.bank_branchs;
const Bank = db.bank_accounts;
const PagekageBrands = db.pagekage_brands;

const createBranch = async (req, res, next) => {
  try {
    const { brandId, userId } = req.body;
    const BrandPagekage = await PagekageBrands.findOne({
      where: { brandId: +brandId },
    });
    const Branch = await Branchs.count({
      where: { id: +brandId, status: 1 },
    });
    const countPagekage =
      BrandPagekage.adminNumber === 0
        ? 10000000000000
        : BrandPagekage.adminNumber;
    if (Branch < countPagekage) {
      Branchs.create({
        branchName: "ใหม่",
        businessType: "",
        brandId,
        status: 0,
        groupId: "",
        branchIcon: "",
      })
        .then((data) => {
          UserAdminName.create({
            userId,
            branchId: +data.id,
            userName: req.user.displayName,
            status: 1,
          })
            .then(() => {
              res.status(200).send({
                result: data,
                qrCodeInvite: `code:${data.id}`,
                message: "เพิ่ม Branch สำเร็จ ",
              });
            })
            .catch((error) => {
              logger.error({ error });
              res.status(400).send({
                message:
                  error || "Some error occurred while creating the Branch.",
              });
            });
        })
        .catch((error) => {
          logger.error({ error });
          res.status(400).send({
            message: error || "Some error occurred while creating the Branch.",
          });
        });
    } else {
      res.status(400).send({
        message: `Pagekage ${BrandPagekage.packageName} สามารถเพิ่ม สาขา ได้สูงสุด ${countPagekage} สาขา`,
      });
    }
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the Branch.",
    });
  }
};

const editBranch = async (req, res, next) => {
  try {
    const { branchName, businessType, brandId, groupId, branchIcon } = req.body;
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error();
      error.status = 422;
      error.error = errors.array();
      logger.warn(error.message);
      logger.warn(errors.array());
      return res.status(422).json({
        message: errors.errors[0].msg,
        statusCode: error.status,
        statusText: "error",
        errors: errors.array({ onlyFirstError: true }),
      });
    }
    Branchs.update(
      {
        branchName,
        businessType,
        brandId,
        groupId,
        status: 1,
        branchIcon,
      },
      {
        where: {
          id: +id,
        },
      }
    )
      .then(() => {
        res.status(200).send({
          message: "แก้ไข Branch สำเร็จ ",
        });
      })
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while editng the Branch.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while editng the Branch.",
    });
  }
};

const deleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error();
      error.status = 422;
      error.error = errors.array();
      logger.warn(error.message);
      logger.warn(errors.array());
      return res.status(422).json({
        message: errors.errors[0].msg,
        statusCode: error.status,
        statusText: "error",
        errors: errors.array({ onlyFirstError: true }),
      });
    }
    Branchs.update(
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
          message: "ลบ Branch สำเร็จ ",
        });
      })
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while delete the Branch.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while delete the Branch.",
    });
  }
};

const getBranchs = async (req, res, next) => {
  try {
    const { brandId } = req.params;
    Branchs.findAll({
      where: { brandId: +brandId, status: 1 },
      include: [
        {
          model: UserAdminName,
          where: { status: 1 },
        },
      ],
    })
      .then((branch) => {
        res.status(200).send({
          message: "find branch.",
          result: branch,
        });
      })
      .catch((err) => {
        res.status(400).send({
          message:
            err.message || "Some error occurred while finding the branch.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the branch.",
    });
  }
};

const getBranchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    Branchs.findOne({
      where: { id: +id },
      attributes: [
        "id",
        "branchName",
        "groupId",
        "businessType",
        "status",
        "brandId",
        "branchIcon",
      ],
      include: [
        {
          model: BankBranchs,
          attributes: ["bankId", "branchId", "status"],
        },
      ],
    })
      .then(async (branch) => {
        if (branch) {
          const bank = await Bank.findAll({
            attributes: [
              "id",
              "bankAccountNo",
              "accountName",
              "bankName",
              "brandId",
              "bankType",
              "prompayType",
            ],
            where: { status: 1, brandId: branch.brandId },
          });
          const bankArray = [];
          await Promise.all([
            bank.forEach(async (doc) => {
              const statusfetch = await branch.bank_branchs.filter((item) => {
                if (item.bankId === doc.id) {
                  return item.status;
                } else {
                  return 0;
                }
              });
              bankArray.push({
                bankId: doc.id,
                branchId: id,
                status: statusfetch[0] ? statusfetch[0].status : 0,
                bankName: doc.bankName,
                bankAccountNo: doc.bankAccountNo,
                accountName: doc.accountName,
                bankType: doc.bankType,
                prompayType: doc.prompayType,
              });
            }),
          ]);
          delete branch.dataValues.bank_branchs;
          res.status(200).send({
            message: "find branch.",
            data: branch.dataValues,
            bank: bankArray,
          });
        } else {
          res.status(400).send({
            message: "Can't find branch.",
          });
        }
      })
      .catch((err) => {
        res.status(400).send({
          message: err.message || "Some error occurred while finding the bank.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the bank.",
    });
  }
};

const connectBank = async (req, res) => {
  try {
    const { branchId, bankId } = req.params;
    const { status } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error();
      error.status = 422;
      error.error = errors.array();
      logger.warn(error.message);
      logger.warn(errors.array());
      return res.status(422).json({
        message: errors.errors[0].msg,
        statusCode: error.status,
        statusText: "error",
        errors: errors.array({ onlyFirstError: true }),
      });
    }
    BankBranchs.count({
      where: { bankId: +bankId, branchId: +branchId },
    })
      .then((count) => {
        if (count === 1) {
          BankBranchs.update(
            {
              bankId: +bankId,
              branchId: +branchId,
              status: status,
            },
            {
              where: {
                bankId: +bankId,
                branchId: +branchId,
              },
            }
          )
            .then(() => {
              res.status(200).send({
                message: "แก้ไข Branch สำเร็จ ",
              });
            })
            .catch((error) => {
              logger.error({ error });
              res.status(400).send({
                message:
                  error || "Some error occurred while editng the Branch.",
              });
            });
        } else {
          BankBranchs.create({
            bankId: +bankId,
            branchId: +branchId,
            status: status,
          })
            .then(() => {
              res.status(200).send({
                message: "แก้ไข Branch สำเร็จ ",
              });
            })
            .catch((error) => {
              logger.error({ error });
              res.status(400).send({
                message:
                  error || "Some error occurred while editng the Branch.",
              });
            });
        }
      })
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while editng the Branch.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while editng the Branch.",
    });
  }
};

const getType = async (req, res) => {
  res.status(200).send({
    message: "get Type successful",
    result: [
      {
        branchType: "ธุรกิจอาหาร",
        businessType: [
          "อาหารไทย",
          "อาหารญี่ปุ่น",
          "อาหารอิตาเลียน",
          "อาหารฝรั่งเศส",
          "อาหารจีน",
          "อาหารนานาชาติ",
          "ร้านฟาสต์ฟู้ด",
          "เบเกอรี่และขนม",
        ],
      },
      {
        branchType: "ธุรกิจเครื่องดื่ม",
        businessType: ["ร้านกาแฟ, คาเฟ่ต์", "ผับ บาร์", "ร้านชานม", "ร้านชา"],
      },
      {
        branchType: "ธุรกิจบริการ",
        businessType: [
          "สปาความงาม, บริการนวด",
          "ทันตกรรม",
          "โรงพยาบาล, สถานพยาบาล",
          "โรงพยาบาลสัตว์",
          "ร้านตัดผม",
          "ร้านทำเล็บ",
          "ร้านเสริมสวย",
          "คลินิกผิวหนัง",
          "ธุรกิจความงามอื่นๆ",
          "ธุรกิจดูแลเด็ก",
          "ธุรกิจดูแลผู้สูงอายุ",
        ],
      },
      {
        branchType: "ธุรกิจค้าปลีก",
        businessType: [
          "ร้านขายของชำ",
          "ร้านค้าปลีก",
          "ร้านเครื่องใช้ไฟฟ้า",
          "ร้านค้าอุปกรณ์ไอที่",
          "ร้านขายสินค้าเกี่ยวกับอาหาร",
          "ร้านค้าสินค้าแฟชั่น, เสื้อผ้า",
          "ร้านค้าเครื่องประดับ",
          "ร้านค้าแว่นตา",
          "คอนแทคเลนส์",
          "ร้านขายรองเท้า",
          "ร้านค้าอุปกรณ์กีฬา",
          "ร้านค้าอุปกรณ์การเรียน",
          "ร้านขายยา และค้าปลีกสินค้า",
          "ทางเภสัชภัณฑ์และเวชภัณฑ์",
          "ร้านค้าอุปกรณ์สำนักงาน",
          "เครื่องเขียน",
          "ร้านขายสินค้างานฝีมือและ",
          "ของชำร่วย",
          "ร้านค้าศิลปะ และของสะสม",
          "ร้านสะดวกซื้อ / มินิมาร์ท",
          "แหล่งช้อปปิ้ง  คอมมูนิตี้มอลล์",
          "ร้านขายผลผลิตทางการเกษตร",
        ],
      },
      {
        branchType: "ธุรกิจที่พัก",
        businessType: [
          "หอพัก, บ้านพัก, คอนโด",
          "โรงแรม",
          "co-working space",
          "สำนักงาน",
          "อสังหาริมทรัพย์",
        ],
      },
      {
        branchType: "ธุรกิจที่กีฬา",
        businessType: [
          "โรงยิม, ฟิตเนส",
          "ค่ายมวย",
          "สนามกีฬา",
          "สระว่ายน้ำ",
          "กิจกรรมกลางแจ้ง",
          "สนามแบตมินตัน, เทนนิส",
          "สนามฟุตบอล",
          "อีเว้นท์กีฬา",
          "ลีกกีฬา",
        ],
      },
      {
        branchType: "ธุรกิจออนไลน์",
        businessType: ["ขายของออนไลน์", "เว็บไซต์&บล็อก"],
      },
      {
        branchType: "ธุรกิจบันเทิง",
        businessType: [
          "ร้านเกมส์ ร้านคอมพิวเตอร์",
          "โรงละคร การแสดง",
          "ร้านคาราโอเกะ",
          "ร้านเช่าแผ่นซีดิภาพยนต์",
          "สถานีวิทยุ คลื่นวิทยุ",
          "บริการเกี่ยวกับดนตรี",
        ],
      },
      {
        branchType: "ยานพาหนะ",
        businessType: [
          "ล้างรถ",
          "บริการการตกแต่ง ซ่อมบำรุง",
          "อุปกรณ์ตกแต่งรถ",
          "รถมือหนึ่ง",
          "รถมือสอง",
          "จักรยาน",
        ],
      },
      {
        branchType: "การศึกษา",
        businessType: [
          "โรงเรียนกวดวิชาและ",
          "เรียนพิเศษ",
          "สถาบันสอนภาษา",
          "สถาบันเพื่อการศึกษา",
          "การศึกษาปฐมวัย",
          "ประถมศึกษา",
          "มัธยมศึกษา",
          "อาชีวศึกษา",
          "อุดมศึกษา",
        ],
      },
      {
        branchType: "การท่องเที่ยว",
        businessType: [
          "บริการท่องเที่ยว",
          "สถานที่ท่องเที่ยว",
          "สวนสนุก, สวนน้ำ",
          " ที่จัดแสดงงานศิลปะ, หอศิลป์",
          "สวนสัตว์",
        ],
      },
      {
        branchType: "องค์กร หรือสถาบัน",
        businessType: ["องค์กร สมาคม", "หน่วยงานราชการ"],
      },
    ],
  });
};

module.exports = {
  createBranch,
  editBranch,
  deleteBranch,
  getBranchs,
  getBranchById,
  connectBank,
  getType,
};
