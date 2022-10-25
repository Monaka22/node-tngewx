/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const PackagesBrands = sequelize.define(
    "pagekage_brands",
    {
      packageName: { type: Sequelize.STRING },
      packageAmount: { type: Sequelize.INTEGER },
      packagePer: { type: Sequelize.STRING },
      quota: { type: Sequelize.INTEGER },
      quotaPerM: { type: Sequelize.INTEGER },
      adminNumber: { type: Sequelize.INTEGER },
      branchNum: { type: Sequelize.INTEGER },
      overQuotaAmount: { type: Sequelize.FLOAT },
      report: { type: Sequelize.INTEGER },
      packageDetail: { type: Sequelize.INTEGER },
      status: { type: Sequelize.INTEGER },
      endDate: { type: Sequelize.DATE },
      brandId: { type: Sequelize.INTEGER },
      overAmount: { type: Sequelize.FLOAT },
      changeId: { type: Sequelize.INTEGER },
      packageId: { type: Sequelize.INTEGER },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "pagekage_brands",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  PackagesBrands.associate = (models) => {
    PackagesBrands.hasMany(models.brands, {
      foreignKey: "id",
    });
  };

  return PackagesBrands;
};
