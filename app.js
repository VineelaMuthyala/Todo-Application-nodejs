const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const path = require("path");
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

const checkRequestQueries = async (request, response, next) => {
  const { status, priority, category, search_q, date } = request.query;
  const { todoId } = request.params;

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const isCategoryValid = categoryArray.includes(category);
    if (isCategoryValid === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const isPriorityValid = priorityArray.includes(priority);
    if (isPriorityValid === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const isStatusValid = statusArray.includes(status);
    if (isStatusValid === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      console.log(myDate, "myDate");
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      console.log(formattedDate, "formattedDate");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      console.log(result, "result");
      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.date = formattedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;

  next();
};

const checkRequestBody = async (request, response, next) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const isCategoryValid = categoryArray.includes(category);
    if (isCategoryValid === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const isPriorityValid = priorityArray.includes(priority);
    if (isPriorityValid === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const isStatusValid = statusArray.includes(status);
    if (isStatusValid === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );

      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.dueDate = formattedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.id = id;
  request.todo = todo;
  request.todoId = todoId;
  next();
};

// API 1 get todo list
app.get("/todos/", checkRequestQueries, async (request, response) => {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
    date = "",
  } = request;
  const getTodoArrayQuery = `
    SELECT 
        id,
        todo,
        priority,
        status,
        category,
        due_date AS dueDate
    FROM todo
    WHERE status LIKE '%${status}%'
            AND priority LIKE '%${priority}%'
            AND category LIKE '%${category}%'
            AND todo LIKE '%${search_q}%'
            AND due_date LIKE '%${date}%';`;
  const todoArray = await db.all(getTodoArrayQuery);
  response.send(todoArray);
});

// API 2 get todo
app.get("/todos/:todoId/", checkRequestQueries, async (request, response) => {
  const { todoId } = request;
  const getTodoQuery = `
    SELECT
        id, 
        todo,
        priority,
        status,
        category,
        due_date AS dueDate
    FROM todo
    WHERE id = '${todoId}';`;
  const todoResult = await db.get(getTodoQuery);
  response.send(todoResult);
});

// API 3 Returns a list of all todos with a specific due date in the query parameter /agenda/?date=2021-12-12
app.get("/agenda/", checkRequestQueries, async (request, response) => {
  const { date } = request;
  const getTodoArrayQuery = `
    SELECT 
        id,
        todo,
        priority,
        status,
        category,
        due_date AS dueDate
    FROM todo
    WHERE due_date = '${date}';`;
  const todoArray = await db.all(getTodoArrayQuery);

  if (todoArray === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(todoArray);
  }
});

//API 4 Create a todo in the todo table
app.post("/todos/", checkRequestBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request;
  console.log(id);
  const addTodoQuery = `
  INSERT INTO 
    todo(id,todo ,priority, status ,category ,due_date)
    VALUES(
        '${id}','${todo}','${priority}','${status}','${category}','${dueDate}'
    );`;
  const newTodo = await db.run(addTodoQuery);
  console.log(newTodo);
  response.send("Todo Successfully Added");
});

// API 5 UPDATE TODO
app.put("/todos/:todoId/", checkRequestBody, async (request, response) => {
  const { todoId } = request;
  const { status, priority, todo, category, dueDate } = request;
  let updateTodoQuery = null;
  console.log(todoId);
  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
            UPDATE todo
            SET status = '${status}'
            WHERE id = '${todoId}';`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodoQuery = `
            UPDATE todo
            SET priority = '${priority}'
            WHERE id = '${todoId}';`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case category !== undefined:
      updateTodoQuery = `
            UPDATE todo
            SET category = '${category}'
            WHERE id = '${todoId}';`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
      break;
    case todo !== undefined:
      updateTodoQuery = `
            UPDATE todo
            SET todo = '${todo}'
            WHERE id = '${todoId}';`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case dueDate !== undefined:
      updateTodoQuery = `
            UPDATE todo
            SET due_date = '${dueDate}'
            WHERE id = '${todoId}';`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
      break;
  }
});

// API 6 DELETE TODO
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM 
        todo
    WHERE id ='${todoId}';`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
