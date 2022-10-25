/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const BankAccounts = sequelize.define(
    "bank_accounts",
    {
      bankAccountNo: { type: Sequelize.STRING },
      accountName: { type: Sequelize.STRING },
      bankName: { type: Sequelize.STRING },
      brandId: { type: Sequelize.INTEGER },
      bankType: { type: Sequelize.STRING },
      prompayType: { type: Sequelize.STRING },
      status: { type: Sequelize.INTEGER },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "bank_accounts",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  BankAccounts.associate = (models) => {
    BankAccounts.hasMany(models.bank_branchs, { foreignKey: "bankId" });
  };

  return BankAccounts;
};
