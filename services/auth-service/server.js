const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "auth-service",
    status: "ok",
    time: new Date()
  });
});

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
