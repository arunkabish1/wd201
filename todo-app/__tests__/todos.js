const request = require("supertest");
const db = require("../models/index");
const app = require("../app").default;
var cheerio = require("cheerio");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("l9 test suite", function () {

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Creating Todo", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "payrent",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks as completed", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "payrent",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    test("item with no empty date", async () => {
      const res = await agent.post("/todos").send({
        title: "emptydate",
        dueDate: "",
        completed: false,
      });
      expect(res.status).toBe(400);
    });
    const groupedTodosResponse = await agent.get("/").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    const status = latestTodo.completed ? false : true;
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: status,
      });
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Deletes a todo with ID", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const todos = await agent.get("/").set("Accept", "application/json");
    const parsedTodos = JSON.parse(todos.text);
    const todaysTodos = parsedTodos.dueToday.length;
    const todo = parsedTodos.dueToday[todaysTodos - 1];
    const todoID = todo.id;
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const response = await agent.delete(`/todos/${todoID}`).send({
      _csrf: csrfToken,
    });

    const boolean = Boolean(response.text);
    expect(boolean).toBe(true);
  });
});