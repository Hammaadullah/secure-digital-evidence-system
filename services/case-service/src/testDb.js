const { pool } = require("./config/db.js");

const test = async () => {
  const res = await pool.query("SELECT NOW()");
  console.log(res.rows);
  process.exit();
};

test();