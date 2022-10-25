require("dotenv").config();
const log4js = require("log4js");
const db = require("../../models");
const logger = log4js.getLogger();
const request = require("request-promise");
const { momentTZ } = require("../../config/moment");
const moment = require("moment");
const { QueryTypes } = require("sequelize");
const Messagelogs = db.messagelogs;
const Packages = db.packages;
const UsersAdmin = db.user_admins;
const UserBrand = db.user_brands;
const Brand = db.brands;
const PackagesBrands = db.pagekage_brands;
const Branchs = db.branchs;
const Slip = db.slips;
const Staff = db.staffs;
const Bank = db.bank_accounts;
const Transaction = db.transactions;
const PaymentFee = db.payment_fee;
const BankBranchs = db.bank_branchs;
const Remind = db.remind;
const { Op } = db.Sequelize;
const AWS = require("../../middleware/aws");

const { LINE_MESSAGING_API } = process.env;
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.LINE_TOKEN}`,
};

const slipCheck = async (data) => {
  return new Promise(async (resolve, reject) => {
    const options = {
      method: "POST",
      url: `${process.env.SLIP_API}`,
      headers: {
        "X-API-KEY": process.env.SLIP_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      form: {
        data: data,
      },
    };
    request(options, function (error, response) {
      if (error) {
        resolve(error);
      }
      resolve(JSON.parse(response.body));
    });
  });
};

const createSlip = async (data) => {
  return new Promise((resolve, reject) => {
    Slip.create({
      uniqueSlipNumber: data.uniqueSlipNumber,
      bankAccountNoSent: data.bankAccountNoSent,
      bankAccountNameSent: data.bankAccountNameSent,
      bankAccountNoReciept: data.bankAccountNoReciept,
      bankAccountNameReciept: data.bankAccountNameReciept,
      amount: data.amount,
      sentDate: momentTZ(data.sentDate, "YYYYMMDD HH:mm:ss").format(
        "YYYY-MM-DD HH:mm:ss"
      ),
    }).then((data) => {
      resolve(data);
    });
  }).catch(() => {
    resolve(null);
  });
};

const createPayment = async (data) => {
  return new Promise((resolve, reject) => {
    PaymentFee.create({
      transactionPayId: data.transactionPayId,
      bankAccountNoSent: data.bankAccountNoSent,
      bankAccountNameSent: data.bankAccountNameSent,
      bankAccountNoReciept: data.bankAccountNoReciept,
      bankAccountNameReciept: data.bankAccountNameReciept,
      amount: data.amount,
      sentDate: momentTZ(data.sentDate, "YYYYMMDD HH:mm:ss").format(
        "YYYY-MM-DD HH:mm:ss"
      ),
    }).then((data) => {
      resolve(data);
    });
  });
};

const createStaff = async (user) => {
  return new Promise(async (resolve, reject) => {
    const staff = await Staff.findOne({
      where: { uuidLine: user.userId },
    });
    if (staff) {
      resolve(staff);
    } else {
      Staff.create({
        lineName: user.displayName,
        uuidLine: user.userId,
      }).then((data) => {
        resolve(data);
      });
    }
  }).catch(() => {
    resolve(null);
  });
};

const getBranchIdByGroup = async ({ groupId = "" }) => {
  return new Promise(async (resolve, reject) => {
    Branchs.findOne({
      where: { groupId: +groupId },
      attributes: ["id", "branchName", "brandId"],
    })
      .then((doc) => {
        if (doc) {
          resolve(doc);
        } else {
          resolve(null);
        }
      })
      .catch(() => {
        resolve(null);
      });
  });
};

const createBrand = async (userId) => {
  return new Promise((resolve, reject) => {
    Brand.create({
      brandName: "ร้านใหม่",
      brandTag: "",
      brandComment: "",
      businessType: "",
      userId,
      status: 1,
      brandTel: "",
      companyName: "",
      companyAddress: "",
      companyZipcode: "",
      companyTaxId: "",
      companyBranchId: "",
      brandStatus: 1,
      editDate: momentTZ().format("YYYY-MM-DD HH:mm:ss"),
    })
      .then((data) => {
        UserBrand.create({
          userId,
          brandId: +data.id,
          editBrand: 1,
          inviteUser: 1,
          status: 1,
        })
          .then((brand) => {
            resolve(brand);
          })
          .catch(() => {
            resolve(null);
          });
      })
      .catch(() => {
        resolve(null);
      });
  });
};

const createBrandPackage = async (brandId, package) => {
  return new Promise((resolve, reject) => {
    PackagesBrands.create({
      packageId: package.id,
      packageName: package.packageName,
      packageAmount: package.packageAmount,
      packagePer: package.packagePer,
      quota:
        package.packagePer === "y" ? package.quotaPerM * 12 : package.quotaPerM,
      quotaPerM: package.quotaPerM,
      adminNumber: package.adminNumber,
      branchNum: package.branchNum,
      overQuotaAmount: package.overQuotaAmount,
      report: package.report,
      packageDetail: package.packageDetail,
      status: 0,
      endDate: momentTZ(
        moment().add(1, package.packagePer === "y" ? "y" : "M")
      ).format("YYYY-MM-DD HH:mm:ss"),
      companyBranchId: package.companyBranchId,
      brandId,
      overAmount: 0,
    })
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        console.log("error==>", error);
        resolve(null);
      });
  });
};

const getBrandPackageId = async (brandId) => {
  return new Promise(async (resolve, reject) => {
    const count = await PackagesBrands.count({
      where: { brandId, status: 1 },
    });
    if (count > 0) {
      PackagesBrands.findOne({ where: { brandId } })
        .then((packages) => {
          resolve({ packages, renew: true });
        })
        .catch((err) => {
          console.log(err);
          resolve(null);
        });
    } else {
      PackagesBrands.findOne({ where: { brandId } })
        .then((packages) => {
          resolve({ packages, renew: false });
        })
        .catch((err) => {
          console.log(err);
          resolve(null);
        });
    }
  });
};

const getBrandPackageById = async (id) => {
  return new Promise(async (resolve, reject) => {
    Packages.findOne({ where: { id: +id } })
      .then((packages) => {
        resolve(packages);
      })
      .catch((err) => {
        console.log(err);
        resolve(null);
      });
  });
};

const getBrandPackageIdCheck = async (brandId) => {
  return new Promise(async (resolve, reject) => {
    PackagesBrands.findOne({ where: { brandId } })
      .then((packages) => {
        resolve(packages);
      })
      .catch((err) => {
        console.log(err);
        resolve(null);
      });
  });
};

const updateStatusPackagesBrands = async (id, brandId) => {
  return new Promise((resolve, reject) => {
    PackagesBrands.update(
      { status: 1 },
      {
        where: {
          id: +id,
        },
      }
    )
      .then(() => {
        Brand.update(
          {
            status: 1,
          },
          {
            where: {
              id: +brandId,
            },
          }
        );
        resolve(true);
      })
      .catch(() => {
        resolve(null);
      });
  });
};

const updatePackagesBrandsRenew = async (id, brandId, package) => {
  return new Promise((resolve, reject) => {
    const pice =
      package.packagePer === "y" ? package.quotaPerM * 12 : package.quotaPerM;
    PackagesBrands.update(
      {
        quota: package.quota + pice,
        overAmount: 0,
        endDate: momentTZ(
          moment(package.endDate).add(1, package.packagePer === "m" ? "M" : "y")
        ).format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        where: {
          id: +id,
        },
      }
    )
      .then(() => {
        Brand.update(
          {
            status: 1,
          },
          {
            where: {
              id: +brandId,
            },
          }
        );
        resolve(true);
      })
      .catch(() => {
        resolve(null);
      });
  });
};

const updatePackagesBrandsChange = async (ole, brandId, package) => {
  return new Promise((resolve, reject) => {
    const pice =
      package.packagePer === "y" ? package.quotaPerM * 12 : package.quotaPerM;
    PackagesBrands.update(
      {
        packageName: package.packageName,
        packageAmount: package.packageAmount,
        packagePer: package.packagePer,
        quota: ole.packages.quota + pice,
        adminNumber: package.adminNumber,
        branchNum: package.branchNum,
        overQuotaAmount: package.overQuotaAmount,
        report: package.report,
        packageDetail: package.packageDetail,
        status: 1,
        endDate: momentTZ(
          moment(ole.packages.endDate).add(
            1,
            package.packagePer === "y" ? "y" : "M"
          )
        ).format("YYYY-MM-DD HH:mm:ss"),
        companyBranchId: package.companyBranchId,
        brandId,
        overAmount: 0,
        changeId: 0,
        packageId: package.id,
      },
      {
        where: {
          id: +ole.packages.id,
        },
      }
    )
      .then(() => {
        Brand.update(
          {
            status: 1,
          },
          {
            where: {
              id: +brandId,
            },
          }
        );
        resolve(true);
      })
      .catch(() => {
        resolve(null);
      });
  });
};

const updatePackagesBrandsChangeId = async (packageId, brandId) => {
  return new Promise((resolve, reject) => {
    PackagesBrands.update(
      {
        changeId: +packageId,
        editDate: momentTZ().format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        where: {
          brandId: +brandId,
        },
      }
    )
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        resolve(null);
      });
  });
};

const updatePackagesBrandsOver = async (id, package) => {
  return new Promise((resolve, reject) => {
    PackagesBrands.update(
      {
        overAmount: (package.overAmount || 0) + package.overQuotaAmount,
      },
      {
        where: {
          id: +id,
        },
      }
    )
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        resolve(null);
      });
  });
};

const updatePackagesBrandsUse = async (id, package) => {
  return new Promise((resolve, reject) => {
    PackagesBrands.update(
      {
        quota: package.quota - 1,
      },
      {
        where: {
          id: +id,
        },
      }
    )
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        resolve(null);
      });
  });
};

const getBrandId = async (id) => {
  return new Promise(async (resolve, reject) => {
    const [results] = await db.sequelize.query(
      "SELECT `user_brands`.`id` AS `user_brands.id`, `user_brands`.`userId` AS `user_brands.userId`, `user_brands`.`brandId` AS `brandId`, `brands`.`id`, `brands`.`brandName`, `brands`.`editDate` FROM `brands` INNER JOIN `user_brands` AS `user_brands` ON `brands`.`id` = `user_brands`.`brandId` where `user_brands`.`userId` = ? ORDER BY `brands`.`editDate` DESC",
      {
        replacements: [id],
      }
    );
    if (results.length > 0) {
      resolve(results[0]);
    } else {
      resolve(null);
    }
  });
};

const checkUser = async (uuid) => {
  return new Promise((resolve, reject) => {
    UsersAdmin.findAll({
      where: { uuidLine: uuid },
    })
      .then((doc) => {
        if (doc.length !== 0) {
          UserBrand.findAll({
            where: {
              userId: doc[0].id,
              status: 1,
            },
            include: [
              {
                model: Brand,
                where: {
                  status: 1,
                },
              },
            ],
          }).then((brands) => {
            if (brands.length !== 0) {
              resolve({ user: doc[0], brands: brands });
            } else {
              resolve({ user: doc[0], brands: [] });
            }
          });
        } else {
          resolve({ user: false, brands: [] });
        }
      })
      .catch(async (err) => {
        reject({
          message:
            err.message || "Some error occurred while creating the user.",
        });
      });
  });
};

const updateUser = async (user, id) => {
  return new Promise((resolve, reject) => {
    UsersAdmin.update(
      { lineName: user.displayName, uuidLine: user.userId, status: 1 },
      {
        where: {
          id: +id,
        },
      }
    )
      .then((doc) => {
        resolve(doc);
      })
      .catch(async (err) => {
        reject({
          message:
            err.message || "Some error occurred while creating the user.",
        });
      });
  });
};

const createUser = async (user) => {
  UsersAdmin.create({
    lineName: user.displayName,
    uuidLine: user.userId,
    status: 1,
  });
};

const removeUser = async (id) => {
  UsersAdmin.destroy({ id: +id });
};

const createMessageLog = async (user, messageAction, type) => {
  try {
    Messagelogs.create({
      uuidLine: user.userId,
      userNameLine: user.displayName,
      message: messageAction,
      typeMessage: type,
    })
      .then(() => {})
      .catch((error) => {
        logger.error({ error });
        res.status(400).send({
          message: error || "Some error occurred while creating the Branch.",
        });
      });
  } catch (error) {
    logger.error({ error });
    res.status(400).send({
      message: error || "Some error occurred while creating the Branch.",
    });
  }
};

const getLineId = (uidLine) => {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://api.line.me/v2/bot/profile/${uidLine}`,
        method: "GET",
        headers: { Authorization: `Bearer ${process.env.LINE_TOKEN}` },
      },
      (error, response, body) => {
        if (error) {
          reject({
            status: 401,
            message: "กรุณาล็อกอินใหม่อีกครั้ง",
            error: error,
          });
        } else if (response.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject({
            status: 401,
            message: "กรุณาล็อกอินใหม่อีกครั้งsss",
            error: error,
          });
        }
      }
    );
  });
};

const getPackages = (id) => {
  return new Promise((resolve, reject) => {
    Packages.findOne({
      where: { id: +id },
    })
      .then((doc) => {
        resolve(doc);
      })
      .catch(() => {
        resolve(false);
      });
  });
};

const getPackagesBrand = (id, brandId) => {
  return new Promise((resolve, reject) => {
    PackagesBrands.findOne({
      where: { packageId: +id, brandId: +brandId },
    })
      .then((doc) => {
        resolve(doc);
      })
      .catch(() => {
        resolve(false);
      });
  });
};

const listPackages = async ({ replyToken = "" }) => {
  Packages.findAll().then(async (data) => {
    const dataFlex = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].id < 100) {
        const year = data.find(function (e) {
          return e.id === data[i].id + 100;
        });
        dataFlex.push({
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
                    text: data[i].packageName,
                    color: "#ffffff",
                    size: "xl",
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
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: data[i].packageDetail,
                wrap: true,
                size: "sm",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: "- ราคา " + data[i].packageAmount,
                wrap: true,
                size: "sm",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- ตรวจสอบสลิปได้สูงสุด ${data[i].quotaPerM} สลิป/เดือน`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: "- สามารถดูสรุปยอดโอนสลิปรายวันได้",
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- สามารถสร้าง Admin ได้รวม ${
                  data[i].adminNumber !== 0
                    ? data[i].adminNumber + " ท่าน"
                    : "ไม่จำกัด"
                }`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- สามารถสร้างสาขา ได้รวม ${
                  data[i].branchNum !== 0
                    ? data[i].branchNum + " สาขา"
                    : "ไม่จำกัด"
                }`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- หากสลิปเกินสามารถจ่ายเพิ่มได้ ${data[i].overQuotaAmount} บาท/สลิป`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `${
                  data[i].id === 1
                    ? "- ไม่สามารถดูสรุปข้อมูลภาพรวมย้อนหลังได้"
                    : "- สามารถดูสรุปข้อมูลภาพรวมย้อนหลังได้"
                }`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "separator",
                margin: "xxl",
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
                style: "link",
                action: {
                  type: "postback",
                  label: `จ่ายรายเดือน ${data[i].packageAmount} บาท/เดือน`,
                  data: `code:${data[i].id}`,
                  displayText: "สมัคร " + data[i].packageName,
                },
              },
              {
                type: "button",
                style: "link",
                action: {
                  type: "postback",
                  label: `จ่ายรายปี ${year.packageAmount} บาท/ปี`,
                  data: `code:${data[i].id + 100}`,
                  displayText: "สมัคร " + data[i].packageName,
                },
              },
            ],
          },
        });
      }
    }
    request({
      method: "POST",
      uri: `${LINE_MESSAGING_API}/reply`,
      headers: LINE_HEADER,
      body: JSON.stringify({
        replyToken,
        messages: [
          {
            type: "flex",
            altText: "Packages",
            contents: {
              type: "carousel",
              contents: dataFlex,
            },
          },
        ],
      }),
    });
  });
};

const listPackagesNew = async ({ replyToken = "", user = {} }) => {
  Packages.findAll().then(async (data) => {
    const dataFlex = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].id < 100) {
        const year = data.find(function (e) {
          return e.id === data[i].id + 100;
        });
        dataFlex.push({
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
                    text: data[i].packageName,
                    color: "#ffffff",
                    size: "xl",
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
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: data[i].packageDetail,
                wrap: true,
                size: "sm",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: "- ราคา " + data[i].packageAmount,
                wrap: true,
                size: "sm",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- ตรวจสอบสลิปได้สูงสุด ${data[i].quotaPerM} สลิป/เดือน`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: "- สามารถดูสรุปยอดโอนสลิปรายวันได้",
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- สามารถสร้าง Admin ได้รวม ${
                  data[i].adminNumber !== 0
                    ? data[i].adminNumber + " ท่าน"
                    : "ไม่จำกัด"
                }`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- สามารถสร้างสาขา ได้รวม ${
                  data[i].branchNum !== 0
                    ? data[i].branchNum + " สาขา"
                    : "ไม่จำกัด"
                }`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- หากสลิปเกินสามารถจ่ายเพิ่มได้ ${data[i].overQuotaAmount} บาท/สลิป`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `${
                  data[i].id === 1
                    ? "- ไม่สามารถดูสรุปข้อมูลภาพรวมย้อนหลังได้"
                    : "- สามารถดูสรุปข้อมูลภาพรวมย้อนหลังได้"
                }`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "separator",
                margin: "xxl",
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
                style: "link",
                action: {
                  type: "postback",
                  label: `จ่ายรายเดือน ${data[i].packageAmount} บาท/เดือน`,
                  data: `code:${data[i].id}`,
                  displayText: "สมัคร " + data[i].packageName,
                },
              },
              {
                type: "button",
                style: "link",
                action: {
                  type: "postback",
                  label: `จ่ายรายปี ${year.packageAmount} บาท/ปี`,
                  data: `code:${data[i].id + 100}`,
                  displayText: "สมัคร " + data[i].packageName,
                },
              },
            ],
          },
        });
      }
    }
    request({
      method: "POST",
      uri: `${LINE_MESSAGING_API}/reply`,
      headers: LINE_HEADER,
      body: JSON.stringify({
        replyToken,
        messages: [
          {
            type: "flex",
            altText: "Packages",
            contents: {
              type: "carousel",
              contents: dataFlex,
            },
          },
        ],
      }),
    });
  });
};

const listPackagesChange = async ({
  to = "",
  brandId = "",
  packageId = "",
}) => {
  Packages.findAll({
    where: {
      packageAmount: {
        [Op.ne]: 0,
      },
      id: {
        [Op.ne]: packageId,
      },
    },
  }).then(async (data) => {
    const dataFlex = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].id < 100) {
        const year = data.find(function (e) {
          return e.id === data[i].id + 100;
        });
        dataFlex.push({
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
                    text: data[i].packageName,
                    color: "#ffffff",
                    size: "xl",
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
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: data[i].packageDetail,
                wrap: true,
                size: "sm",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: "- ราคา " + data[i].packageAmount,
                wrap: true,
                size: "sm",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- ตรวจสอบสลิปได้สูงสุด ${data[i].quotaPerM} สลิป/เดือน`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: "- สามารถดูสรุปยอดโอนสลิปรายวันได้",
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- สามารถสร้าง Admin ได้รวม ${
                  data[i].adminNumber !== 0
                    ? data[i].adminNumber + " ท่าน"
                    : "ไม่จำกัด"
                }`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- สามารถสร้างสาขา ได้รวม ${
                  data[i].branchNum !== 0
                    ? data[i].branchNum + " สาขา"
                    : "ไม่จำกัด"
                }`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `- หากสลิปเกินสามารถจ่ายเพิ่มได้ ${data[i].overQuotaAmount} บาท/สลิป`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "text",
                text: `${
                  data[i].id === 1
                    ? "- ไม่สามารถดูสรุปข้อมูลภาพรวมย้อนหลังได้"
                    : "- สามารถดูสรุปข้อมูลภาพรวมย้อนหลังได้"
                }`,
                wrap: true,
                size: "xs",
                weight: "regular",
                style: "normal",
                color: "#546E7A",
              },
              {
                type: "separator",
                margin: "xxl",
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
                style: "link",
                action: {
                  type: "postback",
                  label: `จ่ายรายเดือน ${data[i].packageAmount} บาท/เดือน`,
                  data: `change:${data[i].id}change:${brandId}`,
                  displayText: "สมัคร " + data[i].packageName,
                },
              },
              {
                type: "button",
                style: "link",
                action: {
                  type: "postback",
                  label: `จ่ายรายปี ${year.packageAmount} บาท/ปี`,
                  data: `change:${data[i].id + 100}change:${brandId}`,
                  displayText: "สมัคร " + data[i].packageName,
                },
              },
            ],
          },
        });
      }
    }
    request({
      method: "POST",
      uri: `${LINE_MESSAGING_API}/push`,
      headers: LINE_HEADER,
      body: JSON.stringify({
        to: to,
        messages: [
          {
            type: "text",
            text: `กรุณาเลือก Package ที่ต้องการเปลี่ยน`,
          },
          {
            type: "flex",
            altText: "Packages",
            contents: {
              type: "carousel",
              contents: dataFlex,
            },
          },
        ],
      }),
    });
  });
};

const alertPayment = async ({
  replyToken = "",
  package = {},
  uidLine = "",
  relationId = "",
  type,
}) => {
  await Remind.create({
    to: uidLine,
    type,
    status: 1,
    relationId: +relationId,
    exDate: momentTZ(momentTZ().add(1, "hours")).format("YYYY-MM-DD HH:mm:ss"),
  });
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken,
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
                  text: `คุณได้เลือก Package ${package.packageName}`,
                  weight: "bold",
                  size: "md",
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
                  text: `จำนวนเงิน ${package.packageAmount} บาท`,
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

const alertOverTime = async ({
  replyToken = "",
  package = {},
  overData = {},
  text = " ",
}) => {
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken,
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
                  text: text,
                  weight: "bold",
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: `ร้าน ${overData.brandName}`,
                  weight: "bold",
                  size: "xs",
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
                  text: `ชำระแบบรายเดือน ${package.packageAmount} บาท/เดือน`,
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "text",
                  text: "ทางเราจะทำการปิดระบบการใช้งานชั่วคราว หากต้องการเริ่มใช้งานระบบใหม่กรุณาชำระค่าบริการ",
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

const paymentSuccess = async ({
  replyToken = "",
  brandName = "",
  packageName = "",
}) => {
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken,
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
                  text: "ขอบคุณที่ชำระค่าบริการ",
                },
                {
                  type: "text",
                  weight: "bold",
                  size: "md",
                  wrap: true,
                  text:
                    brandName === ""
                      ? "ขณะนี้คุณสามารถเริ่มสร้างร้านได้ที่ลิงก์นี้"
                      : `ขณะนี้ร้าน ${brandName} ของคุณสามารถใช้ Package ${packageName} ได้แล้ว`,
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
                  action: {
                    type: "uri",
                    label: "จัดการร้านค้า",
                    uri: process.env.LIFF_URL,
                  },
                  style: "link",
                },
              ],
              backgroundColor: "#" + process.env.MESSAGE_BG_COLOR,
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

const dupAlert = async ({ replyToken = "", text = {} }) => {
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken,
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
                  text: "⚠️ สลิปซ้ำ ",
                },
                {
                  type: "text",
                  weight: "bold",
                  size: "md",
                  wrap: true,
                  text: " ",
                },
                {
                  type: "text",
                  size: "xs",
                  wrap: true,
                  text: "สลิปนี้ได้เคยถูกส่งเข้ามาบันทึกในระบบแล้ว",
                },
                {
                  type: "text",
                  size: "xs",
                  wrap: true,
                  text: "ตั้งแต่วันที่ " + text.date,
                },
                {
                  type: "text",
                  size: "xs",
                  wrap: true,
                  text: "เวลา " + text.time,
                },
                {
                  type: "text",
                  size: "xs",
                  wrap: true,
                  text: "ร้าน " + text.brand,
                },
                {
                  type: "text",
                  size: "xs",
                  wrap: true,
                  text: "สาขา " + text.branch,
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

const dupAlertPayment = async ({ replyToken = "", text = {} }) => {
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken,
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
                  text: "⚠️ สลิปซ้ำ ",
                },
                {
                  type: "text",
                  weight: "bold",
                  size: "md",
                  wrap: true,
                  text: " ",
                },
                {
                  type: "text",
                  size: "xs",
                  wrap: true,
                  text: "สลิปนี้ได้เคยถูกส่งเข้ามาบันทึกในระบบแล้ว",
                },
                {
                  type: "text",
                  size: "xs",
                  wrap: true,
                  text: "ตั้งแต่วันที่ " + text.date,
                },
                {
                  type: "text",
                  size: "xs",
                  wrap: true,
                  text: "เวลา " + text.time,
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

const joinBrandSuccess = async ({ replyToken = "", package = {} }) => {
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken,
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
                  text: "คุณได้เข้าร่วมเป็นผู้จัดการสาขา",
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
                  action: {
                    type: "uri",
                    label: "เข้าใช้งาน",
                    uri: process.env.LIFF_URL,
                  },
                  style: "link",
                },
              ],
            },
          },
        },
      ],
    }),
  });
};

const paymentF = async ({ replyToken = "", text = "" }) => {
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: `text`,
          text: text !== "" ? text : "🚫ไม่เจอข้อมูล",
        },
      ],
    }),
  });
};

const getBankByBrandId = async ({
  brandId = "",
  bankAccountNo = "",
  replyToken = "",
}) => {
  return new Promise(async (resolve, reject) => {
    const check = [];
    if (bankAccountNo.proxy.value && bankAccountNo.proxy.value !== "") {
      const text = bankAccountNo.proxy.value;
      check.push(text ? text.slice(-4) : "");
    } else if (
      bankAccountNo.account.value &&
      bankAccountNo.account.value !== ""
    ) {
      const text = bankAccountNo.account.value;
      check.push(text ? text.slice(-6, -2) : "");
    } else {
      check.push("");
    }
    const accountName = bankAccountNo.displayName;
    Bank.findOne({
      where:
        check[0] !== ""
          ? {
              brandId: +brandId,
              status: 1,
              bankAccountNo: {
                [Op.like]: `%${check[0]}%`,
              },
            }
          : {
              brandId: +brandId,
              status: 1,
              accountName: {
                [Op.like]: accountName ? `%${accountName.slice(0, -3)}%` : "",
              },
            },
    })
      .then((doc) => {
        if (doc) {
          resolve(doc);
        } else {
          request({
            method: "POST",
            uri: `${LINE_MESSAGING_API}/reply`,
            headers: LINE_HEADER,
            body: JSON.stringify({
              replyToken,
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
                          size: "sm",
                          wrap: true,
                          text: `✅สลิปถูกต้อง`,
                        },
                        {
                          type: "text",
                          weight: "bold",
                          size: "sm",
                          wrap: true,
                          text: `⚠️ แต่บัญชีผู้รับเงินไม่มีในข้อมูลของร้านคุณ`,
                        },
                        {
                          type: "text",
                          weight: "bold",
                          size: "sm",
                          wrap: true,
                          text: `เลขที่บัญชีผู้รับ ${
                            bankAccountNo.proxy.value === ""
                              ? bankAccountNo.account.value ||
                                bankAccountNo.proxy.value
                              : bankAccountNo.proxy.value ||
                                bankAccountNo.account.value
                          } หากเป็นบัญชีที่ทางร้านใช้ โปรดทำการเพิ่มบัญชีที่ลิงก์นี้`,
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
                          action: {
                            type: "uri",
                            label: "จัดการบัญชีธนาคาร",
                            uri: process.env.LIFF_URL,
                          },
                          style: "link",
                        },
                      ],
                      backgroundColor: "#" + process.env.MESSAGE_BG_COLOR,
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
        }
      })
      .catch(() => {
        resolve(null);
      });
  });
};

const qrReader = async (event) => {
  return new Promise(async (resolve, reject) => {
    const Jimp = require("jimp");
    const QrCode = require("qrcode-reader");

    // กำหนด URL ในการไปดึง binary จาก LINE กรณีผู้ใช้อัพโหลดภาพมาเอง
    let url = `https://api-data.line.me/v2/bot/message/${event.message.id}/content`;

    // ตรวจสอบว่าภาพนั้นถูกส่งมจาก LIFF หรือไม่
    if (event.message.contentProvider.type === "external") {
      // กำหนด URL รูปภาพที่ LIFF ส่งมา
      url = event.message.contentProvider.originalContentUrl;
    }

    // ดาวน์โหลด binary
    let buffer = await request.get({
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.LINE_TOKEN}`,
      },
      uri: url,
      encoding: null, // แก้ปัญหา binary ไม่สมบูรณ์จาก default encoding ที่เป็น utf-8
    });
    AWS.compressQRcode(buffer, 65)
      .then(async (objFile) => {
        const img = await Jimp.read(objFile.data);
        img.getBuffer(Jimp.MIME_PNG, (err, bufferCover) => {
          Jimp.read(bufferCover, function (err, image) {
            if (err) {
              console.error(err);
              resolve(null);
            }
            const qr = new QrCode();
            qr.callback = function (err, value) {
              if (err) {
                console.error(err);
                resolve(null);
              }
              if (value) {
                resolve(value.result);
              } else {
                resolve(null);
              }
            };
            qr.decode(image.bitmap);
          });
        });
      })
      .catch((err) => {
        resolve(null);
      });
  });
};

const unsendGetContent = async ({ replyToken = "", event = {} }) => {
  return new Promise(async (resolve, reject) => {
    Transaction.findOne({
      where: { messageId: event.unsend.messageId },
    }).then(async (doc) => {
      if (doc) {
        const branch = await Branchs.findOne({
          where: { id: +doc.branchId },
        });
        const slip = await Slip.findOne({
          where: { id: +doc.slipId },
        });
        const brand = await Brand.findOne({
          where: { id: +branch.brandId },
        });
        request({
          method: "POST",
          uri: `${LINE_MESSAGING_API}/push`,
          headers: LINE_HEADER,
          body: JSON.stringify({
            to: replyToken,
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
                        text: `คุณต้องการลบรูปสลิปของ`,
                        weight: "bold",
                        size: "md",
                        wrap: true,
                      },
                      {
                        type: "text",
                        text: `ร้าน ${brand.brandName}`,
                        weight: "bold",
                        size: "xs",
                        wrap: true,
                      },
                      {
                        type: "text",
                        text: `สาขา ${branch.branchName}`,
                        size: "xs",
                        wrap: true,
                      },
                      {
                        type: "text",
                        text: `โอนจากเลขที่บัญชี ${slip.bankAccountNoSent}`,
                        size: "xs",
                        wrap: true,
                      },
                      {
                        type: "text",
                        text: `ชื่อบัญชี ${slip.bankAccountNameSent}`,
                        size: "xs",
                        wrap: true,
                      },
                      {
                        type: "text",
                        text: `ไปยังเลขที่บัญชี ${slip.bankAccountNoReciept}`,
                        size: "xs",
                        wrap: true,
                      },
                      {
                        type: "text",
                        text: `ชื่อบัญชี ${slip.bankAccountNameReciept}`,
                        size: "xs",
                        wrap: true,
                      },
                      {
                        type: "text",
                        text: `จำนวนเงิน ${slip.amount} บาท`,
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
                        text: "คุณต้องการลบข้อมูลออกจากระบบด้วยหรือไม่",
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
                          label: "ลบ",
                          data: `delete:${event.unsend.messageId}`,
                          displayText: "ลบ",
                        },
                        color: "#FD0000",
                      },
                      {
                        type: "button",
                        style: "link",
                        action: {
                          type: "postback",
                          label: "ไม่ลบ",
                          data: `notDelete`,
                          displayText: "ไม่ลบ",
                        },
                      },
                    ],
                    backgroundColor: "#" + process.env.MESSAGE_BG_COLOR,
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
      }
    });
  });
};

const deleteTransaction = (messageId) => {
  return new Promise(async (resolve, reject) => {
    Transaction.destroy({
      where: {
        messageId: messageId,
      },
    })
      .then(() => {
        console.log("true");
        resolve(true);
      })
      .catch(() => {
        console.log("false");
        resolve(false);
      });
  });
};

const conectBranch = async ({ groupId = "", id = "", replyToken = "" }) => {
  try {
    Branchs.findOne({
      where: { id: +id, groupId: "" },
      attributes: ["id", "branchName", "brandId"],
    }).then(async (doc) => {
      if (doc) {
        const brand = await Brand.findOne({
          where: { id: +doc.brandId },
          attributes: ["id", "brandName"],
        });
        Branchs.update(
          {
            groupId,
          },
          {
            where: {
              id: +id,
            },
          }
        )
          .then(() => {
            request({
              method: "POST",
              uri: `${LINE_MESSAGING_API}/reply`,
              headers: LINE_HEADER,
              body: JSON.stringify({
                replyToken,
                messages: [
                  {
                    type: "flex",
                    altText: "Packages",
                    contents: {
                      type: "bubble",
                      size: "mega",
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
                                text: "SlipOk มาแล้ว!",
                                color: "#ffffff",
                                size: "xl",
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
                            weight: "bold",
                            size: "md",
                            wrap: true,
                            text: `ขอบคุณที่ชวน SlipOk เข้ามาเป็นสมาชิกใหม่ของ ${brand.brandName} เพื่อการตรวจสอบสลิปโอนเงินให้`,
                          },
                          {
                            type: "text",
                            size: "md",
                            wrap: true,
                            text: `ร้าน ${brand.brandName}`,
                          },
                          {
                            type: "text",
                            size: "md",
                            wrap: true,
                            text: `สาขา${doc.branchName}`,
                          },
                          {
                            type: "text",
                            size: "md",
                            wrap: true,
                            text: `ขณะนี้การเชื่อมต่อสำเร็จแล้ว`,
                          },
                          {
                            type: "text",
                            size: "md",
                            wrap: true,
                            text: `คุณสามารถเริ่มต้นใช้บริการได้ทันที✨`,
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
          })
          .catch(() => {
            paymentF({
              replyToken,
              text: `🚫ไม่เจอข้อมูลนี้`,
            });
          });
      } else {
        paymentF({
          replyToken,
          text: `🚫ไม่เจอข้อมูลนี้`,
        });
      }
    });
  } catch (error) {
    paymentF({
      replyToken,
      text: `🚫ไม่เจอข้อมูลนี้`,
    });
  }
};

const unjoinBranch = async ({ groupId = "" }) => {
  try {
    Branchs.findOne({
      where: { groupId: groupId },
      attributes: ["id", "branchName"],
    }).then((doc) => {
      if (doc) {
        Branchs.update(
          {
            groupId: "",
          },
          {
            where: {
              id: +doc.id,
            },
          }
        );
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const checkTransaction = async (uniqueSlipNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      const [results] = await db.sequelize.query(
        "SELECT COUNT(`slips`.`id`) as count, `transactions`.`sentDate` as sentDate, `transactions`.`branchId` as branchId FROM `transactions` Left JOIN `slips` AS `slips` ON `slips`.`id` = `transactions`.`slipId` WHERE `slips`.`uniqueSlipNumber` = ?",
        {
          replacements: [uniqueSlipNumber],
        }
      );
      resolve(results[0]);
    } catch (error) {
      resolve(null);
    }
  });
};

const checkPayment = async (uniqueSlipNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      const [results] = await db.sequelize.query(
        "SELECT COUNT(`payment_fee`.`id`) as count, `payment_fee`.`sentDate` as sentDate FROM `payment_fee`  WHERE `payment_fee`.`transactionPayId` = ?",
        {
          replacements: [uniqueSlipNumber],
        }
      );
      resolve(results[0]);
    } catch (error) {
      resolve(null);
    }
  });
};

const creteTransaction = async (data) => {
  return new Promise((resolve, reject) => {
    Transaction.create({
      bankId: data.bankId,
      amount: data.amount,
      staffId: data.staffId,
      slipId: data.slipId,
      varifyResult: 1,
      branchId: data.branchId,
      sentDate: momentTZ().format("YYYY-MM-DD HH:mm:ss"),
      messageId: data.messageId,
    }).then(() => {
      resolve(true);
    });
  }).catch(() => {
    resolve(false);
  });
};

const getDupData = async (branchID) => {
  return new Promise(async (resolve, reject) => {
    try {
      const [results] = await db.sequelize.query(
        "SELECT `branchs`.`branchName` as branchName, `brands`.`brandName` as brandName FROM `branchs` Left JOIN `brands` AS `brands` ON `brands`.`id` = `branchs`.`brandId` WHERE `branchs`.`id` = ?",
        {
          replacements: [branchID],
        }
      );
      resolve(results[0]);
    } catch (error) {
      resolve(null);
    }
  });
};

const pushMassageCreateBranch = async ({ replyToken = "" }) => {
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken,
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
                  style: "link",
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

const GetToday = async ({ replyToken = "", haveStore = {} }) => {
  UserBrand.findAll({
    where: {
      userId: haveStore.user.id,
      status: 1,
    },
    include: [
      {
        model: Brand,
        where: {
          status: 1,
        },
      },
    ],
  }).then((brands) => {
    const dataFlex = [];
    if (brands.length !== 0) {
      for (let i = 0; i < brands.length; i++) {
        dataFlex.push({
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: `${brands[i].dataValues.brands[0].brandName}`,
                wrap: true,
                weight: "bold",
                size: "xl",
              },
              {
                type: "text",
                text: `${brands[i].dataValues.brands[0].brandType || "-"}`,
                wrap: true,
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: `${brands[i].dataValues.brands[0].businessType || "-"}`,
                wrap: true,
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: `${brands[i].dataValues.brands[0].brandComment || "-"}`,
                wrap: true,
                weight: "bold",
                size: "md",
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
                style: "link",
                action: {
                  type: "postback",
                  label: "เลือก",
                  data: `today:${brands[i].dataValues.brands[0].id}today:${brands[i].dataValues.brands[0].brandName}`,
                  displayText: `เลือกร้านค้า ${brands[i].dataValues.brands[0].brandName}`,
                },
              },
            ],
          },
        });
      }
      request({
        method: "POST",
        uri: `${LINE_MESSAGING_API}/reply`,
        headers: LINE_HEADER,
        body: JSON.stringify({
          replyToken,
          messages: [
            {
              type: "text",
              text: `กรุณาเลือกร้านค้าที่ต้องการ`,
            },
            {
              type: "flex",
              altText: "Packages",
              contents: {
                type: "carousel",
                contents: dataFlex,
              },
            },
          ],
        }),
      });
    }
  });
};

const sendTodayData = async ({
  replyToken = "",
  brands = [],
  brandName = "",
  brandId = "",
}) => {
  const dataFlex = [
    {
      type: "text",
      text: `ร้าน ${brandName}`,
      wrap: true,
      size: "xs",
    },
  ];
  for (let i = 0; i < brands.length; i++) {
    dataFlex.push({
      type: "text",
      text: `สาขา ${brands[i].branchData.data.branchName}`,
      wrap: true,
      size: "xs",
    });
    for (let j = 0; j < brands[i].branchData.bank.length; j++) {
      dataFlex.push(
        {
          type: "text",
          text: `บัญชี ${brands[i].branchData.bank[j].bankName}`,
          wrap: true,
          size: "xs",
        },
        {
          type: "text",
          text: `ยอดรวม ${brands[i].branchData.bank[j].summary.amountAll} บาท`,
          wrap: true,
          size: "xs",
        },
        {
          type: "text",
          text: `จำนวน ${brands[i].branchData.bank[j].summary.dateCount} รายการ`,
          wrap: true,
          size: "xs",
        }
      );
      if (brands[i].branchData.bank.length > 1) {
        dataFlex.push(
          {
            type: "separator",
            margin: "xxl",
          },
          {
            type: "text",
            text: `ยอดสลิปโอนรวม ${brands[i].branchSummary.amountAll} บาท`,
            wrap: true,
            size: "xs",
          },
          {
            type: "text",
            text: `จำนวนสลิปโอน ${brands[i].branchSummary.dateCount} รายการ`,
            wrap: true,
            size: "xs",
          }
        );
      }
    }
  }
  dataFlex.push({
    type: "text",
    text: `ดูข้อมูลแบบละเอียดได้ที่ลิงก์นี้`,
    wrap: true,
    size: "xs",
  });
  request({
    method: "POST",
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken,
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
                      text: `🗓รายการสรุปสลิปโอนวันนี้`,
                      wrap: true,
                      weight: "bold",
                      size: "xs",
                    },
                    {
                      type: "text",
                      text: `วันที่ ${momentTZ().format(
                        "DD/MM/YYYY"
                      )} เวลา ${momentTZ().format("HH:mm")} น.`,
                      wrap: true,
                      size: "xs",
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
              contents: dataFlex,
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  action: {
                    type: "uri",
                    label: "ดูข้อมูล",
                    uri: `${process.env.LIFF_URL}/${brandId}`,
                  },
                  style: "link",
                },
              ],
            },
          },
        },
      ],
    }),
  });
};

const getBranchById = async (id, startDate, endDate) => {
  return new Promise(async (resolve, reject) => {
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
              const [results] = await Promise.all([
                db.sequelize.query(
                  "SELECT SUM(`transactions`.`amount`) as `amountAll`, COUNT (`transactions`.`id`) as `dateCount` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on  `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `bank_accounts`.`id` = :bankId and `transactions`.`sentDate` >= :startDate  and `transactions`.`sentDate` <= :endDate;",
                  {
                    replacements: {
                      startDate: new Date(startDate),
                      endDate: new Date(endDate),
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
    Branchs.findAll({
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

const getTodayByBrand = async (brandId) => {
  return new Promise(async (resolve, reject) => {
    const startDate = moment(moment().subtract(1, "day")).format("YYYY-MM-DD");
    const endDate = moment(moment().add(1, "day")).format("YYYY-MM-DD");
    const data = [];
    const branchs = await getBranchs(+brandId);
    await Promise.all([
      await branchs.forEach(async (doc, index) => {
        const branchResult = await getBranchById(doc.id, startDate, endDate);
        const [results] = await db.sequelize.query(
          "SELECT SUM(`transactions`.`amount`) as `amountAll`, COUNT (`transactions`.`id`) as `dateCount` FROM `transactions` JOIN `branchs` on `transactions`.`branchId` = `branchs`.`id` JOIN `bank_accounts` on `transactions`.`bankId` = `bank_accounts`.`id` JOIN `slips` on  `slips`.`id` = `transactions`.`slipId` JOIN `staffs` on `staffs`.`id` = `transactions`.`staffId` where `transactions`.`branchId` = :branchId and `transactions`.`sentDate` >= :startDate  and `transactions`.`sentDate` <= :endDate;",
          {
            replacements: {
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              branchId: doc.id,
            },
            type: QueryTypes.SELECT,
          }
        );
        data.push({ branchData: branchResult, branchSummary: results });
        if (branchs.length === index + 1) {
          resolve({
            branchs: data,
          });
        }
      }),
    ]);
  });
};

const replyMessage = async (req, res, next) => {
  try {
    const actionType = req.body.events[0].type;
    const uidLine = req.body.events[0].source.userId;
    const { replyToken } = req.body.events[0];
    let event = req.body.events[0];
    if (actionType === "message") {
      const messageAction = req.body.events[0].message.text;
      const user = await getLineId(uidLine);
      switch (messageAction) {
        case "สมัครร้านของคุณ":
          if (event.source.type !== "group") {
            await pushMassageCreateBranch({ replyToken });
          }
          break;
        case "สลิปโอนวันนี้":
          if (event.source.type !== "group") {
            const haveStore = await checkUser(uidLine);
            await GetToday({ replyToken, haveStore });
          }
          break;
        default:
          const isImage = req.body.events[0].message.type === "image";
          const isSticker = req.body.events[0].message.type === "sticker";
          if (isSticker) {
            await createMessageLog(user, "sticker", "sticker");
          } else if (isImage) {
            if (event.source.type === "group") {
              const qrcode = await qrReader(event);
              if (qrcode) {
                const result = qrcode.includes("code:");
                if (result) {
                  const myArray = qrcode.split("e:");
                  conectBranch({
                    groupId: event.source.groupId,
                    id: myArray[1],
                    replyToken,
                  });
                } else {
                  console.log(qrcode); // slip
                  const branchId = await getBranchIdByGroup(
                    event.source.groupId
                  );
                  const checkDup = await checkTransaction(qrcode);
                  if (checkDup.count !== 0) {
                    const dupData = await getDupData(checkDup.branchId);
                    dupAlert({
                      replyToken,
                      text: {
                        date: momentTZ(checkDup.sentDate).format("YYYY-MM-DD"),
                        time: momentTZ(checkDup.sentDate).format("HH:mm"),
                        brand: dupData.brandName,
                        branch: dupData.branchName,
                      },
                    });
                  }
                  if (branchId) {
                    const slipCheckResult = await slipCheck(qrcode);
                    if (!slipCheckResult.data) {
                      paymentF({ replyToken, text: "🚫ไม่เจอข้อมูลสลิปนี้" });
                    }
                    if (!slipCheckResult.data.response.data) {
                      paymentF({ replyToken, text: "🚫ไม่เจอข้อมูลสลิปนี้" });
                    }
                    if (
                      !slipCheckResult.data.response.data.statusMessage ===
                      "SUCCESS"
                    ) {
                      paymentF({ replyToken, text: "🚫ไม่เจอข้อมูลสลิปนี้" });
                    }
                    const { sender, receiver, transDate, transTime, amount } =
                      slipCheckResult.data.response.data;

                    const slip = await createSlip({
                      uniqueSlipNumber: qrcode,
                      bankAccountNoSent:
                        sender.proxy.value === ""
                          ? sender.account.value || sender.proxy.value
                          : sender.proxy.value || sender.account.value,
                      bankAccountNameSent: sender.name,
                      bankAccountNoReciept:
                        receiver.proxy.value === ""
                          ? receiver.account.value || sender.proxy.value
                          : receiver.proxy.value || sender.account.value,
                      bankAccountNameReciept: receiver.name,
                      amount: amount,
                      sentDate: `${transDate} ${transTime}`,
                    });
                    const staff = await createStaff(user);
                    const bank = await getBankByBrandId({
                      brandId: branchId.brandId,
                      bankAccountNo: receiver,
                      replyToken,
                    });
                    if (slip && staff && bank) {
                      const PackagesBrands = await getBrandPackageIdCheck(
                        branchId.brandId
                      );
                      const createTrancationResult = await creteTransaction({
                        bankId: bank.id,
                        amount: amount,
                        staffId: staff.id,
                        slipId: slip.id,
                        varifyResult: 1,
                        branchId: branchId.id,
                        messageId: event.message.id,
                      });
                      if (createTrancationResult) {
                        if (PackagesBrands.status === 1) {
                          if (PackagesBrands.quota === 0) {
                            await updatePackagesBrandsOver(
                              PackagesBrands.id,
                              PackagesBrands
                            );
                            paymentF({
                              replyToken,
                              text: `✅สลิปถูกต้อง จำนวนเงิน ${amount} บาท`,
                            });
                          } else {
                            await updatePackagesBrandsUse(
                              PackagesBrands.id,
                              PackagesBrands
                            );
                            paymentF({
                              replyToken,
                              text: `✅สลิปถูกต้อง จำนวนเงิน ${amount} บาท`,
                            });
                          }
                        } else {
                          const overData = await getDupData(checkDup.branchId);
                          if (
                            momentTZ().unix() >
                            momentTZ(
                              momentTZ(PackagesBrands.endDate).add(2, "M")
                            ).unix()
                          ) {
                            alertOverTime({
                              replyToken,
                              package: PackagesBrands,
                              overData: overData,
                              text: "☢️ เลยกำหนดชำระค่าบริการมา 60 วันแล้ว 🧾",
                            });
                          } else {
                            paymentF({
                              replyToken,
                              text: "🚫Package ไม่ได้เปิดใช้งาน",
                            });
                          }
                        }
                      }
                    }
                  } else {
                    paymentF({
                      replyToken,
                      text: "🚫กรุ๊ปนี้ยังไม่ได้เชื่อมกับสาขา",
                    });
                  }
                }
              } else {
                paymentF({ replyToken, text: "🚫ไม่เจอข้อมูล" });
              }
            } else {
              const haveStore = await checkUser(uidLine);
              const brandId = await getBrandId(haveStore.user.id);
              if (brandId) {
                const PackagesBrands = await getBrandPackageId(brandId.brandId);
                if (PackagesBrands) {
                  const qrcode = await qrReader(event);
                  if (qrcode) {
                    const checkDup = await checkPayment(qrcode);
                    if (checkDup.count !== 0) {
                      dupAlertPayment({
                        replyToken,
                        text: {
                          date: momentTZ(checkDup.sentDate).format(
                            "YYYY-MM-DD"
                          ),
                          time: momentTZ(checkDup.sentDate).format("HH:mm"),
                        },
                      });
                    }
                    const slipCheckResult = await slipCheck(qrcode);
                    if (!slipCheckResult.data) {
                      paymentF({ replyToken, text: "🚫ไม่เจอข้อมูลสลิปนี้" });
                    }
                    if (!slipCheckResult.data.response.data) {
                      paymentF({ replyToken, text: "🚫ไม่เจอข้อมูลสลิปนี้" });
                    }
                    if (
                      !slipCheckResult.data.response.data.statusMessage ===
                      "SUCCESS"
                    ) {
                      paymentF({ replyToken, text: "🚫ไม่เจอข้อมูลสลิปนี้" });
                    }
                    const { sender, receiver, transDate, transTime, amount } =
                      slipCheckResult.data.response.data;
                    if (PackagesBrands.packages.changeId === 0) {
                      // เปลี่ยน Packages
                      const text = receiver.account.value || "";
                      if (text.slice(-6, -2) !== process.env.SLIP_OK_BANK_NO) {
                        paymentF({
                          replyToken,
                          text: "🚫สลิปนี้ไม่ตรงกับบัญชี บจก. สลิปโอเค",
                        });
                      } else {
                        if (
                          PackagesBrands.packages.packageAmount === amount ||
                          (amount > PackagesBrands.packages.packageAmount - 1 &&
                            amount < PackagesBrands.packages.packageAmount + 1)
                        ) {
                          // เช็คราคาว่าตรงกับราคา Packages
                          await createPayment({
                            transactionPayId: qrcode,
                            bankAccountNoSent:
                              sender.proxy.value === ""
                                ? sender.account.value || sender.proxy.value
                                : sender.proxy.value || sender.account.value,
                            bankAccountNameSent: sender.name,
                            bankAccountNoReciept:
                              receiver.proxy.value === ""
                                ? receiver.account.value || sender.proxy.value
                                : receiver.proxy.value || sender.account.value,
                            bankAccountNameReciept: receiver.name,
                            amount: amount,
                            sentDate: `${transDate} ${transTime}`,
                          });
                          console.log("new or renew=>", PackagesBrands.renew);
                          const updatePackagesBrandsResult =
                            PackagesBrands.renew === true
                              ? await updatePackagesBrandsRenew(
                                  PackagesBrands.packages.id,
                                  brandId.brandId,
                                  PackagesBrands.packages
                                )
                              : await updateStatusPackagesBrands(
                                  PackagesBrands.packages.id,
                                  brandId.brandId
                                );
                          if (updatePackagesBrandsResult) {
                            if (PackagesBrands.renew === true) {
                              paymentSuccess({
                                replyToken,
                                brandName: brandId.brandName,
                                packageName:
                                  PackagesBrands.packages.packageName,
                              });
                            } else {
                              paymentSuccess({
                                replyToken,
                                brandName: "",
                                packageName:
                                  PackagesBrands.packages.packageName,
                              });
                            }
                          } else {
                            paymentF({ replyToken });
                          }
                        } else {
                          // เช็คราคาว่าตรงกับราคา Packages
                          await createMessageLog(user, "image", "image");
                          paymentF({
                            replyToken,
                            text: "🚫จำนวนเงินไม่ถูกต้อง",
                          });
                        }
                      }
                    } else {
                      // เปลี่ยน Packages
                      const ChangePackagesBrands = await getBrandPackageById(
                        PackagesBrands.packages.changeId
                      );
                      if (
                        ChangePackagesBrands.packageAmount === amount ||
                        (amount > ChangePackagesBrands.packageAmount - 1 &&
                          amount < ChangePackagesBrands.packageAmount + 1)
                      ) {
                        // เช็คราคาว่าตรงกับราคา Packages
                        await createPayment({
                          transactionPayId: qrcode,
                          bankAccountNoSent:
                            sender.proxy.value === ""
                              ? sender.account.value || sender.proxy.value
                              : sender.proxy.value || sender.account.value,
                          bankAccountNameSent: sender.name,
                          bankAccountNoReciept:
                            receiver.proxy.value === ""
                              ? receiver.account.value || sender.proxy.value
                              : receiver.proxy.value || sender.account.value,
                          bankAccountNameReciept: receiver.name,
                          amount: amount,
                          sentDate: `${transDate} ${transTime}`,
                        });
                        const PackagesBrandsChangeResult =
                          await updatePackagesBrandsChange(
                            PackagesBrands.packages,
                            brandId.brandId,
                            ChangePackagesBrands
                          );
                        if (PackagesBrandsChangeResult) {
                          paymentSuccess({
                            replyToken,
                            brandName: brandId.brandName,
                            packageName: ChangePackagesBrands.packageName,
                          });
                        }
                      } else {
                        // เช็คราคาว่าตรงกับราคา Packages
                        await createMessageLog(user, "image", "image");
                        paymentF({ replyToken, text: "🚫จำนวนเงินไม่ถูกต้อง" });
                      }
                    }
                  } else {
                    // else slip
                    console.log("else slip");
                    await createMessageLog(user, "image", "image");
                  }
                } else {
                  await createMessageLog(user, "image", "image");
                }
              } else {
                const qrcode = await qrReader(event);
                if (qrcode) {
                  const result = qrcode.includes("code:");
                  if (result) {
                    const myArray = qrcode.split("e:");
                    const resultRemoveUser = await removeUser(
                      haveStore.user.id
                    );
                    if (resultRemoveUser) {
                      const resultUpdate = await updateUser(user, myArray[1]);
                      if (resultUpdate) {
                        joinBrandSuccess({ replyToken });
                      }
                    }
                  }
                }
              }
            }
          } else {
            await createMessageLog(user, messageAction, actionType);
          }
          break;
      }
    } else if (actionType === "postback") {
      const postBackAction = req.body.events[0].postback.data;
      const result = postBackAction.includes("code:");
      const deleteMessage = postBackAction.includes("delete:");
      const todayMessage = postBackAction.includes("today:");
      if (todayMessage) {
        const myArray = postBackAction.split("today:");
        const todayResult = await getTodayByBrand(myArray[1]);
        sendTodayData({
          replyToken,
          brands: todayResult.branchs,
          brandName: myArray[2],
          brandId: myArray[1],
        });
      }
      if (postBackAction === "notDelete") {
        paymentF({ replyToken, text: "ข้อมูลการโอนของคุณยังอยู่ในระบบ" });
      }
      if (deleteMessage) {
        // ยืนยันการลบสลิป
        const myArray = postBackAction.split("e:");
        const deleteResult = await deleteTransaction(myArray[1]);
        if (deleteResult) {
          paymentF({
            replyToken,
            text: "เราได้ทำการลบข้อมูลสลิปออกจากระบบเรียบร้อยแล้ว",
          });
        }
      }
      if (result) {
        const myArray = postBackAction.split("e:");
        const package = await getPackages(myArray[1]);
        const haveStore = await checkUser(uidLine);
        const brand = await createBrand(haveStore.user.id);
        if (brand) {
          const pagekageBrands = await createBrandPackage(brand.id, package);
          if (pagekageBrands) {
            if (+myArray[1] === +1) {
              const updatePackagesBrandsResult =
                await updateStatusPackagesBrands(pagekageBrands.id, brand.id);
              if (updatePackagesBrandsResult) {
                paymentSuccess({
                  replyToken,
                  brandName: "",
                  packageName: "Basic",
                });
              }
            } else {
              alertPayment({
                replyToken,
                package,
                uidLine,
                relationId: pagekageBrands.id,
                type: 1,
              });
            }
          }
        }
      } else if (postBackAction === "brand:new") {
        listPackages({ replyToken });
      } else {
        const change = postBackAction.includes("brand:changeId:");
        const changePagekageBrands = postBackAction.includes("change:");
        if (change) {
          const myArray = postBackAction.split("changeId:");
          listPackagesChange({ replyToken, brandId: myArray[1] });
        }
        if (changePagekageBrands) {
          const myArray = postBackAction.split("change:");
          const package = await getPackages(myArray[1]); // myArray[3] = brandId, myArray[1] = package new id
          const updatePackagesChange = await updatePackagesBrandsChangeId(
            myArray[1],
            myArray[2]
          );
          if (updatePackagesChange) {
            alertPayment({
              replyToken,
              package,
              uidLine,
              relationId: myArray[3],
              type: 2,
            });
          }
        }
      }
    } else if (actionType === "follow") {
      const user = await getLineId(uidLine);
      const haveStore = await checkUser(uidLine);
      if (haveStore.user === false) {
        await createUser(user);
        listPackagesNew({ replyToken, user });
      } else {
        if (haveStore.brands.length !== 0) {
          console.log("haveStore");
        } else {
          listPackagesNew({ replyToken, user });
        }
      }
    } else if (actionType === "join") {
      paymentF({ replyToken, text: "อัปโหลด Qr Code เพื่อเชื่อมกับสาขา" });
    } else if (actionType === "leave") {
      unjoinBranch({ groupId: event.source.groupId });
    } else if (actionType === "unsend") {
      if (event.source.type === "group") {
        unsendGetContent({ replyToken: event.source.groupId, event });
      }
    } else {
      const error = new Error("ข้อมูลไม่ถูกต้อง");
      logger.warn(error.message);
      error.status = 200;
      next(error);
    }
  } catch (e) {
    e.status = 200;
    e.message = e.stack;
    next(e);
  }
};

module.exports = {
  replyMessage,
  getLineId,
  getPackages,
  listPackagesChange,
  getPackagesBrand,
  updateStatusPackagesBrands,
  updatePackagesBrandsRenew,
};
