/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const BankAccounts = sequelize.define(
    "bank_branchs",
    {
      bankId: { type: Sequelize.INTEGER },
      branchId: { type: Sequelize.INTEGER },
      status: { type: Sequelize.INTEGER },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "bank_branchs",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  BankAccounts.associate = (models) => {
    BankAccounts.belongsTo(models.branchs, { foreignKey: "branchId" });
    BankAccounts.belongsTo(models.bank_accounts, { foreignKey: "bankId" });
  };

  return BankAccounts;
};
