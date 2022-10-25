/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const Packages = sequelize.define(
    "packages",
    {
      packageName: { type: Sequelize.STRING },
      packageAmount: { type: Sequelize.INTEGER },
      packagePer: { type: Sequelize.STRING },
      quotaPerM: { type: Sequelize.INTEGER },
      adminNumber: { type: Sequelize.INTEGER },
      branchNum: { type: Sequelize.INTEGER },
      overQuotaAmount: { type: Sequelize.FLOAT },
      report: { type: Sequelize.INTEGER },
      packageDetail: { type: Sequelize.INTEGER },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "packages",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  Packages.associate = (models) => {
    // User.hasMany(models.event_logs, {
    //   foreignKey: "user_id",
    // });
    // User.belongsTo(models.user_roles, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id",
    // });
  };

  return Packages;
};
