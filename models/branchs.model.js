/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const Branch = sequelize.define(
    "branchs",
    {
      branchName: { type: Sequelize.STRING },
      groupId: { type: Sequelize.INTEGER },
      businessType: { type: Sequelize.STRING },
      status: { type: Sequelize.INTEGER },
      brandId: { type: Sequelize.INTEGER },
      branchIcon: { type: Sequelize.STRING },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "branchs",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  Branch.associate = (models) => {
    Branch.belongsTo(models.brands, { foreignKey: "brandId" });
    Branch.hasMany(models.bank_branchs, { foreignKey: "branchId" });
    Branch.hasMany(models.user_admin_name, { foreignKey: "branchId" });
  };

  return Branch;
};
