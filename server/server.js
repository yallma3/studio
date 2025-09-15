// server.js
const express = require("express");
const app = express();
const port = 3001; // use a port not conflicting with Tauri

app.use(express.json());

// Example route
app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Example POST route
app.post("/echo", (req, res) => {
  res.json({ you_sent: req.body });
});

app.listen(port, () => {
  console.log(`Node server running at http://localhost:${port}`);
});
