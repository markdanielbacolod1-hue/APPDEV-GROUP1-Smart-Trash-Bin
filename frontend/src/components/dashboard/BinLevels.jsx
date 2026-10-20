"use client";
import React from 'react';
import { bins } from '../../data/trashCatalog';
export function BinLevels() {
    return (<ul className="space-y-4">
      {bins.map((bin) => {
            const full = bin.fillPercent >= 80;
            return (<li key={bin.id}>
            <div className="flex items-baseline justify-between text-sm">
              <span>{bin.label}</span>
              <span className={`tabular-nums ${full ? 'font-semibold text-warn' : 'text-muted'}`}>
                {bin.fillPercent}%{full && ' · empty soon'}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
              <div className={`h-full rounded-full ${full ? 'bg-warn' : 'bg-ink/70'}`} style={{ width: `${bin.fillPercent}%` }}/>
              
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted">Servo {bin.servoAngle}°</p>
          </li>);
        })}
    </ul>);
}
