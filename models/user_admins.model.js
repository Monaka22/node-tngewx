/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const UserAdmin = sequelize.define(
    "user_admins",
    {
      lineName: { type: Sequelize.STRING },
      uuidLine: { type: Sequelize.STRING },
      status: { type: Sequelize.INTEGER },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "user_admins",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  UserAdmin.associate = (models) => {
    UserAdmin.hasMany(models.user_brands, { foreignKey: "userId" });
    UserAdmin.hasMany(models.user_admin_name, { foreignKey: "userId" });
  };

  return UserAdmin;
};
