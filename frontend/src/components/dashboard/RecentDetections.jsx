"use client";
import React, { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { apiGet } from "../../lib/api";

export function RecentDetections() {
  const [detections, setDetections] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const rows = await apiGet("/detections?limit=10");
        if (active) { setDetections(rows); setError(""); }
      } catch (err) {
        if (active) setError(err.message || "Could not load detections.");
      }
    }
    load();
    const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (error) return <p role="alert" className="py-6 text-sm text-warn">Could not load database records. Check the backend connection.</p>;
  if (detections.length === 0) return <p className="py-6 text-sm text-muted">No detection records in MySQL yet.</p>;

  return <ul className="max-h-72 divide-y divide-line overflow-y-auto">
    {detections.map((item) => {
      const date = new Date(item.detection_time);
      const confidence = item.confidence_score == null ? null : Number(item.confidence_score) * 100;
      return <li key={item.detection_id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
        <div className="min-w-0">
          <p className="truncate">{item.detected_label}</p>
          <p className="text-xs text-muted">
            {confidence == null ? "Confidence unavailable" : `${confidence.toFixed(1)}% confidence`} · {Number.isNaN(date.getTime()) ? "Time unavailable" : formatDistanceToNowStrict(date, { addSuffix: true })}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-muted">{item.category_name || "Uncategorized"}</span>
      </li>;
    })}
  </ul>;
}
