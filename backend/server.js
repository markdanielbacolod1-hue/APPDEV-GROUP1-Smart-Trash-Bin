require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "SMART Trash Bin API is running" });
});

app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS database_name, 1 AS connected");
    res.json({ status: "ok", mysql: "connected", ...rows[0] });
  } catch (error) {
    console.error("MySQL health check failed:", error.message);
    res.status(500).json({ status: "error", mysql: "disconnected" });
  }
});

app.get("/api/dashboard/summary", async (_req, res) => {
  try {
    const [[accepted]] = await pool.query(
      "SELECT COUNT(*) AS total FROM waste_transactions WHERE transaction_status = 'accepted'"
    );
    const [[rejected]] = await pool.query(
      "SELECT COUNT(*) AS total FROM waste_transactions WHERE transaction_status = 'rejected'"
    );
    const [[rice]] = await pool.query(
      "SELECT COALESCE(SUM(rice_amount_grams), 0) AS total_grams FROM rice_transactions WHERE dispensing_status = 'dispensed'"
    );
    const [[detections]] = await pool.query(
      "SELECT COUNT(*) AS total FROM detections"
    );

    res.json({
      accepted_items: accepted.total,
      rejected_items: rejected.total,
      rice_dispensed_grams: rice.total_grams,
      total_detections: detections.total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load dashboard summary" });
  }
});

app.get("/api/categories", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT category_id, category_name, is_accepted, description FROM waste_categories ORDER BY category_name"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load waste categories" });
  }
});

app.get("/api/detections", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
    const [rows] = await pool.query(
      `SELECT d.detection_id, d.detected_label, d.confidence_score, d.image_path,
              d.detection_time, wc.category_name
       FROM detections d
       LEFT JOIN waste_categories wc ON wc.category_id = d.category_id
       ORDER BY d.detection_time DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load detections" });
  }
});

app.get("/api/transactions", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
    const [rows] = await pool.query(
      `SELECT wt.transaction_id, wt.transaction_status, wt.rejection_reason, wt.created_at,
              d.detected_label, d.confidence_score, wc.category_name,
              sl.target_compartment, sl.segregation_status,
              rt.rice_amount_grams, rt.dispensing_status
       FROM waste_transactions wt
       LEFT JOIN detections d ON d.detection_id = wt.detection_id
       LEFT JOIN waste_categories wc ON wc.category_id = wt.category_id
       LEFT JOIN segregation_logs sl ON sl.transaction_id = wt.transaction_id
       LEFT JOIN rice_transactions rt ON rt.transaction_id = wt.transaction_id
       ORDER BY wt.created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load transactions" });
  }
});

app.get("/api/reports/category-counts", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.detected_label, COUNT(*) AS detection_count
       FROM detections d
       GROUP BY d.detected_label
       ORDER BY detection_count DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load category report" });
  }
});

app.get("/api/reports/daily-collections", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DATE(created_at) AS collection_date, COUNT(*) AS accepted_items
       FROM waste_transactions
       WHERE transaction_status = 'accepted'
       GROUP BY DATE(created_at)
       ORDER BY collection_date DESC
       LIMIT 30`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load daily collection report" });
  }
});

app.get("/api/segregation-logs", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT segregation_id, transaction_id, target_compartment, servo_angle,
              segregation_status, segregation_time
       FROM segregation_logs
       ORDER BY segregation_time DESC LIMIT 100`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load segregation logs" });
  }
});

app.get("/api/rice-transactions", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT rice_transaction_id, transaction_id, rice_amount_grams,
              dispensing_status, dispensing_time
       FROM rice_transactions
       ORDER BY rice_transaction_id DESC LIMIT 100`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load rice transactions" });
  }
});

app.get("/api/system-logs", async (req, res) => {
  try {
    const level = req.query.level;
    let sql = "SELECT log_id, event_type, event_description, log_level, log_time FROM system_logs";
    const params = [];
    if (["INFO", "WARNING", "ERROR"].includes(level)) {
      sql += " WHERE log_level = ?";
      params.push(level);
    }
    sql += " ORDER BY log_time DESC LIMIT 100";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load system logs" });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`SMART Trash Bin API running at http://localhost:${PORT}`);
});
