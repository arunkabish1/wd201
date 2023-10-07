const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo test suite Level 9", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("mandatory date function", async () => {
    const res = await agent.post("/todos").send({
      title: "Empty date",
      dueDate: "",
      completed: false,
    });
    expect(res.status).toBe(500);
  });

  test("Add sample overdue", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const res = await agent.post("/todos").send({
      title: "Pay EMI",
      dueDate: yesterday.toISOString().split("T")[0],
      completed: false,
    });
    expect(res.status).toBe(500);
  });

  test("sample due later todo", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const response = await agent.post("/todos").send({
      title: "pay rent",
      dueDate: tomorrow.toISOString().split("T")[0],
      completed: false,
    });
    expect(response.status).toBe(500);
  });

  test("duetody Item", async () => {
    const res = await agent.post("/todos").send({
      title: "Mother's birthday",
      dueDate: new Date().toISOString().split("T")[0],
      completed: false,
    });

    expect(res.status).toBe(500);
  });

  test("Delete Todo", async () => {
    const createTodo = await agent.post("/todos").send({
      title: "Todo Deletion",
      dueDate: new Date().toISOString().split("T")[0],
      completed: false,
    });

    const Id = Number(createTodo.header.location.split("/")[2]);
    expect(dltResponse.status).toBe(500);
    const dltResponse = await agent.delete(`/todos/${Id}`).send();

    
  });

  test("Sample overdue's", async () => {    
    const overdueRes = await agent.post("/todos").send({
      title: "Overdue Items",
      dueDate: "2021-01-01",
      completed: false,
    });

    const overdueTodoId = Number(overdueRes.header.location.split("/")[2]);

    const markCompletedResponse = await agent.put(`/todos/${overdueTodoId}`).send({
      _csrf: extractCsrfToken(overdueRes),
      completed: true,
    });

    expect(markCompletedResponse.status).toBe(200);
    expect(markCompletedResponse.body.completed).toBe(true);
  });

  test("Make the todo Completed when Clicked", async () => {
    const completedTodo = await agent.post("/todos").send({
      title: "Marking as completed",
      dueDate: new Date().toISOString().split("T")[0],
      completed: true,
    });

    const completedTodoId = Number(completedTodo.header.location.split("/")[2]);

    const toggleResponse = await agent.put(`/todos/${completedTodoId}`).send({
      _csrf: extractCsrfToken(completedTodo),
      completed: false,
    });

    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body.completed).toBe(false);
  });

});
