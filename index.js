// configuring .env variables
require("dotenv").config({ path: __dirname + "/.env" });

const app = require("./app");
const database = require("./Database/database");

// need to set this for oracledb connection pool
process.env.UV_THREADPOOL_SIZE = 10;
console.log(process.env.UV_THREADPOOL_SIZE);

const port = process.env.PORT;
console.log(port);

app.listen(port, async () => {
  try {
    // create database connection pool, log startup message
    await database.startup();
    console.log(`listening on http://localhost:${port}`);
  } catch (err) {
    console.log("Error starting up database: " + err);
    process.exit(1);
  }
});

process.once("SIGTERM", database.shutdown).once("SIGINT", database.shutdown);
