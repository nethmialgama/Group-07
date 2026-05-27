const mysql = require("mysql2/promise");

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "hotel_db",
      port: 3306
    });

    console.log("DB CONNECTED SUCCESSFULLY");
    await conn.end();
  } catch (err) {
    console.log("DB ERROR:", err.message);
  }
}

test();