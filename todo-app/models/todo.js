"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static associate(models) { }
    static addTodo({ title, dueDate }) {
      return this.create({ 
          title: title,
          dueDate: dueDate,
          completed: false });
    }
    static getTodos() {
      return this.findAll();
    }

    deletetodo() {
      return this.update({ completed: true });
    }
    
    static dueToday() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date().toLocaleDateString("en-CA"),
          },
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    markAsCompleted() {
      return this.update({ completed: true });
    }
    static overdue() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date().toLocaleDateString("en-CA"),
          },
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }    
    static completed() {
      return this.findAll({
        where: {
          completed: true,
        },
        order: [["id", "ASC"]],
      });
    }
    static async remove(id) {
      return this.destroy({
        where: { id },
      });
    }
    setCompletionStatus(boolean) {
      return this.update({ completed: boolean });
    }
    static dueLater() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date().toLocaleDateString("en-CA"),
          },
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
  }

  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    },
  );
  return Todo;
};