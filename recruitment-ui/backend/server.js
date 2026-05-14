require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeDatabase } = require("./db/init");
const { seedUsers } = require("./db/seed");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Initialize database and seed users
initializeDatabase();
seedUsers().catch(console.error);

// Mount routes
app.use("/api/candidates", require("./routes/candidates"));
app.use("/api/workflows", require("./routes/workflows"));
app.use("/api/upload", require("./routes/uploads"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/apply", require("./routes/apply"));
app.use("/api/auth", require("./routes/auth").router);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Recruitment API running on http://localhost:${PORT}`);
});
