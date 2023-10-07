const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");
const { Todo } = require("./models");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  const allTodos = await Todo.getTodos();
  const overdue = await Todo.overdue();
  const dueToday = await Todo.dueToday();
  const dueLater = await Todo.dueLater();
  const completedItems = await Todo.completedItems();

  if (req.accepts("html")) {
    res.render("index", {
      title: "Todo Application",allTodos,overdue,dueLater,dueToday,completedItems,
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({ overdue, dueLater, dueToday, completedItems });
  }
});

app.get("/todos/:id", async function (req, res) {
  try {
    const todo = await Todo.findByPk(req.params.id);
    return res.json(todo);
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

app.delete("/todos/:id", async (req, res) => {
    console.log("We have to delete a todo with ID: ", req.params.id);
    try {
      await Todo.remove(req.params.id);
      return res.json({ success: true });
    } catch (error) {
      return res.status(422).json(error);
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
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

app.get("/todos", async (_req, res) => {
    console.log("We have to fetch all the todos");
    try {
      const allTodos = await Todo.findAll();
      return res.send(allTodos);
    } catch (error) {
      console.log(error);
      return res.status(422).json(error);
    }
  });
  
app.put("/todos/:id", async (req, res) => {
  console.log("We have to update a todo with ID:", req.params.id);
  const todo = await Todo.findByPk(req.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(req.body.completed);
    return res.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

module.exports = app;
