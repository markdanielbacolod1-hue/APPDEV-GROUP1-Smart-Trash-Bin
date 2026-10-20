"use client";
import React from 'react';
import { bins } from '../../data/trashCatalog';
export function TopItemsList({ items }) {
    const max = Math.max(...items.map((i) => i.count));
    return (<ol className="space-y-4">
      {items.map((item, i) => {
            const color = bins.find((b) => b.id === item.bin)?.color ?? '#999';
            return (<li key={item.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="mr-2 tabular-nums text-muted">{i + 1}</span>
                {item.label}
              </span>
              <span className="shrink-0 font-medium tabular-nums">{item.count.toLocaleString()}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full" style={{ width: `${item.count / max * 100}%`, backgroundColor: color }}/>
            </div>
          </li>);
        })}
    </ol>);
}
