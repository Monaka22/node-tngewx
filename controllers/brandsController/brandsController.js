require("dotenv").config();
const log4js = require("log4js");
const { validationResult } = require("express-validator");
const request = require("request-promise");
const AWS = require("../../middleware/aws");
const db = require("../../models");
const { momentTZ } = require("../../config/moment");
const moment = require("moment");
const { QueryTypes } = require("sequelize");
const {
  getPackagesBrand,
  listPackagesChange,
  updatePackagesBrandsRenew,
} = require("../lineController/lineController");

const logger = log4js.getLogger();
const UserBrand = db.user_brands;
const Brand = db.brands;
const PackagesBrands = db.pagekage_brands;
const Bank = db.bank_accounts;
const BankBranchs = db.bank_branchs;
const Branch = db.branchs;
const Remind = db.remind;

const { LINE_MESSAGING_API } = process.env;
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.LINE_TOKEN}`,
};

const convertJsonToExcel = async (history, res) => {
  res.xls(`report-${momentTZ().unix()}.xlsx`, history.listHistory);
};

const paymentF = async ({ user = "", text = "", package = {}, type = "" }) => {
  await Remind.create({
    to: user.userId,
    type,
    status: 1,
    relationId: package.id,
    exDate: momentTZ(momentTZ().add(1, "hours")).format("YYYY-MM-DD HH:mm:ss"),
  });
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/push`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      to: user.userId,
      messages: [
        {
          type: "flex",
          altText: "Packages",
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "ชำระค่าบริการเพื่อเริ่มใช้งาน Slip Ok",
                      color: "#ffffff",
                      size: "md",
                      wrap: true,
                      flex: 4,
                      weight: "bold",
                    },
                  ],
                },
              ],
              paddingAll: "20px",
              backgroundColor: "#CC37F4",
              spacing: "md",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: `ชำระค่าบริการ ${text}`,
                  weight: "bold",
                  size: "md",
                  wrap: true,
                },
                {
                  type: "text",
                  text: `Package ${package.packageName}`,
                  weight: "bold",
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: `จำนวนสิทธิ์ ${package.quotaPerM} สลิป/เดือน`,
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: `ชำระแบบราย${
                    package.packagePer === "y" ? "ปี" : "เดือน"
                  } ${package.packageAmount} บาท/${
                    package.packagePer === "y" ? "ปี" : "เดือน"
                  }`,
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: "คุณสามารถโอนเข้ามาได้ที่",
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: "ธนาคารกสิกรไทย",
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: `เลขที่บัญชี ${process.env.SLIP_OK_BANK_NO_SHOW}`,
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: "ชื่อบัญชี บจก. สลิปโอเค",
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: `จำนวนเงิน ${
                    package.packageAmount + (package.overAmount || 0)
                  } บาท`,
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: `หากคุณทำการโอนแล้วกรุณาส่งรูปสลิปมาใน Line กำหนดระยะเวลาในการส่งสลิปชำระค่าบริการภายใน 1 ชั่วโมง`,
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: `หากคุณไม่ได้ทำรายการในเวลาที่กำหนด กรุณากดเลือก Package ใหม่อีกครั้ง`,
                  size: "xs",
                  wrap: true,
                },
              ],
            },
            styles: {
              body: {
                backgroundColor: "#" + process.env.MESSAGE_BG_COLOR,
              },
            },
          },
        },
      ],
    }),
  });
};

const pushMassageCreateBranch = async ({ user = "" }) => {
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/push`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      to: user.userId,
      messages: [
        {
          type: "flex",
          altText: "Packages",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  weight: "bold",
                  size: "md",
                  wrap: true,
                  text: "ต้องการสร้างร้านค้าใหม่ ?",
                },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "เลือก Packages",
                    data: `brand:new`,
                    displayText: "เลือก Packages",
                  },
                },
              ],
            },
            styles: {
              body: {
                backgroundColor: "#" + process.env.MESSAGE_BG_COLOR,
              },
            },
          },
        },
      ],
    }),
  });
};

const createBrand = async (req, res, next) => {
  try {
    await pushMassageCreateBranch({ user: req.user });
    res.status(200).send({
      message: "send message",
    });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the Brand.",
    });
  }
};

const editBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      brandName,
      brandType,
      brandComment,
      businessType,
      brandTel,
      companyName,
      companyAddress,
      companyZipcode,
      companyTaxId,
      companyBranchId,
      brandImage,
      emailCompany,
    } = req.body;
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
    Brand.update(
      {
        brandName,
        brandType,
        brandComment,
        businessType,
        brandTel: brandTel || "",
        companyName: companyName || "",
        companyAddress: companyAddress || "",
        companyZipcode: companyZipcode || "",
        companyTaxId: companyTaxId || "",
        companyBranchId: companyBranchId || "",
        brandImage: brandImage || "",
        emailCompany: emailCompany || "",
        brandStatus: 1,
      },
      {
        where: {
          id: +id,
        },
      }
    )
      .then(() => {
        res.status(200).send({
          message: "แก้ไข Brand สำเร็จ ",
        });
      })
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while editing the Brand.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while editing the Brand.",
    });
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    Brand.update(
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
          message: "ลบ Brand สำเร็จ ",
        });
      })
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while deleting the Brand.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while deleting the Brand.",
    });
  }
};

const getBrands = async (req, res, next) => {
  try {
    const { userId } = req.params;
    Brand.findAll({
      include: [
        {
          model: UserBrand,
          where: { userId: +userId },
        },
      ],
    })
      .then((branch) => {
        res.status(200).send({
          message: "find branch.",
          data: branch,
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

const getBrandsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    Brand.findOne({
      attributes: [
        "id",
        "brandName",
        "brandImage",
        "brandType",
        "brandComment",
        "businessType",
        "status",
        "brandStatus",
        "brandTel",
        "companyName",
        "companyAddress",
        "companyZipcode",
        "companyTaxId",
        "companyBranchId",
        "emailCompany",
      ],
      where: { id: +id },
      include: [
        {
          model: PackagesBrands,
        },
      ],
    })
      .then(async (branch) => {
        if (branch) {
          res.status(200).send({
            message: "find branch.",
            result: {
              id: branch.dataValues.id,
              brandName: branch.dataValues.brandName,
              brandImage:
                branch.dataValues.brandImage &&
                branch.dataValues.brandImage !== ""
                  ? AWS.getUrlFromBucket(branch.dataValues.brandImage) || ""
                  : null,
              brandType: branch.dataValues.brandType,
              brandComment: branch.dataValues.brandComment,
              businessType: branch.dataValues.businessType,
              brandTel: branch.dataValues.brandTel,
              companyName: branch.dataValues.companyName,
              companyAddress: branch.dataValues.companyAddress,
              companyZipcode: branch.dataValues.companyZipcode,
              companyTaxId: branch.dataValues.companyTaxId,
              companyBranchId: branch.dataValues.companyBranchId,
              emailCompany: branch.dataValues.emailCompany,
              pagekage_brands: branch.dataValues.pagekage_brands[0],
            },
          });
        } else {
          res.status(400).send({
            message: "Not found brand.",
          });
        }
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

const getBankById = async (id, startDate, endDate) => {
  return new Promise(async (resolve, reject) => {
    Bank.findOne({
      where: { id: +id },
      attributes: [
        "id",
        "bankAccountNo",
        "accountName",
        "bankName",
        "brandId",
        "bankType",
        "prompayType",
      ],
      include: [
        {
          attributes: ["bankId", "branchId", "status"],
          model: BankBranchs,
        },
      ],
    })
      .then(async (bank) => {
        if (bank) {
          const branch = await Branch.findAll({
            attributes: ["id", "branchName", "branchIcon", "groupId"],
            where: { status: 1, brandId: bank.brandId },
          });
          const branchArray = [];
          await Promise.all([
            branch.forEach(async (doc) => {
              const statusfetch = await bank.bank_branchs.filter((item) => {
                if (item.branchId === doc.id) {
                  return item.status;
                } else {
                  return 0;
                }
              });
              const [results] = await db.sequelize.query(
                "SELECT SUM(`transactions`.`amount`) as `amountAll`, COUNT (`transactions`.`id`) as `dateCount` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on  `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `transactions`.`branchId` = :branchId and `transactions`.`sentDate` >= :startDate  and `transactions`.`sentDate` <= :endDate;",
                {
                  replacements: {
                    startDate:
                      startDate !== endDate
                        ? new Date(startDate)
                        : new Date(
                            moment(
                              moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                            ).format("YYYY-MM-DD")
                          ),
                    endDate:
                      startDate !== endDate
                        ? new Date(endDate)
                        : new Date(
                            moment(
                              moment(endDate, "YYYY-MM-DD").add(1, "day")
                            ).format("YYYY-MM-DD")
                          ),
                    branchId: doc.id,
                  },
                  type: QueryTypes.SELECT,
                }
              );
              await branchArray.push({
                bankId: id,
                branchId: doc.id,
                status: statusfetch[0] ? statusfetch[0].status : 0,
                branchName: doc.dataValues.branchName,
                branchIcon: doc.dataValues.branchIcon,
                groupId: doc.dataValues.groupId,
                summary: results,
              });
            }),
          ]);
          delete bank.dataValues.bank_branchs;
          resolve({
            message: "find bank.",
            data: bank.dataValues,
            branch: branchArray,
          });
        } else {
          resolve({
            message: "Can't find bank.",
          });
        }
      })
      .catch((err) => {
        resolve({
          message: err.message || "Some error occurred while finding the bank.",
        });
      });
  });
};
const getBranchById = async (id, startDate, endDate) => {
  return new Promise(async (resolve, reject) => {
    Branch.findOne({
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
              const [results] = await Promise.all([
                db.sequelize.query(
                  "SELECT SUM(`transactions`.`amount`) as `amountAll`, COUNT (`transactions`.`id`) as `dateCount` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on  `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `bank_accounts`.`id` = :bankId and `transactions`.`sentDate` >= :startDate  and `transactions`.`sentDate` <= :endDate;",
                  {
                    replacements: {
                      startDate:
                        startDate !== endDate
                          ? new Date(startDate)
                          : new Date(
                              moment(
                                moment(startDate, "YYYY-MM-DD").subtract(
                                  1,
                                  "day"
                                )
                              ).format("YYYY-MM-DD")
                            ),
                      endDate:
                        startDate !== endDate
                          ? new Date(endDate)
                          : new Date(
                              moment(
                                moment(endDate, "YYYY-MM-DD").add(1, "day")
                              ).format("YYYY-MM-DD")
                            ),
                      bankId: doc.id,
                    },
                    type: QueryTypes.SELECT,
                  }
                ),
              ]);
              bankArray.push({
                bankId: doc.id,
                branchId: id,
                status: statusfetch[0] ? statusfetch[0].status : 0,
                bankName: doc.bankName,
                bankAccountNo: doc.bankAccountNo,
                accountName: doc.accountName,
                bankType: doc.bankType,
                prompayType: doc.prompayType,
                summary: results[0],
              });
            }),
          ]);
          delete branch.dataValues.bank_branchs;
          resolve({
            message: "find branch.",
            data: branch.dataValues,
            bank: bankArray,
          });
        } else {
          resolve({
            message: "Can't find branch.",
          });
        }
      })
      .catch((err) => {
        resolve({
          message: err.message || "Some error occurred while finding the bank.",
        });
      });
  });
};

const getBranchs = async (brandId) => {
  return new Promise(async (resolve, reject) => {
    Branch.findAll({
      where: { brandId: +brandId, status: 1 },
    })
      .then((branch) => {
        resolve(branch);
      })
      .catch((err) => {
        resolve({
          message:
            err.message || "Some error occurred while finding the branch.",
        });
      });
  });
};

const getBanks = async (brandId) => {
  return new Promise(async (resolve, reject) => {
    Bank.findAll({
      where: { brandId: +brandId, status: 1 },
    })
      .then((bank) => {
        resolve(bank);
      })
      .catch(() => {
        reject([]);
      });
  });
};

const getReport = async (req, res, next) => {
  try {
    const startDate = req.query.startDate
      ? momentTZ(req.query.startDate, "YYYY-MM-DD").format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");
    const endDate = req.query.endDate
      ? momentTZ(req.query.endDate, "YYYY-MM-DD").format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");
    const brandId = req.query.brandId;
    const type = req.query.type ? +req.query.type : 1;
    const listHistory = await db.sequelize.query(
      "SELECT `transactions`.`id`, `transactions`.`sentDate`, `transactions`.`branchId`, `transactions`.`amount` ,`branchs`. `branchName` as `branchName`, `branchs`.`branchIcon` as `branchIcon`, `bank_accounts`.`id` as `bankId`, `bank_accounts`.`bankAccountNo` as `bankAccountNo`, `bank_accounts`.`accountName` as `accountName`,  `bank_accounts`.`bankName` as `bankName`, `bank_accounts`.`bankType` as `bankType`,  `slips`.`id` as `slipId`, `slips`.`bankAccountNoSent` as `bankAccountNoSent`, `slips`.`bankAccountNameSent` as  `bankAccountNameSent` ,`slips`.`bankAccountNoReciept` as `bankAccountNoReciept`, `slips`.`bankAccountNameReciept` as  `bankAccountNameReciept`, `staffs`.`id` as `staffId`, `staffs`.`lineName` as `lineName` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `bank_accounts`.`id` = :brandId and `transactions`.`sentDate` >= :startDate and `transactions`.`sentDate` <= :endDate;",
      {
        replacements: {
          startDate:
            startDate !== endDate
              ? new Date(startDate)
              : new Date(
                  moment(
                    moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                  ).format("YYYY-MM-DD")
                ),
          endDate:
            startDate !== endDate
              ? new Date(endDate)
              : new Date(
                  moment(moment(endDate, "YYYY-MM-DD").add(1, "day")).format(
                    "YYYY-MM-DD"
                  )
                ),
          brandId,
        },
        type: QueryTypes.SELECT,
      }
    );
    const data = [];
    if (type === 1) {
      const banks = await getBanks(brandId);
      await Promise.all([
        await banks.forEach(async (doc, index) => {
          const bankResult = await getBankById(doc.id, startDate, endDate);
          const [results] = await db.sequelize.query(
            "SELECT SUM(`transactions`.`amount`) as `amountAll`, COUNT (`transactions`.`id`) as `dateCount` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on  `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `bank_accounts`.`id` = :bankId and `transactions`.`sentDate` >= :startDate  and `transactions`.`sentDate` <= :endDate;",
            {
              replacements: {
                startDate:
                  startDate !== endDate
                    ? new Date(startDate)
                    : new Date(
                        moment(
                          moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                        ).format("YYYY-MM-DD")
                      ),
                endDate:
                  startDate !== endDate
                    ? new Date(endDate)
                    : new Date(
                        moment(
                          moment(endDate, "YYYY-MM-DD").add(1, "day")
                        ).format("YYYY-MM-DD")
                      ),
                bankId: doc.id,
              },
              type: QueryTypes.SELECT,
            }
          );
          data.push({ bankData: bankResult, bankSummary: results });
          if (banks.length === index + 1) {
            res.status(200).send({
              banks: data,
              listHistory,
              allSummary: data
                .map((bill) => bill.bankSummary.amountAll)
                .reduce((acc, amount) => acc + amount),
              allCount: data
                .map((bill) => bill.bankSummary.dateCount)
                .reduce((acc, amount) => acc + amount),
            });
          }
        }),
      ]);
    } else {
      const branchs = await getBranchs(brandId);
      await Promise.all([
        await branchs.forEach(async (doc, index) => {
          const branchResult = await getBranchById(doc.id, startDate, endDate);
          const [results] = await db.sequelize.query(
            "SELECT SUM(`transactions`.`amount`) as `amountAll`, COUNT (`transactions`.`id`) as `dateCount` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on  `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `transactions`.`branchId` = :branchId and `transactions`.`sentDate` >= :startDate  and `transactions`.`sentDate` <= :endDate;",
            {
              replacements: {
                startDate:
                  startDate !== endDate
                    ? new Date(startDate)
                    : new Date(
                        moment(
                          moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                        ).format("YYYY-MM-DD")
                      ),
                endDate:
                  startDate !== endDate
                    ? new Date(endDate)
                    : new Date(
                        moment(
                          moment(endDate, "YYYY-MM-DD").add(1, "day")
                        ).format("YYYY-MM-DD")
                      ),
                branchId: doc.id,
              },
              type: QueryTypes.SELECT,
            }
          );
          data.push({ branchData: branchResult, branchSummary: results });
          if (branchs.length === index + 1) {
            res.status(200).send({
              branchs: data,
              listHistory,
              allSummary: data
                .map((bill) => bill.branchSummary.amountAll)
                .reduce((acc, amount) => acc + amount),
              allCount: data
                .map((bill) => bill.branchSummary.dateCount)
                .reduce((acc, amount) => acc + amount),
            });
          }
        }),
      ]);
    }
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the branch.",
    });
  }
};

const getReportToExcel = async (req, res, next) => {
  try {
    const startDate = req.query.startDate
      ? momentTZ(req.query.startDate, "YYYY-MM-DD").format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");
    const endDate = req.query.endDate
      ? momentTZ(req.query.endDate, "YYYY-MM-DD").format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");
    const brandId = req.query.brandId;
    const listHistory = await db.sequelize.query(
      "SELECT `transactions`.`id`, `transactions`.`sentDate` as `sentDate`, `transactions`.`amount` ,`branchs`. `branchName` as `branchName`, `bank_accounts`.`bankAccountNo` as `bankAccountNo`, `bank_accounts`.`accountName` as `accountName`,  `bank_accounts`.`bankName` as `bankName`,`slips`.`bankAccountNoSent` as `bankAccountNoSent`, `slips`.`bankAccountNameSent` as  `bankAccountNameSent`,`slips`.`bankAccountNoReciept` as `bankAccountNoReciept`, `slips`.`bankAccountNameReciept` as  `bankAccountNameReciept`,  `staffs`.`lineName` as `staffsLineName` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `bank_accounts`.`id` = :brandId and `transactions`.`sentDate` >= :startDate and `transactions`.`sentDate` <= :endDate;",
      {
        replacements: {
          startDate:
            startDate !== endDate
              ? new Date(startDate)
              : new Date(
                  moment(
                    moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                  ).format("YYYY-MM-DD")
                ),
          endDate:
            startDate !== endDate
              ? new Date(endDate)
              : new Date(
                  moment(moment(endDate, "YYYY-MM-DD").add(1, "day")).format(
                    "YYYY-MM-DD"
                  )
                ),
          brandId,
        },
        type: QueryTypes.SELECT,
      }
    );
    convertJsonToExcel(
      {
        listHistory,
      },
      res
    );
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the branch.",
    });
  }
};

const getReportOne = async (req, res, next) => {
  try {
    const startDate = req.query.startDate
      ? momentTZ(req.query.startDate, "YYYY-MM-DD").format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");
    const endDate = req.query.endDate
      ? momentTZ(req.query.endDate, "YYYY-MM-DD").format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");
    const bankId = req.query.bankId || "";
    const branchId = req.query.branchId || "";
    if (bankId === "" && branchId === "") {
      const [results] = await db.sequelize.query(
        "SELECT SUM(`transactions`.`amount`) as `amountAll`, COUNT (`transactions`.`id`) as `dateCount` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on  `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `transactions`.`sentDate` >= :startDate  and `transactions`.`sentDate` <= :endDate;",
        {
          replacements: {
            startDate:
              startDate !== endDate
                ? new Date(startDate)
                : new Date(
                    moment(
                      moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                    ).format("YYYY-MM-DD")
                  ),
            endDate:
              startDate !== endDate
                ? new Date(endDate)
                : new Date(
                    moment(moment(endDate, "YYYY-MM-DD").add(1, "day")).format(
                      "YYYY-MM-DD"
                    )
                  ),
          },
          type: QueryTypes.SELECT,
        }
      );
      const data = await db.sequelize.query(
        "SELECT `transactions`.`sentDate`, `transactions`.`branchId`, `transactions`.`amount` ,`branchs`. `branchName` as `branchName`, `branchs`.`branchIcon` as `branchIcon`, `bank_accounts`.`id` as `bankId`, `bank_accounts`.`bankAccountNo` as `bankAccountNo`, `bank_accounts`.`accountName` as `accountName`,  `bank_accounts`.`bankName` as `bankName`, `bank_accounts`.`bankType` as `bankType`,  `slips`.`id` as `slipId`, `slips`.`bankAccountNoSent` as `bankAccountNoSent`, `slips`.`bankAccountNameSent` as  `bankAccountNameSent`, `staffs`.`id` as `staffId`, `staffs`.`lineName` as `lineName` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `transactions`.`sentDate` >= :startDate and `transactions`.`sentDate` <= :endDate;",
        {
          replacements: {
            startDate:
              startDate !== endDate
                ? new Date(startDate)
                : new Date(
                    moment(
                      moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                    ).format("YYYY-MM-DD")
                  ),
            endDate:
              startDate !== endDate
                ? new Date(endDate)
                : new Date(
                    moment(moment(endDate, "YYYY-MM-DD").add(1, "day")).format(
                      "YYYY-MM-DD"
                    )
                  ),
          },
          type: QueryTypes.SELECT,
        }
      );
      res.status(200).send({
        message: "find report.",
        data: data,
        summary: results,
      });
    } else if (bankId === "" && branchId !== "") {
      const [results] = await db.sequelize.query(
        "SELECT SUM(`transactions`.`amount`) as `amountAll`, COUNT (`transactions`.`id`) as `dateCount` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on  `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `transactions`.`branchId` = :branchId and `transactions`.`sentDate` >= :startDate  and `transactions`.`sentDate` <= :endDate;",
        {
          replacements: {
            startDate:
              startDate !== endDate
                ? new Date(startDate)
                : new Date(
                    moment(
                      moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                    ).format("YYYY-MM-DD")
                  ),
            endDate:
              startDate !== endDate
                ? new Date(endDate)
                : new Date(
                    moment(moment(endDate, "YYYY-MM-DD").add(1, "day")).format(
                      "YYYY-MM-DD"
                    )
                  ),
            branchId: branchId,
          },
          type: QueryTypes.SELECT,
        }
      );
      const data = await db.sequelize.query(
        "SELECT `transactions`.`sentDate`, `transactions`.`branchId`, `transactions`.`amount` ,`branchs`. `branchName` as `branchName`, `branchs`.`branchIcon` as `branchIcon`, `bank_accounts`.`id` as `bankId`, `bank_accounts`.`bankAccountNo` as `bankAccountNo`, `bank_accounts`.`accountName` as `accountName`,  `bank_accounts`.`bankName` as `bankName`, `bank_accounts`.`bankType` as `bankType`,  `slips`.`id` as `slipId`, `slips`.`bankAccountNoSent` as `bankAccountNoSent`, `slips`.`bankAccountNameSent` as  `bankAccountNameSent`, `staffs`.`id` as `staffId`, `staffs`.`lineName` as `lineName` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `transactions`.`branchId` = :branchId and `transactions`.`sentDate` >= :startDate and `transactions`.`sentDate` <= :endDate;",
        {
          replacements: {
            startDate:
              startDate !== endDate
                ? new Date(startDate)
                : new Date(
                    moment(
                      moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                    ).format("YYYY-MM-DD")
                  ),
            endDate:
              startDate !== endDate
                ? new Date(endDate)
                : new Date(
                    moment(moment(endDate, "YYYY-MM-DD").add(1, "day")).format(
                      "YYYY-MM-DD"
                    )
                  ),
            branchId,
          },
          type: QueryTypes.SELECT,
        }
      );
      res.status(200).send({
        message: "find report.",
        data: data,
        summary: results,
      });
    } else if (bankId !== "" && branchId === "") {
      const [results] = await db.sequelize.query(
        "SELECT SUM(`transactions`.`amount`) as `amountAll`, COUNT (`transactions`.`id`) as `dateCount` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on  `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `bank_accounts`.`id` = :bankId and `transactions`.`sentDate` >= :startDate  and `transactions`.`sentDate` <= :endDate;",
        {
          replacements: {
            startDate:
              startDate !== endDate
                ? new Date(startDate)
                : new Date(
                    moment(
                      moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                    ).format("YYYY-MM-DD")
                  ),
            endDate:
              startDate !== endDate
                ? new Date(endDate)
                : new Date(
                    moment(moment(endDate, "YYYY-MM-DD").add(1, "day")).format(
                      "YYYY-MM-DD"
                    )
                  ),
            bankId: bankId,
          },
          type: QueryTypes.SELECT,
        }
      );
      const data = await db.sequelize.query(
        "SELECT `transactions`.`sentDate`, `transactions`.`branchId`, `transactions`.`amount` ,`branchs`. `branchName` as `branchName`, `branchs`.`branchIcon` as `branchIcon`, `bank_accounts`.`id` as `bankId`, `bank_accounts`.`bankAccountNo` as `bankAccountNo`, `bank_accounts`.`accountName` as `accountName`,  `bank_accounts`.`bankName` as `bankName`, `bank_accounts`.`bankType` as `bankType`,  `slips`.`id` as `slipId`, `slips`.`bankAccountNoSent` as `bankAccountNoSent`, `slips`.`bankAccountNameSent` as  `bankAccountNameSent`, `staffs`.`id` as `staffId`, `staffs`.`lineName` as `lineName` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `bank_accounts`.`id` = :bankId and `transactions`.`sentDate` >= :startDate and `transactions`.`sentDate` <= :endDate;",
        {
          replacements: {
            startDate:
              startDate !== endDate
                ? new Date(startDate)
                : new Date(
                    moment(
                      moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                    ).format("YYYY-MM-DD")
                  ),
            endDate:
              startDate !== endDate
                ? new Date(endDate)
                : new Date(
                    moment(moment(endDate, "YYYY-MM-DD").add(1, "day")).format(
                      "YYYY-MM-DD"
                    )
                  ),
            bankId,
          },
          type: QueryTypes.SELECT,
        }
      );
      res.status(200).send({
        message: "find report.",
        data: data,
        summary: results,
      });
    } else {
      const [results] = await db.sequelize.query(
        "SELECT SUM(`transactions`.`amount`) as `amountAll`, COUNT (`transactions`.`id`) as `dateCount` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on  `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `transactions`.`branchId` = :branchId and `bank_accounts`.`id` = :bankId and `transactions`.`sentDate` >= :startDate  and `transactions`.`sentDate` <= :endDate;",
        {
          replacements: {
            startDate:
              startDate !== endDate
                ? new Date(startDate)
                : new Date(
                    moment(
                      moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                    ).format("YYYY-MM-DD")
                  ),
            endDate:
              startDate !== endDate
                ? new Date(endDate)
                : new Date(
                    moment(moment(endDate, "YYYY-MM-DD").add(1, "day")).format(
                      "YYYY-MM-DD"
                    )
                  ),
            bankId: bankId,
            branchId,
          },
          type: QueryTypes.SELECT,
        }
      );
      const data = await db.sequelize.query(
        "SELECT `transactions`.`sentDate`, `transactions`.`branchId`, `transactions`.`amount` ,`branchs`. `branchName` as `branchName`, `branchs`.`branchIcon` as `branchIcon`, `bank_accounts`.`id` as `bankId`, `bank_accounts`.`bankAccountNo` as `bankAccountNo`, `bank_accounts`.`accountName` as `accountName`,  `bank_accounts`.`bankName` as `bankName`, `bank_accounts`.`bankType` as `bankType`,  `slips`.`id` as `slipId`, `slips`.`bankAccountNoSent` as `bankAccountNoSent`, `slips`.`bankAccountNameSent` as  `bankAccountNameSent`, `staffs`.`id` as `staffId`, `staffs`.`lineName` as `lineName` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `bank_accounts`.`id` = :bankId and `transactions`.`branchId` = :branchId and `transactions`.`sentDate` >= :startDate and `transactions`.`sentDate` <= :endDate;",
        {
          replacements: {
            startDate:
              startDate !== endDate
                ? new Date(startDate)
                : new Date(
                    moment(
                      moment(startDate, "YYYY-MM-DD").subtract(1, "day")
                    ).format("YYYY-MM-DD")
                  ),
            endDate:
              startDate !== endDate
                ? new Date(endDate)
                : new Date(
                    moment(moment(endDate, "YYYY-MM-DD").add(1, "day")).format(
                      "YYYY-MM-DD"
                    )
                  ),
            bankId,
            branchId,
          },
          type: QueryTypes.SELECT,
        }
      );
      res.status(200).send({
        message: "find report.",
        data: data,
        summary: results,
      });
    }
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the branch.",
    });
  }
};

const renew = async (req, res, next) => {
  try {
    const { id, packageId } = req.params;
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
    Brand.findOne({
      attributes: ["id", "brandName"],
      where: { id: +id },
    })
      .then(async (brand) => {
        const package = await getPackagesBrand(packageId, id);
        Brand.update(
          {
            editDate: momentTZ().format("YYYY-MM-DD HH:mm:ss"),
          },
          {
            where: {
              id: +id,
            },
          }
        )
          .then(async (data) => {
            if (package.packageAmount + (package.overAmount || 0) > 0) {
              await paymentF({
                user: req.user,
                text: brand.brandName,
                package,
                type: 3,
              });
              res.status(200).send({
                result: data,
                message: "ส่งข้อความสำเร็จ ",
              });
            } else {
              await updatePackagesBrandsRenew(package.id, id, package);
              res.status(200).send({
                result: data,
                message: "success",
              });
            }
          })
          .catch((error) => {
            logger.error({ error });
            res.status(400).send({
              message: error || "Some error occurred while editing the Brand.",
            });
          });
      })
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while editing the Brand.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while editing the Brand.",
    });
  }
};

const change = async (req, res, next) => {
  try {
    const { id, packageId } = req.params;
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
    Brand.findOne({
      attributes: ["id", "brandName"],
      where: { id: +id },
    })
      .then(async () => {
        Brand.update(
          {
            editDate: momentTZ().format("YYYY-MM-DD HH:mm:ss"),
          },
          {
            where: {
              id: +id,
            },
          }
        )
          .then(async (data) => {
            await listPackagesChange({
              to: req.user.userId,
              brandId: id,
              packageId: packageId,
            });
            res.status(200).send({
              result: data,
              message: "ส่งข้อความสำเร็จ ",
            });
          })
          .catch((error) => {
            logger.error({ error });
            res.status(400).send({
              message: error || "Some error occurred while editing the Brand.",
            });
          });
      })
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while editing the Brand.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while editing the Brand.",
    });
  }
};

module.exports = {
  createBrand,
  editBrand,
  getBrands,
  getBrandsById,
  deleteBrand,
  getReport,
  getReportOne,
  renew,
  change,
  getReportToExcel,
};
