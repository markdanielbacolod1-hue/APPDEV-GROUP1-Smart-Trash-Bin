"use client";
import React, { useEffect, useMemo, useState } from "react";
import { DownloadIcon, RefreshCw } from "lucide-react";
import { BinLevels } from "../components/dashboard/BinLevels";
import { DetectionChart } from "../components/dashboard/DetectionChart";
import { DeviceConsole } from "../components/dashboard/DeviceConsole";
import { RecentDetections } from "../components/dashboard/RecentDetections";
import { TopItemsList } from "../components/dashboard/TopItemsList";
import { apiGet } from "../lib/api";
import { downloadDetectionsCsv } from "../utils/csv";

function binFor(label = "") {
  const value = label.toLowerCase();
  if (value.includes("aluminum") || value.includes("aluminium") || value.includes("can") || value.includes("metal")) return "metal";
  if (value.includes("paper") || value.includes("cardboard") || value.includes("carton")) return "paper";
  if (value.includes("plastic") || value.includes("bottle") || value.includes("pet")) return "plastic";
  return "residual";
}
function displayLabel(label = "") {
  return label || "Unknown item";
}
function dayLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function Dashboard() {
  const [range, setRange] = useState(7);
  const [summary, setSummary] = useState(null);
  const [detections, setDetections] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [summaryData, detectionData, countData] = await Promise.all([
        apiGet("/dashboard/summary"),
        apiGet("/detections?limit=200"),
        apiGet("/reports/category-counts")
      ]);
      setSummary(summaryData);
      setDetections(detectionData);
      setCategoryCounts(countData);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to connect to the backend. Check that the Express server and MySQL are running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = window.setInterval(loadData, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const rows = useMemo(() => {
    const byDay = new Map();
    const sorted = [...detections].reverse();
    sorted.forEach((item) => {
      const date = new Date(item.detection_time);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      if (!byDay.has(key)) byDay.set(key, { day: dayLabel(key), plastic: 0, metal: 0, paper: 0, residual: 0, date: key });
      byDay.get(key)[binFor(item.detected_label)] += 1;
    });
    return [...byDay.values()].slice(-range);
  }, [detections, range]);

  const totals = rows.reduce((acc, row) => ({
    plastic: acc.plastic + row.plastic,
    metal: acc.metal + row.metal,
    paper: acc.paper + row.paper,
    residual: acc.residual + row.residual
  }), { plastic: 0, metal: 0, paper: 0, residual: 0 });
  const chartTotal = totals.plastic + totals.metal + totals.paper + totals.residual;
  const accepted = Number(summary?.accepted_items || 0);
  const rejected = Number(summary?.rejected_items || 0);
  const totalDetections = Number(summary?.total_detections || 0);
  const riceKg = Number(summary?.rice_dispensed_grams || 0) / 1000;
  const recyclableShare = totalDetections ? (accepted / totalDetections) * 100 : 0;
  const leader = categoryCounts[0];
  const junkCount = categoryCounts.filter((item) => /wrapper|junk|residual/i.test(item.detected_label || ""))
    .reduce((sum, item) => sum + Number(item.detection_count || 0), 0);
  const exportRows = rows.map((r) => ({ ...r, total: r.plastic + r.metal + r.paper + r.residual }));

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Detection insights</h1>
        <p className="mt-1 text-muted">Live figures from the MySQL database</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Date range" className="flex rounded-md border border-line bg-surface p-0.5">
          {[7, 14].map((r) => <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)} className={`whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${range === r ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>Last {r} days</button>)}
        </div>
        <button type="button" onClick={() => downloadDetectionsCsv(exportRows, `ricebin-detections-${range}d.csv`)} className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium hover:bg-canvas">
          <DownloadIcon className="h-4 w-4" aria-hidden/> Export CSV
        </button>
        <button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium hover:bg-canvas" aria-label="Refresh dashboard">
          <RefreshCw className="h-4 w-4" aria-hidden/> Refresh
        </button>
      </div>
    </div>

    {error && <div role="alert" className="mt-5 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-semibold">Backend connection problem</p>
      <p className="mt-1">{error}</p>
      <p className="mt-1">Check the Express server, the MySQL credentials in the backend .env file, and NEXT_PUBLIC_API_URL in the frontend .env.local file.</p>
    </div>}
    {loading && <p className="mt-5 text-sm text-muted">Loading database records…</p>}

    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Total detections", totalDetections.toLocaleString()],
        ["Accepted recyclables", accepted.toLocaleString()],
        ["Rejected items", rejected.toLocaleString()],
        ["Rice dispensed", `${riceKg.toFixed(2)} kg`]
      ].map(([label, value]) => <div key={label} className="rounded-xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      </div>)}
    </section>

    <section className="mt-8 grid gap-8 border-y border-line py-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="text-sm text-muted">Most detected item</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{leader ? displayLabel(leader.detected_label) : "No detections yet"}</p>
        <p className="mt-2 max-w-xl text-muted">
          {leader ? `${Number(leader.detection_count).toLocaleString()} recorded detection(s) for this item.` : "Detection records will appear here when the backend receives data."}
          {junkCount > 0 ? ` Non-recyclable wrappers and residual items account for ${junkCount.toLocaleString()} recorded detections.` : ""}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-6 self-end sm:grid-cols-3">
        <div><dt className="text-xs text-muted">Items in selected range</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{chartTotal.toLocaleString()}</dd></div>
        <div><dt className="text-xs text-muted">Rice dispensed</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{riceKg.toFixed(2)} kg</dd></div>
        <div><dt className="text-xs text-muted">Accepted / detections</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{recyclableShare.toFixed(0)}%</dd></div>
      </dl>
    </section>

    <div className="mt-8 grid gap-8 lg:grid-cols-3">
      <section aria-labelledby="trend-heading" className="rounded-xl border border-line bg-surface p-6 lg:col-span-2">
        <h2 id="trend-heading" className="font-semibold">Detections per day by category</h2>
        <p className="text-sm text-muted">Aggregated from stored detection records.</p>
        <div className="mt-6">{rows.length ? <DetectionChart data={rows}/> : <p className="py-16 text-center text-sm text-muted">No detection records found for this period.</p>}</div>
      </section>
      <section aria-labelledby="top-heading" className="rounded-xl border border-line bg-surface p-6">
        <h2 id="top-heading" className="font-semibold">Top detected items</h2>
        <p className="text-sm text-muted">Based on MySQL detection counts</p>
        <div className="mt-6"><TopItemsList items={categoryCounts.map((item) => ({ label: item.detected_label, count: Number(item.detection_count), bin: binFor(item.detected_label) }))}/></div>
      </section>
    </div>

    <div className="mt-8 grid gap-8 lg:grid-cols-3">
      <section aria-labelledby="bins-heading">
        <h2 id="bins-heading" className="font-semibold">Bin fill levels</h2>
        <p className="text-sm text-muted">Demo estimates until sensor readings are connected.</p>
        <div className="mt-5"><BinLevels /></div>
      </section>
      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="font-semibold">Recent detections</h2>
        <p className="text-sm text-muted">Latest records from MySQL.</p>
        <div className="mt-3"><RecentDetections /></div>
      </section>
      <section aria-labelledby="device-heading">
        <h2 id="device-heading" className="font-semibold">Arduino</h2>
        <p className="text-sm text-muted">USB serial link to sensors and servos.</p>
        <div className="mt-5"><DeviceConsole /></div>
      </section>
    </div>
  </main>;
}
