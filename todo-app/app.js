const express = require("express");
const path = require("path");
const app = express();
const { Todo, User } = require("./models");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const LocalStrategy = require("passport-local");
const bcrypt = require('bcrypt');
const flash = require("connect-flash");

const saltRounds = 10;

app.use(flash());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(express.static(path.join(__dirname, "/public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({
  secret: "my-super-secret-key-15261562217281726",
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (username, password, done) => {
  User.findOne({ where: { email: username } })
  .then(async function (user) {
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      return done(null, user);
    } else {
      return done(null, false, { message: "Invalid password" });
    }
  })

}));

app.use(function(req, res, next) {
  res.locals.messages = req.flash();
  next();
});

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.get("/", async (req, res) => {
  res.render("index", {
    title: "Todo application",
    csrfToken: req.csrfToken(),
  });
});

app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const allItems = await Todo.getTodos();
  const loggedInUser = req.user.id;
  const overDue = await Todo.overdue(loggedInUser);
  const due_Later = await Todo.dueLater(loggedInUser);
  const due_Today = await Todo.dueToday(loggedInUser);
  const completed_items = await Todo.completed(loggedInUser);
 
  if (req.accepts("html")) {
    res.render("todo", {
      title: "Todo application",
      allItems,
      overDue,
      due_Later,
      due_Today,
      completed_items,
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

app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async function (req, res) {
  console.log(req.user);
  try {
    const trimmedTitle = req.body.title.trim();
    if (trimmedTitle.length === 0) {
      req.flash("error", "Title cannot be empty");
      return res.redirect("/create-todo");
    }

    if (!req.body.dueDate) {
      req.flash("error", "Due date cannot be empty");
      return res.redirect("/create-todo");
    }

    await Todo.addTodo({
      title: trimmedTitle,
      dueDate: req.body.dueDate,
      userId: req.user.id
    });

    req.flash("success", "Todo added successfully");
    return res.redirect("/todos");
  } catch (err) {
    req.flash("error", "An error occurred");
    return res.redirect("/create-todo");
  }
});
app.post("/signup", async (req, res) => {
  try {
    const { firstname, email } = req.body;
    const user = await User.build({ firstname, lastname, email });
    await user.validate();
   req.flash("success", "User signed up successfully");
    return res.redirect("/todos");
  } catch (error) {
    if (error instanceof Sequelize.ValidationError) {
      return res.redirect("/signup");
    }
    console.error(error);
    req.flash("error", "An error occurred");
    res.redirect("/signup");
  }
});

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup", csrfToken: req.csrfToken() });
});

app.put("/todos/:id", async function (req, res) {
  const todo = await Todo.findByPk(req.params.id);
  try {
    const updatingTodos = await todo.setCompletionStatus(req.body.completed);
    return res.json(updatingTodos);
  } catch (err) {
    console.log(err);
    return res.status(422).json(err);
  }
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login", csrfToken: req.csrfToken() });
});
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    console.log(request.user);
    response.redirect("/todos");
  },
);

app.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/users", async (req, res) => {
  if (req.body.email.length == 0) {
    req.flash("error", "Email can not be empty!");
    return res.redirect("/signup");
  }

  if (req.body.firstname.length == 0) {
    req.flash("error", "Firstname must be filled :(");
    return res.redirect("/signup");
  }
  if (req.body.password.length <= 8) {
    req.flash("error", "password is not strong :( ");
    return res.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
  console.log(hashedPwd);

  try {
    const user = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: hashedPwd,
    });
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
     return res.redirect("/todos");
      
     
     
    });
  } catch (err) {
    console.log(err);
  }
});

app.delete("/todos/:id", async (req, res) => {
  console.log("deleting with ID:", req.params.id);
  try {
    await Todo.remove(req.params.id);
    req.flash("success", "Todo deleted successfully");
    return res.json({ success: true });
    
  } 
  catch (err) {
    return res.status(422).json(err);
  }
});



module.exports = app;