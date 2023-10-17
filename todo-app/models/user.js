'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Todo, {
        foreignKey: 'userId'
      });
    }
  }
  User.init({
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    lastname: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty:true,
        isEmail: true 
      },
    },
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
