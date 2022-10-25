/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const PaymentFee = sequelize.define(
    "payment_fee",
    {
      transactionPayId: { type: Sequelize.INTEGER },
      bankAccountNoSent: { type: Sequelize.STRING },
      bankAccountNameSent: { type: Sequelize.STRING },
      bankAccountNoReciept: { type: Sequelize.STRING },
      bankAccountNameReciept: { type: Sequelize.STRING },
      amount: { type: Sequelize.FLOAT },
      sentDate: { type: Sequelize.DATE },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "payment_fee",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  PaymentFee.associate = (models) => {
    // User.hasMany(models.event_logs, {
    //   foreignKey: "user_id",
    // });
    // User.belongsTo(models.user_roles, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id",
    // });
  };

  return PaymentFee;
};