require("dotenv").config();
const cron = require("node-cron");
const request = require("request-promise");
const db = require("../models");
const moment = require("moment");
const { momentTZ } = require("./moment");
const Remind = db.remind;
const PackagesBrands = db.pagekage_brands;
const Brand = db.brands;
const Branchs = db.branchs;
const CronSentLog = db.cron_sent_log;

const { LINE_MESSAGING_API } = process.env;
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.LINE_TOKEN}`,
};

const checkQuota = async () => {
  const [results] = await db.sequelize.query(
    "SELECT `pagekage_brands`.`id`, `packageName`, `packageAmount`, `packagePer`, `quota`, `quotaPerM`, `adminNumber`, `branchNum`, `overQuotaAmount`, `report`, `packageDetail`, `pagekage_brands`.`endDate`, `pagekage_brands`.`brandId`, `user_brands`.`userId`, `overAmount`, `changeId`, `packageId`, `brands`. `brandName`, `user_admins`.`uuidLine` FROM `pagekage_brands` AS `pagekage_brands`  LEFT JOIN `brands` on `pagekage_brands`.`brandId` = `brands`.`id` LEFT JOIN `user_brands` on `pagekage_brands`.`brandId` = `user_brands`.`brandId` LEFT JOIN `user_admins` on `user_admins`.`id` = `user_brands`.`userId`"
  );
  for (let i = 0; i < results.length; i++) {
    if (
      momentTZ().format("DD/MM/YYYY") ===
      momentTZ(momentTZ(results[i].endDate)).format("DD/MM/YYYY") // same day
    ) {
      const count = await Remind.count({
        where: {
          relationId: +results[i].id,
          to: results[i].uuidLine,
          type: 4,
          status: 1,
        },
      });
      if (count === 0) {
        await Remind.create({
          to: results[i].uuidLine,
          type: 4, // same day
          status: 1,
          relationId: results[i].id,
          exDate: momentTZ(momentTZ().add(1, "hours")).format(
            "YYYY-MM-DD HH:mm:ss"
          ),
        });
      }
    }
    if (
      momentTZ().format("DD/MM/YYYY") ===
      momentTZ(momentTZ(results[i].endDate).subtract(5, "day")).format(
        "DD/MM/YYYY"
      ) // left 5
    ) {
      const count = await Remind.count({
        where: {
          relationId: +results[i].id,
          to: results[i].uuidLine,
          type: 5,
          status: 1,
        },
      });
      if (count === 0) {
        await Remind.create({
          to: results[i].uuidLine,
          type: 5, // left 5
          status: 1,
          relationId: results[i].id,
          exDate: momentTZ(momentTZ().add(1, "hours")).format(
            "YYYY-MM-DD HH:mm:ss"
          ),
        });
      }
    }
    if (
      momentTZ(momentTZ()).format("DD/MM/YYYY") ===
      momentTZ(momentTZ(results[i].endDate).add(5, "day")).format("DD/MM/YYYY") // add 5
    ) {
      const count = await Remind.count({
        where: {
          relationId: +results[i].id,
          to: results[i].uuidLine,
          type: 6,
          status: 1,
        },
      });
      if (count === 0) {
        await Remind.create({
          to: results[i].uuidLine,
          type: 6, // add 5
          status: 1,
          relationId: results[i].id,
          exDate: momentTZ(momentTZ().add(1, "hours")).format(
            "YYYY-MM-DD HH:mm:ss"
          ),
        });
      }
    }
    if (
      momentTZ(momentTZ()).format("DD/MM/YYYY") ===
      momentTZ(momentTZ(results[i].endDate).add(60, "day")).format("DD/MM/YYYY") // add 60
    ) {
      const count = await Remind.count({
        where: {
          relationId: +results[i].id,
          to: results[i].uuidLine,
          type: 7,
          status: 1,
        },
      });
      if (count === 0) {
        await Remind.create({
          to: results[i].uuidLine,
          type: 7, // add 60
          status: 1,
          relationId: results[i].id,
          exDate: momentTZ(momentTZ().add(1, "hours")).format(
            "YYYY-MM-DD HH:mm:ss"
          ),
        });
      }
    }
    if (results[i].quota === 0) {
      const count = await Remind.count({
        where: {
          relationId: +results[i].id,
          to: results[i].uuidLine,
          type: 0,
          status: 1,
        },
      });
      if (count === 0) {
        await Remind.create({
          to: results[i].uuidLine,
          type: 0, // quota 0
          status: 1,
          relationId: results[i].id,
          exDate: momentTZ(momentTZ().add(1, "hours")).format(
            "YYYY-MM-DD HH:mm:ss"
          ),
        });
      }
    }
    const fivePercent = (results[i].quotaPerM / 100) * 5;
    if (results[i].quota <= fivePercent) {
      const count = await Remind.count({
        where: {
          relationId: +results[i].id,
          to: results[i].uuidLine,
          type: 8,
          status: 1,
        },
      });
      if (count === 0) {
        await Remind.create({
          to: results[i].uuidLine,
          type: 8, // quota 0
          status: 1,
          relationId: results[i].id,
          exDate: momentTZ(momentTZ().add(1, "hours")).format(
            "YYYY-MM-DD HH:mm:ss"
          ),
        });
      }
    }
  }
};

const remind = async () => {
  Remind.findAll()
    .then(async (result) => {
      for (let i = 0; i < result.length; i++) {
        if (result[i].sent !== 1) {
          if (result[i].type === 1) {
            // 1 create-package
            if (momentTZ().unix() > momentTZ(result[i].exDate).unix()) {
              const package = await PackagesBrands.findOne({
                where: {
                  id: result[i].relationId,
                },
              });
              if (package) {
                await PackagesBrands.destroy({
                  where: {
                    id: result[i].relationId,
                  },
                });
                await PackagesBrands.destroy({
                  where: {
                    id: result[i].relationId,
                  },
                });
                await Brand.destroy({
                  where: {
                    id: package.brandId,
                  },
                });
                await Remind.update(
                  {
                    sent: 1,
                  },
                  {
                    where: {
                      id: result[i].id,
                    },
                  }
                );
              }
              await CronSentLog.create({
                sentTo: result[i].to,
                detail: `ไม่ได้ลงสลิปตามเวลาการสร้างร้านค้าใหม่`,
                remindId: result[i].id,
              });
              request({
                method: "POST",
                uri: `${LINE_MESSAGING_API}/push`,
                headers: LINE_HEADER,
                body: JSON.stringify({
                  to: result[i].to,
                  messages: [
                    {
                      type: `text`,
                      text: "หมดระยะเวลาในการทำรายการ หากต้องการทำรายการ กรุณากดเลือก Package ใหม่อีกครั้ง",
                    },
                  ],
                }),
              });
            }
          } else if (result[i].type === 2) {
            // 2 change-package
            if (momentTZ().unix() > momentTZ(result[i].exDate).unix()) {
              await PackagesBrands.update(
                {
                  changeId: 0,
                },
                {
                  where: {
                    id: result[i].relationId,
                  },
                }
              );
              await CronSentLog.create({
                sentTo: result[i].to,
                detail: `ไม่ได้ลงสลิปตามเวลาการเปลี่ยน Package ร้านค้าใหม่`,
                remindId: result[i].id,
              });
              await Remind.update(
                {
                  sent: 1,
                },
                {
                  where: {
                    id: result[i].id,
                  },
                }
              );
              request({
                method: "POST",
                uri: `${LINE_MESSAGING_API}/push`,
                headers: LINE_HEADER,
                body: JSON.stringify({
                  to: result[i].to,
                  messages: [
                    {
                      type: `text`,
                      text: "หมดระยะเวลาในการทำรายการ หากต้องการทำรายการ กรุณากดเลือก Package ใหม่อีกครั้ง",
                    },
                  ],
                }),
              });
            }
          } else if (result[i].type === 3) {
            // 3 renew-package
            if (momentTZ().unix() > momentTZ(result[i].exDate).unix()) {
              await CronSentLog.create({
                sentTo: result[i].to,
                detail: `ไม่ได้ลงสลิปตามเวลาการต่อ Package ร้านค้าใหม่`,
                remindId: result[i].id,
              });
              await Remind.update(
                {
                  sent: 1,
                },
                {
                  where: {
                    id: result[i].id,
                  },
                }
              );
              request({
                method: "POST",
                uri: `${LINE_MESSAGING_API}/push`,
                headers: LINE_HEADER,
                body: JSON.stringify({
                  to: result[i].to,
                  messages: [
                    {
                      type: `text`,
                      text: "หมดระยะเวลาในการทำรายการ หากต้องการทำรายการ กรุณากดเลือก Package ใหม่อีกครั้ง",
                    },
                  ],
                }),
              });
            }
          } else if (result[i].type === 4) {
            // 4 expire-same-day
            const package = await PackagesBrands.findOne({
              where: {
                id: result[i].relationId,
              },
            });
            const brand = await Brand.findOne({
              where: {
                id: package.brandId,
              },
            });
            const branchs = await Branchs.count({
              where: {
                brandId: package.brandId,
              },
            });
            await CronSentLog.create({
              sentTo: result[i].to,
              detail: `expire-day`,
              remindId: result[i].id,
            });
            await Remind.update(
              {
                sent: 1,
              },
              {
                where: {
                  id: result[i].id,
                },
              }
            );
            request({
              method: "POST",
              uri: `${LINE_MESSAGING_API}/push`,
              headers: LINE_HEADER,
              body: JSON.stringify({
                to: result[i].to,
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
                            text: "🕒 วันนี้!! ครบกำหนดชำระค่าบริการ 🧾",
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ร้าน ${brand.brandName}  จำนวน ${branchs} สาขา`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `Package ${package.packageName}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ชำระแบบราย${
                              package.packagePer === "y" ? "ปี" : "เดือน"
                            } ${package.packageAmount} บาท/${
                              package.packagePer === "y" ? "ปี" : "เดือน"
                            }`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `รวมจำนวนเงิน ${
                              package.packageAmount + (package.overAmount || 0)
                            } บาท`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `รอบการจ่ายบิลของคุณ วันที่ ${momentTZ(
                              package.endDate
                            ).format("DD/MM/YYYY")}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: "จัดการ Package?",
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
                              label: "ดูรายละเอียด",
                              uri: process.env.LIFF_URL,
                            },
                            style: "primary",
                          },
                        ],
                      },
                    },
                  },
                ],
              }),
            });
          } else if (result[i].type === 5) {
            // 5 expire-left-5
            const package = await PackagesBrands.findOne({
              where: {
                id: result[i].relationId,
              },
            });
            const brand = await Brand.findOne({
              where: {
                id: package.brandId,
              },
            });
            const branchs = await Branchs.count({
              where: {
                brandId: package.brandId,
              },
            });
            await CronSentLog.create({
              sentTo: result[i].to,
              detail: `expire-ในอีกห้าวัน`,
              remindId: result[i].id,
            });
            await Remind.update(
              {
                sent: 1,
              },
              {
                where: {
                  id: result[i].id,
                },
              }
            );
            request({
              method: "POST",
              uri: `${LINE_MESSAGING_API}/push`,
              headers: LINE_HEADER,
              body: JSON.stringify({
                to: result[i].to,
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
                            text: "🗓อีก 5 วันจะครบกำหนดชำระค่าบริการ 🧾",
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ร้าน ${brand.brandName}  จำนวน ${branchs} สาขา`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `Package ${package.packageName}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ชำระแบบราย${
                              package.packagePer === "y" ? "ปี" : "เดือน"
                            } ${package.packageAmount} บาท/${
                              package.packagePer === "y" ? "ปี" : "เดือน"
                            }`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `รวมจำนวนเงิน ${
                              package.packageAmount + (package.overAmount || 0)
                            } บาท`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `รอบการจ่ายบิลของคุณ วันที่ ${momentTZ(
                              package.endDate
                            ).format("DD/MM/YYYY")}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: "จัดการ Package?",
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
                              label: "ดูรายละเอียด",
                              uri: process.env.LIFF_URL,
                            },
                            style: "primary",
                          },
                        ],
                      },
                    },
                  },
                ],
              }),
            });
          } else if (result[i].type === 6) {
            // 6 expire-add-5
            const package = await PackagesBrands.findOne({
              where: {
                id: result[i].relationId,
              },
            });
            const brand = await Brand.findOne({
              where: {
                id: package.brandId,
              },
            });
            const branchs = await Branchs.count({
              where: {
                brandId: package.brandId,
              },
            });
            await CronSentLog.create({
              sentTo: result[i].to,
              detail: `expire-☢️ เลยกำหนดชำระค่าบริการมา 5 วันแล้ว 🧾`,
              remindId: result[i].id,
            });
            await Remind.update(
              {
                sent: 1,
              },
              {
                where: {
                  id: result[i].id,
                },
              }
            );
            request({
              method: "POST",
              uri: `${LINE_MESSAGING_API}/push`,
              headers: LINE_HEADER,
              body: JSON.stringify({
                to: result[i].to,
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
                            text: "☢️ เลยกำหนดชำระค่าบริการมา 5 วันแล้ว 🧾",
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ร้าน ${brand.brandName}  จำนวน ${branchs} สาขา`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `Package ${package.packageName}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ชำระแบบราย${
                              package.packagePer === "y" ? "ปี" : "เดือน"
                            } ${package.packageAmount} บาท/${
                              package.packagePer === "y" ? "ปี" : "เดือน"
                            }`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `รวมจำนวนเงิน ${
                              package.packageAmount + (package.overAmount || 0)
                            } บาท`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `รอบการจ่ายบิลของคุณ วันที่ ${momentTZ(
                              package.endDate
                            ).format("DD/MM/YYYY")}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: "จัดการ Package?",
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
                              label: "ดูรายละเอียด",
                              uri: process.env.LIFF_URL,
                            },
                            style: "primary",
                          },
                        ],
                      },
                    },
                  },
                ],
              }),
            });
          } else if (result[i].type === 7) {
            // 7 expire-add-60
            const package = await PackagesBrands.findOne({
              where: {
                id: result[i].relationId,
              },
            });
            const brand = await Brand.findOne({
              where: {
                id: package.brandId,
              },
            });
            const branchs = await Branchs.count({
              where: {
                brandId: package.brandId,
              },
            });
            await CronSentLog.create({
              sentTo: result[i].to,
              detail: `expire-☢️ เลยกำหนดชำระค่าบริการมา 60 วันแล้ว 🧾`,
              remindId: result[i].id,
            });
            await Remind.update(
              {
                sent: 1,
              },
              {
                where: {
                  id: result[i].id,
                },
              }
            );
            request({
              method: "POST",
              uri: `${LINE_MESSAGING_API}/push`,
              headers: LINE_HEADER,
              body: JSON.stringify({
                to: result[i].to,
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
                            text: "☢️ เลยกำหนดชำระค่าบริการมา 60 วันแล้ว 🧾",
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ร้าน ${brand.brandName}  จำนวน ${branchs} สาขา`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `Package ${package.packageName}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ชำระแบบราย${
                              package.packagePer === "y" ? "ปี" : "เดือน"
                            } ${package.packageAmount} บาท/${
                              package.packagePer === "y" ? "ปี" : "เดือน"
                            }`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `รวมจำนวนเงิน ${
                              package.packageAmount + (package.overAmount || 0)
                            } บาท`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `รอบการจ่ายบิลของคุณ วันที่ ${momentTZ(
                              package.endDate
                            ).format("DD/MM/YYYY")}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: "จัดการ Package?",
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
                              label: "ดูรายละเอียด",
                              uri: process.env.LIFF_URL,
                            },
                            style: "primary",
                          },
                        ],
                      },
                    },
                  },
                ],
              }),
            });
          } else if (result[i].type === 8) {
            // 8 quota-fivePercent
            const package = await PackagesBrands.findOne({
              where: {
                id: result[i].relationId,
              },
            });
            const brand = await Brand.findOne({
              where: {
                id: package.brandId,
              },
            });
            await CronSentLog.create({
              sentTo: result[i].to,
              detail: `expire-📳 โควตาระบบเช็กสลิปใกล้หมดแล้ว 📳`,
              remindId: result[i].id,
            });
            await Remind.update(
              {
                sent: 1,
              },
              {
                where: {
                  id: result[i].id,
                },
              }
            );
            request({
              method: "POST",
              uri: `${LINE_MESSAGING_API}/push`,
              headers: LINE_HEADER,
              body: JSON.stringify({
                to: result[i].to,
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
                            type: "text",
                            text: "5%",
                            color: "#ffffff",
                            align: "start",
                            size: "xs",
                            gravity: "center",
                            margin: "lg",
                          },
                          {
                            type: "box",
                            layout: "vertical",
                            contents: [
                              {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                  {
                                    type: "filler",
                                  },
                                ],
                                width: "5%",
                                backgroundColor: "#7D51E4",
                                height: "6px",
                              },
                            ],
                            backgroundColor: "#9FD8E36E",
                            height: "6px",
                            margin: "sm",
                          },
                        ],
                        backgroundColor: "#A17DF5",
                        paddingTop: "19px",
                        paddingAll: "12px",
                        paddingBottom: "16px",
                      },
                      body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          {
                            type: "text",
                            weight: "bold",
                            size: "sm",
                            wrap: true,
                            text: "📳 โควตาระบบเช็กสลิปใกล้หมดแล้ว 📳",
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ร้าน ${brand.brandName}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `Package ${package.packageName}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ขณะนี้คุณเหลือสิทธิ์ ${package.quota} ครั้ง `,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `จากทั้งหมด ${package.quotaPerM} ครั้ง`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `รอบบิลหน้า ณ วันที่ ${momentTZ(
                              package.endDate
                            ).format("DD/MM/YYYY")}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `หากใช้สิทธิ์การโอนเกินจำนวนจะมีค่าบริการครั้งละ ${package.overQuotaAmount} บาท`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: "หากคุณต้องการปรับเปลี่ยน Package",
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: "สามารทำได้โดยการกด",
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
                              label: "ดูรายละเอียด",
                              uri: process.env.LIFF_URL,
                            },
                            style: "primary",
                          },
                        ],
                      },
                    },
                  },
                ],
              }),
            });
          } else if (result[i].type === 0) {
            // 0 quota-0
            const package = await PackagesBrands.findOne({
              where: {
                id: result[i].relationId,
              },
            });
            const brand = await Brand.findOne({
              where: {
                id: package.brandId,
              },
            });
            const Branchs = await Branchs.count({
              where: {
                brandId: package.brandId,
              },
            });
            await CronSentLog.create({
              sentTo: result[i].to,
              detail: `expire-day`,
              remindId: result[i].id,
            });
            await Remind.update(
              {
                sent: 1,
              },
              {
                where: {
                  id: result[i].id,
                },
              }
            );
            request({
              method: "POST",
              uri: `${LINE_MESSAGING_API}/push`,
              headers: LINE_HEADER,
              body: JSON.stringify({
                to: result[i].to,
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
                            type: "text",
                            text: "0%",
                            color: "#ffffff",
                            align: "start",
                            size: "xs",
                            gravity: "center",
                            margin: "lg",
                          },
                          {
                            type: "box",
                            layout: "vertical",
                            contents: [
                              {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                  {
                                    type: "filler",
                                  },
                                ],
                                width: "0%",
                                backgroundColor: "#7D51E4",
                                height: "6px",
                              },
                            ],
                            backgroundColor: "#9FD8E36E",
                            height: "6px",
                            margin: "sm",
                          },
                        ],
                        backgroundColor: "#A17DF5",
                        paddingTop: "19px",
                        paddingAll: "12px",
                        paddingBottom: "16px",
                      },
                      body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          {
                            type: "text",
                            weight: "bold",
                            size: "sm",
                            wrap: true,
                            text: "📳 โควตาระบบเช็กสลิปหมดแล้ว 📳",
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ร้าน ${brand.brandName}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `Package ${package.packageName}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `ขณะนี้คุณเหลือสิทธิ์ ${package.quota} ครั้ง `,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `จากทั้งหมด ${package.quotaPerM} ครั้ง`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `รอบบิลหน้า ณ วันที่ ${momentTZ(
                              package.endDate
                            ).format("DD/MM/YYYY")}`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: `หากใช้สิทธิ์การโอนเกินจำนวนจะมีค่าบริการครั้งละ ${package.overQuotaAmount} บาท`,
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: "หากคุณต้องการปรับเปลี่ยน Package",
                          },
                          {
                            type: "text",
                            size: "xs",
                            wrap: true,
                            text: "สามารทำได้โดยการกด",
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
                              label: "ดูรายละเอียด",
                              uri: process.env.LIFF_URL,
                            },
                            style: "primary",
                          },
                        ],
                      },
                    },
                  },
                ],
              }),
            });
          }
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

cron.schedule(process.env.JOB_SCHEDULE, async () => {
  await checkQuota();
  await remind();
  console.log("run cronjob");
});
cron.schedule("0 0 0 * * *", async () => {
  Remind.truncate({ cascade: true, restartIdentity: true });
});
