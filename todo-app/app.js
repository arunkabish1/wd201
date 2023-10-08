const express = require("express");
const path = require("path");
const app = express();
const { Todo } = require("./models");
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");


app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secert string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/public")));
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  
  const allItems = await Todo.getTodos();
  const overDue = await Todo.overdue();
  const due_Later = await Todo.dueLater();
  const due_Today = await Todo.dueToday();
  const completed_items = await Todo.completed();
 
 
  if (req.accepts("html")) {
    res.render("index", {
      allItems,overDue,due_Later,due_Today,completed_items,
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      overDue,
      due_Later,
      due_Today,
      completed_items,
    });
  }
});

app.get("/todos/:id", async function (req, res) {
  try {
    const gettodos = await Todo.findByPk(req.params.id);
    return res.json(gettodos);
  } catch (err) {
    console.log(err);
    return res.status(422).json(err);
  }
});

app.get("/todos", async function (req, res) {
  console.log("Listing Items");
  try {
    const todolist = await Todo.findAll();
    return res.send(todolist);
  } catch (err) {
    console.log(err);
    return res.status(422).json(err);
  }
});

app.post("/todos", async function (req, res) {
  try {
    await Todo.addTodo({
      title: req.body.title,
      dueDate: req.body.dueDate,
    });
    return res.redirect("/");
  } catch (err) {
    return res.status(422).json({ error: err.message });
  }
});

app.put("/todos/:id", async function (request, res) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatingTodos = await todo.setCompletionStatus(request.body.completed);
    return res.json(updatingTodos);
  } catch (err) {
    console.log(err);
    return res.status(422).json(err);
  }
});

app.delete("/todos/:id", async (req, res) => {
  console.log("deleting with ID:", req.params.id);
  try {
    await Todo.remove(req.params.id);
    return res.json({ success: true });
  } 
  catch (err) {
    return res.status(422).json(err);
  }
});

module.exports = app;