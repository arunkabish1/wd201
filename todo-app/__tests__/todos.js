const req = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
let server, agent;

describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = req.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Create new todo", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const resCreate = await agent.post("/todos").send({
      title: "Go to movie",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(resCreate.statusCode).toBe(302);
  });

  test("Mark todo as completed", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupedTodosRes = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedRes = JSON.parse(groupedTodosRes.text);
    const dueTodayCount = parsedGroupedRes.dueToday.length;
    const latestTodo = parsedGroupedRes.dueToday[dueTodayCount - 1];
    const status = latestTodo.completed ? false : true;

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const resUpdate = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: status,
    });
    const parsedUpdateRes = JSON.parse(resUpdate.text);
    expect(parsedUpdateRes.completed).toBe(true);
  });

  test("Delete todo using ID", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Go to shopping",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosRes = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedRes = JSON.parse(groupedTodosRes.text);
    const dueTodayCount = parsedGroupedRes.dueToday.length;
    const latestTodo = parsedGroupedRes.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const resDelete = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    const parsedDeleteRes = JSON.parse(resDelete.text);
    expect(parsedDeleteRes.completed).toBe(true);
  });
});

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
