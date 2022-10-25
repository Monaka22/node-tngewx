const log4js = require("log4js");
const { validationResult } = require("express-validator");
const db = require("../../models");

const logger = log4js.getLogger();
const Bank = db.bank_accounts;
const BankBranchs = db.bank_branchs;
const Branch = db.branchs;

const createBankAccount = async (req, res, next) => {
  try {
    const { brandId } = req.body;
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
    Bank.create({
      bankAccountNo: "",
      accountName: "",
      bankName: "",
      brandId,
      bankType: 1,
      prompayType: 1,
      status: 0,
    })
      .then((data) => {
        res.status(200).send({
          result: data,
          message: "เพิ่ม Bank สำเร็จ ",
        });
      })
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while creating the Bank.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the Bank.",
    });
  }
};
const editBankAccount = async (req, res, next) => {
  try {
    const {
      bankAccountNo,
      accountName,
      bankName,
      brandId,
      bankType,
      prompayType,
    } = req.body;
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
    Bank.update(
      {
        bankAccountNo,
        accountName,
        bankName,
        brandId,
        bankType,
        prompayType,
        status: 1,
      },
      {
        where: {
          id: +id,
        },
      }
    )
      .then(() => {
        res.status(200).send({
          message: "แก้ไข Bank สำเร็จ ",
        });
      })
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while editing the Bank.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while editing the Bank.",
    });
  }
};
const deleleBankAccount = async (req, res, next) => {
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
    Bank.update(
      { status: 0 },
      {
        where: {
          id: +id,
        },
      }
    )
      .then((data) => {
        res.status(200).send({
          result: data,
          message: "ลบ Bank สำเร็จ ",
        });
      })
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while deleting the Bank.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while deleting the Bank.",
    });
  }
};

const getBanks = async (req, res, next) => {
  try {
    const { brandId } = req.params;
    Bank.findAll({
      where: { brandId: +brandId, status: 1 },
    })
      .then((bank) => {
        res.status(200).send({
          message: "find bank.",
          result: bank,
        });
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

const getBankById = async (req, res, next) => {
  try {
    const { id } = req.params;
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
              await branchArray.push({
                bankId: id,
                branchId: doc.id,
                status: statusfetch[0] ? statusfetch[0].status : 0,
                branchName: doc.dataValues.branchName,
                branchIcon: doc.dataValues.branchIcon,
                groupId: doc.dataValues.groupId,
              });
            }),
          ]);
          delete bank.dataValues.bank_branchs;
          res.status(200).send({
            message: "find bank.",
            result: bank.dataValues,
            branch: branchArray,
          });
        } else {
          res.status(400).send({
            message: "Can't find bank.",
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
module.exports = {
  createBankAccount,
  editBankAccount,
  deleleBankAccount,
  getBanks,
  getBankById,
};
