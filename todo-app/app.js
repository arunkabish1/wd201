const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (request, response) => {
  try {
    const [overdue, dueToday, dueLater, completedItems] = await Promise.all([
      Todo.overDue(),
      Todo.dueToday(),
      Todo.dueLater(), 
      Todo.completedItems(),
    ]);

    if (request.accepts("html")) {
      response.render("index", {
        title: "Todo application",overdue,dueToday,dueLater,completedItems,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        overdue,dueToday,dueLater,completedItems,
      });
    }
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/todos", async (request, response) => {
  console.log("Create a todo", request.body);
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
    response.redirect("/");
  } catch (error) {
    console.error(error);
    response.status(422).json(error);
  }
});

app.delete("/todos/:id", async (request, response) => {
  console.log("delete a Todo with ID: ", request.params.id);
  try {
    await Todo.remove(request.params.id);
    response.json({ success: true });
  } catch (error) {
    console.error(error);
    response.status(422).json(error);
  }
});

app.put("/todos/:id", async (request, response) => {
  console.log("update a Todo with ID: ", request.params.id);
  try {
    const todo = await Todo.findByPk(request.params.id);
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    response.json(updatedTodo);
  } catch (error) {
    console.error(error);
    response.status(422).json(error);
  }
});

module.exports = app;
