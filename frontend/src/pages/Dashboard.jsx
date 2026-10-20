"use client";
import React, { useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { BinLevels } from '../components/dashboard/BinLevels';
import { DetectionChart } from '../components/dashboard/DetectionChart';
import { DeviceConsole } from '../components/dashboard/DeviceConsole';
import { RecentDetections } from '../components/dashboard/RecentDetections';
import { TopItemsList } from '../components/dashboard/TopItemsList';
import { useDetectionLog } from '../contexts/DetectionLogContext';
import { dailyDetections, topItems } from '../data/analytics';
import { downloadDetectionsCsv } from '../utils/csv';
export function Dashboard() {
    const [range, setRange] = useState(7);
    const { riceDispensedGrams } = useDetectionLog();
    const rows = dailyDetections.slice(-range);
    const totals = rows.reduce((acc, r) => ({
        plastic: acc.plastic + r.plastic,
        metal: acc.metal + r.metal,
        paper: acc.paper + r.paper,
        residual: acc.residual + r.residual
    }), { plastic: 0, metal: 0, paper: 0, residual: 0 });
    const totalItems = totals.plastic + totals.metal + totals.paper + totals.residual;
    const riceKg = (totals.plastic * 25 + totals.metal * 30 + totals.paper * 15 + riceDispensedGrams) / 1000;
    const recyclableShare = (totalItems - totals.residual) / totalItems * 100;
    const allTopCount = topItems.reduce((s, i) => s + i.count, 0);
    const leader = topItems[0];
    const leaderShare = leader.count / allTopCount * 100;
    const junkCount = topItems.filter((i) => i.category === 'Junk food packaging').reduce((s, i) => s + i.count, 0);
    return (<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Detection insights</h1>
          <p className="mt-1 text-muted">Unit RB-01 · Barangay hall entrance</p>
        </div>
        <div className="flex items-center gap-3">
          <div role="group" aria-label="Date range" className="flex rounded-md border border-line bg-surface p-0.5">
            {[7, 14].map((r) => <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)} className={`whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${range === r ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>
              
                Last {r} days
              </button>)}
          </div>
          <button type="button" onClick={() => downloadDetectionsCsv(rows, `ricebin-detections-${range}d.csv`)} className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            
            <DownloadIcon className="h-4 w-4" aria-hidden/>
            Export CSV
          </button>
        </div>
      </div>

      {/* Headline insight + supporting figures */}
      <section className="mt-8 grid gap-8 border-y border-line py-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-sm text-muted">Most detected item</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{leader.label}</p>
          <p className="mt-2 max-w-xl text-muted">
            {leaderShare.toFixed(0)}% of everything inserted. Junk food packaging accounts for{' '}
            {junkCount.toLocaleString()} items — a signal for snack and beverage brands about local consumption.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-6 self-end">
          <div>
            <dt className="text-xs text-muted">Items collected</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{totalItems.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Rice given</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{riceKg.toFixed(1)} kg</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Recyclable</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{recyclableShare.toFixed(0)}%</dd>
          </div>
        </dl>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section aria-labelledby="trend-heading" className="rounded-xl border border-line bg-surface p-6 lg:col-span-2">
          <h2 id="trend-heading" className="font-semibold">Detections per day by bin</h2>
          <p className="text-sm text-muted">Sorted automatically by the servo after camera detection.</p>
          <div className="mt-6">
            <DetectionChart data={rows}/>
          </div>
        </section>

        <section aria-labelledby="top-heading" className="rounded-xl border border-line bg-surface p-6">
          <h2 id="top-heading" className="font-semibold">Top detected items</h2>
          <p className="text-sm text-muted">All time · {allTopCount.toLocaleString()} items</p>
          <div className="mt-6">
            <TopItemsList items={topItems}/>
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section aria-labelledby="bins-heading">
          <h2 id="bins-heading" className="font-semibold">Bin fill levels</h2>
          <p className="text-sm text-muted">From ultrasonic sensors inside each compartment.</p>
          <div className="mt-5">
            <BinLevels />
          </div>
        </section>

        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="font-semibold">Live detections</h2>
          <p className="text-sm text-muted">This session, from the kiosk.</p>
          <div className="mt-3">
            <RecentDetections />
          </div>
        </section>

        <section aria-labelledby="device-heading">
          <h2 id="device-heading" className="font-semibold">Arduino</h2>
          <p className="text-sm text-muted">USB serial link to sensors and servos.</p>
          <div className="mt-5">
            <DeviceConsole />
          </div>
        </section>
      </div>
    </main>);
}
