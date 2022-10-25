/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const cronSentLog = sequelize.define(
    "cron_sent_log",
    {
      sentTo: { type: Sequelize.TEXT },
      detail: { type: Sequelize.INTEGER },
      remindId: { type: Sequelize.INTEGER },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "cron_sent_log",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  cronSentLog.associate = (models) => {
    // User.hasMany(models.event_logs, {
    //   foreignKey: "user_id",
    // });
    // User.belongsTo(models.user_roles, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id",
    // });
  };

  return cronSentLog;
};
