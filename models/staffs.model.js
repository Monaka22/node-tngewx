/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const Staff = sequelize.define(
    "staffs",
    {
      lineName: { type: Sequelize.STRING },
      uuidLine: { type: Sequelize.STRING },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "staffs",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  Staff.associate = (models) => {
    // User.hasMany(models.event_logs, {
    //   foreignKey: "user_id",
    // });
    // User.belongsTo(models.user_roles, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id",
    // });
  };

  return Staff;
};
