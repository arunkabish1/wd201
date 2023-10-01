const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csrf = require("tiny-csrf");
const { Todo } = require("./models");

app.use(express.static(path.join("public")));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");
app.get("/", async (req, res) => {
  try {
    const allTodos = await Todo.getTodos();
    const overdue = await Todo.overdue();
    const dueLater = await Todo.dueLater();
    const dueToday = await Todo.dueToday();
    const completedItems = await Todo.completedItems();

    if (req.accepts("html")) {
      res.render("index", {
        title: "Todo Application",
        allTodos,
        overdue,
        dueLater,
        dueToday,
        completedItems,
        csrfToken: req.csrfToken(),
      });
    } else {
      res.json({ overdue, dueLater, dueToday, completedItems });
    }
  } catch (error) {
    console.error(error);
    res.status(422).json(error);
  }
});

app.get("/todos", async (req, res) => {
  console.log("Todo liss");
  try {
    const todoslist = await Todo.findAll();
    res.json(todoslist);
  } catch (error) {
    console.error(error);
    res.status(422).json(error);
  }
});

app.get("/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id);
    res.json(todo);
  } catch (error) {
    console.error(error);
    res.status(422).json(error);
  }
});

app.post("/todos", async (req, res) => {
  console.log("Creating new todo", req.body);
  try {
    await Todo.addTodo({
      title: req.body.title,
      dueDate: req.body.dueDate,
      completed: false,
    });
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(422).json(error);
  }
});

app.put("/todos/:id", async (req, res) => {
  console.log("Mark as completed:", req.params.id);
  try {
    const todo = await Todo.findByPk(req.params.id);
    const updatedTodo = await todo.setCompletionStatus(req.body.completed);
    res.json(updatedTodo);
  } catch (error) {
    console.error(error);
    res.status(422).json(error);
  }
});

app.delete("/todos/:id", async (req, res) => {
  console.log("Delete with ID:", req.params.id);
  try {
    await Todo.remove(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(422).json(error);
  }
});

module.exports = app;
