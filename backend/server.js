
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);
app.use(express.json());

// Home
app.get("/", (_req, res) => {
  res.json({ message: "SMART Trash Bin API is running" });
});

// MySQL health check
app.get("/api/health", async (_req, res) => {
  try {
    const [[row]] = await pool.query(
      "SELECT DATABASE() AS database_name"
    );

    res.json({
      status: "ok",
      mysql: "connected",
      database_name: row.database_name,
    });
  } catch (error) {
    console.error("MySQL connection error:", error);

    res.status(500).json({
      status: "error",
      mysql: "disconnected",
      code: error.code,
      message: error.message,
    });
  }
});

// Dashboard summary
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
      total_detections: detections.total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load dashboard summary" });
  }
});

// Waste categories
app.get("/api/categories", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT category_id, category_name, is_accepted, description
       FROM waste_categories
       ORDER BY category_name`
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load waste categories" });
  }
});

// Detection history
app.get("/api/detections", async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
      200
    );

    const [rows] = await pool.query(
      `SELECT d.detection_id, d.detected_label,
              d.confidence_score, d.image_path,
              d.detection_time, wc.category_name
       FROM detections d
       LEFT JOIN waste_categories wc
         ON wc.category_id = d.category_id
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

// Waste transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
      200
    );

    const [rows] = await pool.query(
      `SELECT wt.transaction_id, wt.transaction_status,
              wt.rejection_reason, wt.created_at,
              d.detected_label, d.confidence_score,
              wc.category_name, sl.target_compartment,
              sl.segregation_status, rt.rice_amount_grams,
              rt.dispensing_status
       FROM waste_transactions wt
       LEFT JOIN detections d
         ON d.detection_id = wt.detection_id
       LEFT JOIN waste_categories wc
         ON wc.category_id = wt.category_id
       LEFT JOIN segregation_logs sl
         ON sl.transaction_id = wt.transaction_id
       LEFT JOIN rice_transactions rt
         ON rt.transaction_id = wt.transaction_id
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

// Most frequently detected materials
app.get("/api/reports/category-counts", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT detected_label,
              COUNT(*) AS detection_count
       FROM detections
       GROUP BY detected_label
       ORDER BY detection_count DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load category report" });
  }
});

// Daily collection report
app.get("/api/reports/daily-collections", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DATE(created_at) AS collection_date,
              COUNT(*) AS accepted_items
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

// Automatic segregation logs
app.get("/api/segregation-logs", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT segregation_id, transaction_id,
              target_compartment, servo_angle,
              segregation_status, segregation_time
       FROM segregation_logs
       ORDER BY segregation_time DESC
       LIMIT 100`
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load segregation logs" });
  }
});

// Rice dispensing history
app.get("/api/rice-transactions", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT rice_transaction_id, transaction_id,
              rice_amount_grams, dispensing_status,
              dispensing_time
       FROM rice_transactions
       ORDER BY rice_transaction_id DESC
       LIMIT 100`
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load rice transactions" });
  }
});

// System logs
app.get("/api/system-logs", async (req, res) => {
  try {
    const level = req.query.level;

    let sql = `
      SELECT log_id, event_type, event_description,
             log_level, log_time
      FROM system_logs
    `;

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

// ==================================================
// SAVE KIOSK EVENT
// POST /api/kiosk/events
// ==================================================
app.post("/api/kiosk/events", async (req, res) => {
  const {
    detected_label,
    confidence_score,
    category_name,
    transaction_status,
    rice_amount_grams,
    target_compartment,
    servo_angle,
  } = req.body || {};

  if (
    typeof detected_label !== "string" ||
    !detected_label.trim()
  ) {
    return res.status(400).json({
      error: "detected_label is required",
    });
  }

  const status =
    transaction_status === "accepted" ? "accepted" : "rejected";

  const confidence = Number(confidence_score);
  const riceGrams = Number(rice_amount_grams ?? 0);

  if (!Number.isFinite(riceGrams) || riceGrams < 0) {
    return res.status(400).json({
      error: "rice_amount_grams must be a non-negative number",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Find the category, if provided
    const [categories] = await connection.execute(
      `SELECT category_id
       FROM waste_categories
       WHERE category_name = ?
       LIMIT 1`,
      [typeof category_name === "string" ? category_name : ""]
    );

    const categoryId = categories.length
      ? categories[0].category_id
      : null;

    // Save detection
    const [detection] = await connection.execute(
      `INSERT INTO detections
       (category_id, detected_label, confidence_score)
       VALUES (?, ?, ?)`,
      [
        categoryId,
        detected_label.trim(),
        Number.isFinite(confidence)
          ? Math.min(1, Math.max(0, confidence))
          : null,
      ]
    );

    // Save waste transaction
    const [transaction] = await connection.execute(
      `INSERT INTO waste_transactions
       (detection_id, category_id, transaction_status,
        rejection_reason)
       VALUES (?, ?, ?, ?)`,
      [
        detection.insertId,
        categoryId,
        status,
        status === "rejected"
          ? "Item is not accepted by the current prototype"
          : null,
      ]
    );

    // Save segregation result
    const angle = Number(servo_angle);
    const validAngle =
      servo_angle !== undefined &&
      servo_angle !== null &&
      servo_angle !== "" &&
      Number.isInteger(angle) &&
      angle >= 0 &&
      angle <= 180;

    await connection.execute(
      `INSERT INTO segregation_logs
       (transaction_id, target_compartment, servo_angle,
        segregation_status)
       VALUES (?, ?, ?, ?)`,
      [
        transaction.insertId,
        typeof target_compartment === "string" &&
        target_compartment.trim()
          ? target_compartment.trim()
          : "Unassigned",
        validAngle ? angle : null,
        status === "accepted" ? "success" : "failed",
      ]
    );

    // Create a pending rice record for accepted items.
    // This records the software transaction; it does not
    // physically activate the rice dispenser.
    if (status === "accepted") {
      await connection.execute(
        `INSERT INTO rice_transactions
         (transaction_id, rice_amount_grams, dispensing_status)
         VALUES (?, ?, 'pending')`,
        [transaction.insertId, riceGrams]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: "Kiosk event recorded",
      detection_id: detection.insertId,
      transaction_id: transaction.insertId,
      transaction_status: status,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Failed to save kiosk event:", error);

    return res.status(500).json({
      error: "Failed to save kiosk event",
    });
  } finally {
    connection.release();
  }
});

// Mark a pending rice transaction as dispensed.
// This updates the database only; it does not control hardware.
app.post(
  "/api/rice-transactions/:transactionId/dispense",
  async (req, res) => {
    const transactionId = Number.parseInt(
      req.params.transactionId,
      10
    );

    if (
      !Number.isSafeInteger(transactionId) ||
      transactionId <= 0
    ) {
      return res.status(400).json({
        error: "Invalid transaction ID",
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        `SELECT rice_transaction_id, dispensing_status
         FROM rice_transactions
         WHERE transaction_id = ?
         FOR UPDATE`,
        [transactionId]
      );

      if (!rows.length) {
        await connection.rollback();

        return res.status(404).json({
          error: "Rice transaction not found",
        });
      }

      if (rows[0].dispensing_status !== "pending") {
        await connection.rollback();

        return res.status(409).json({
          error: "Rice transaction is not pending",
        });
      }

      await connection.execute(
        `UPDATE rice_transactions
         SET dispensing_status = 'dispensed',
             dispensing_time = CURRENT_TIMESTAMP
         WHERE transaction_id = ?`,
        [transactionId]
      );

      await connection.commit();

      return res.json({
        message: "Rice dispensing recorded",
        transaction_id: transactionId,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Failed to update rice transaction:", error);

      return res.status(500).json({
        error: "Failed to update rice transaction",
      });
    } finally {
      connection.release();
    }
  }
);

// 404 handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// General error handler
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);

  res.status(500).json({
    error: "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `SMART Trash Bin API running at http://localhost:${PORT}`
  );
});
