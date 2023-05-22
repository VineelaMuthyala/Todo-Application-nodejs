const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const snakeCaseToCamelCase = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
//API 1 Returns a list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;
  let getTodoQuery = "";
  let result = null;
  switch (true) {
    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
      SELECT * FROM todo
      WHERE status = '${status}';`;
        result = await db.all(getTodoQuery);
        response.send(result.map((eachItem) => snakeCaseToCamelCase(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
      SELECT * FROM todo
      WHERE priority = '${priority}';`;
        result = await db.all(getTodoQuery);
        response.send(result.map((eachItem) => snakeCaseToCamelCase(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasPriorityAndStatus(request.query):
      if (
        (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") &&
        (status === "TO DO" || status === "IN PROGRESS" || status === "DONE")
      ) {
        getTodoQuery = `
      SELECT * FROM todo
      WHERE priority = '${priority}'
      AND status = '${status}';`;
        result = await db.all(getTodoQuery);
        response.send(result.map((eachItem) => snakeCaseToCamelCase(eachItem)));
      } else if (
        status !== "TO DO" ||
        status !== "IN PROGRESS" ||
        status !== "DONE"
      ) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (
        priority !== "HIGH" ||
        priority !== "MEDIUM" ||
        priority !== "LOW"
      ) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        response.status(400);
        response.send("Invalid Todo Status And Priority");
      }
      break;

    case hasSearch(request.query):
      getTodoQuery = `
      SELECT * FROM todo
      WHERE todo LIKE '%${search_q}%';`;
      result = await db.all(getTodoQuery);
      response.send(result.map((eachItem) => snakeCaseToCamelCase(eachItem)));
      break;

    case hasCategoryAndStatus(request.query):
      if (
        (category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING") &&
        (status === "TO DO" || status === "IN PROGRESS" || status === "DONE")
      ) {
        getTodoQuery = `
      SELECT * FROM todo
      WHERE category = '${category}'
      AND status = '${status}';`;
        result = await db.all(getTodoQuery);
        response.send(result.map((eachItem) => snakeCaseToCamelCase(eachItem)));
      } else if (
        category !== "WORK" ||
        category !== "HOME" ||
        category !== "LEARNING"
      ) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (
        status !== "TO DO" ||
        status !== "IN PROGRESS" ||
        status !== "DONE"
      ) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        response.status(400);
        response.send("Invalid Todo Status And Category");
      }
      break;

    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
      SELECT * FROM todo
      WHERE category = '${category}';`;
        result = await db.all(getTodoQuery);
        response.send(result.map((eachItem) => snakeCaseToCamelCase(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriority(request.query):
      if (
        (category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING") &&
        (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW")
      ) {
        getTodoQuery = `
      SELECT * FROM todo
      WHERE category = '${category}'
      AND priority = '${priority}';`;
        result = await db.all(getTodoQuery);
        response.send(result.map((eachItem) => snakeCaseToCamelCase(eachItem)));
      } else if (
        category !== "WORK" ||
        category !== "HOME" ||
        category !== "LEARNING"
      ) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (
        priority !== "HIGH" ||
        priority !== "MEDIUM" ||
        priority !== "LOW"
      ) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority And Category");
      }
      break;
  }
});

// API Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoQuery = `
    SELECT * FROM todo
    WHERE id = '${todoId}';`;
  const specificTodo = await db.get(getSpecificTodoQuery);
  response.send(specificTodo);
});

// API 3 Returns a list of all todos with a specific due date in the query parameter `/agenda/?date=2021-12-12`
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const formattedDate = format(new Date(date), "yyyy-MM-dd");

  const getSpecificDateQuery = `
    SELECT * FROM todo
    WHERE due_date = '${formattedDate}';`;
  const specificDateTodo = await db.all(getSpecificDateQuery);
  response.send(
    specificDateTodo.map((eachItem) => snakeCaseToCamelCase(eachItem))
  );
});
