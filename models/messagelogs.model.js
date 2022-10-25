/* eslint-disable comma-dangle */
/* eslint-disable quotes */
module.exports = (sequelize, Sequelize) => {
  const Messagelogs = sequelize.define(
    "messagelogs",
    {
      uuidLine: { type: Sequelize.STRING },
      userNameLine: { type: Sequelize.STRING },
      message: { type: Sequelize.STRING },
      typeMessage: { type: Sequelize.STRING },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: "messagelogs",
      force: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  Messagelogs.associate = (models) => {
    // User.hasMany(models.event_logs, {
    //   foreignKey: "user_id",
    // });
    // User.belongsTo(models.user_roles, {
    //   foreignKey: "user_id",
    //   targetKey: "user_id",
    // });
  };

  return Messagelogs;
};
