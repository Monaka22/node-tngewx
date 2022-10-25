/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const Brand = sequelize.define(
    "brands",
    {
      brandName: { type: Sequelize.STRING },
      brandImage: { type: Sequelize.STRING },
      brandType: { type: Sequelize.STRING },
      brandComment: { type: Sequelize.STRING },
      businessType: { type: Sequelize.STRING },
      status: { type: Sequelize.INTEGER },
      brandStatus: { type: Sequelize.INTEGER },
      brandTel: { type: Sequelize.STRING },
      companyName: { type: Sequelize.STRING },
      companyAddress: { type: Sequelize.STRING },
      companyZipcode: { type: Sequelize.STRING },
      companyTaxId: { type: Sequelize.STRING },
      companyBranchId: { type: Sequelize.STRING },
      emailCompany: { type: Sequelize.STRING },
      editDate: {
        type: Sequelize.DATE,
      },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "brands",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  Brand.associate = (models) => {
    Brand.hasMany(models.user_brands, {
      foreignKey: "id",
    });
    Brand.hasMany(models.pagekage_brands, {
      foreignKey: "brandId",
    });
    Brand.hasMany(models.branchs, { foreignKey: "brandId" });
  };

  return Brand;
};
