/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const UserAdminName = sequelize.define(
    "user_admin_name",
    {
      userId: { type: Sequelize.STRING },
      userName: { type: Sequelize.STRING },
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
      tableName: "user_admin_name",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  UserAdminName.associate = (models) => {
    UserAdminName.belongsTo(models.user_admins, { foreignKey: "userId" });
    UserAdminName.belongsTo(models.branchs, { foreignKey: "branchId" });
  };

  return UserAdminName;
};
