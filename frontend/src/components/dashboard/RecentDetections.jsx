"use client";
import React from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useDetectionLog } from '../../contexts/DetectionLogContext';
export function RecentDetections() {
    const { events } = useDetectionLog();
    if (events.length === 0) {
        return (<p className="py-6 text-sm text-muted">
        Nothing yet in this session. Items inserted at the kiosk appear here in real time.
      </p>);
    }
    return (<ul className="max-h-72 divide-y divide-line overflow-y-auto">
      {events.map((e) => <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div className="min-w-0">
            <p className="truncate">{e.item.label}</p>
            <p className="text-xs text-muted">
              {(e.confidence * 100).toFixed(1)}% · {e.distanceCm.toFixed(1)} cm ·{' '}
              {formatDistanceToNowStrict(e.at, { addSuffix: true })}
            </p>
          </div>
          <span className={`shrink-0 text-xs font-medium ${e.item.recyclable ? 'text-accent' : 'text-warn'}`}>
            {e.item.recyclable ? `+${e.item.riceGrams} g` : 'Residual'}
          </span>
        </li>)}
    </ul>);
}
