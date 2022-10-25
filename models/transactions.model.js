/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const Transaction = sequelize.define(
    "transactions",
    {
      bankId: { type: Sequelize.INTEGER },
      amount: { type: Sequelize.FLOAT },
      staffId: { type: Sequelize.INTEGER },
      slipId: { type: Sequelize.INTEGER },
      varifyResult: { type: Sequelize.INTEGER },
      branchId: { type: Sequelize.INTEGER },
      sentDate: { type: Sequelize.DATE },
      messageId: { type: Sequelize.STRING },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "transactions",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  Transaction.associate = (models) => {
    // User.hasMany(models.event_logs, {
    //   foreignKey: "user_id",
    // });
    // User.belongsTo(models.user_roles, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id",
    // });
  };

  return Transaction;
};
