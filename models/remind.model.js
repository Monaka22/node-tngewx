/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const Remind = sequelize.define(
    "remind",
    {
      to: { type: Sequelize.TEXT },
      type: { type: Sequelize.INTEGER },
      status: { type: Sequelize.INTEGER },
      relationId: { type: Sequelize.INTEGER },
      sent: { type: Sequelize.INTEGER },
      exDate: {
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
      tableName: "remind",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  Remind.associate = (models) => {
    // User.hasMany(models.event_logs, {
    //   foreignKey: "user_id",
    // });
    // User.belongsTo(models.user_roles, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id",
    // });
  };

  return Remind;
};
