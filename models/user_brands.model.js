/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const UserBrand = sequelize.define(
    "user_brands",
    {
      userId: { type: Sequelize.INTEGER },
      brandId: { type: Sequelize.INTEGER },
      status: { type: Sequelize.INTEGER },
      editBrand: { type: Sequelize.INTEGER },
      inviteUser: { type: Sequelize.INTEGER },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "user_brands",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  UserBrand.associate = (models) => {
    UserBrand.belongsTo(models.user_admins, { foreignKey: "userId" });
    UserBrand.hasMany(models.brands, {
      foreignKey: "id",
    });
  };

  return UserBrand;
};
