const { Sequelize, DataTypes, Model } = require("sequelize");
const { sequelize } = require("./todo-cli/connectDB.js");

class Todo extends Model {}

Todo.init(
    {
        title: {
            type: DataTypes.STRING,
            allowNull:false,
        },
        dueDate:{
            type: DataTypes.DATEONLY,
        },
        completed: {
            type: DataTypes.BOOLEAN,
        },
    },
        {
            sequelize
        }
    
);

module.exports = Todo;

Todo.sync();