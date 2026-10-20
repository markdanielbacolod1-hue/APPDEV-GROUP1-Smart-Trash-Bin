"use client";
import React from 'react';
import { format } from 'date-fns';
import { useArduino } from '../../contexts/ArduinoContext';
const PROTOCOL = [
    { dir: 'Arduino → web', cmd: 'OBJ:<cm>', note: 'Ultrasonic sensor sees an object' },
    { dir: 'Web → Arduino', cmd: 'SORT:<deg>', note: 'Turn sorter servo to bin angle' },
    { dir: 'Web → Arduino', cmd: 'RICE:<g>', note: 'Open rice gate for N grams' }
];
export function DeviceConsole() {
    const { status, log, connect } = useArduino();
    return (<div className="space-y-5">
      {status === 'unsupported' &&
            <p className="rounded-md bg-warn-soft px-3 py-2 text-xs text-warn">
          This browser can’t talk to USB serial. Open in Chrome or Edge on desktop to connect the Arduino.
        </p>}
      {(status === 'disconnected' || status === 'error') &&
            <button type="button" onClick={connect} className="w-full rounded-md bg-ink px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-ink/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        
          {status === 'error' ? 'Retry connection' : 'Connect Arduino (9600 baud)'}
        </button>}

      <div>
        <h3 className="text-xs font-medium text-muted">Serial log</h3>
        <div className="mt-2 h-40 overflow-y-auto rounded-md bg-screen p-3 font-mono text-xs leading-relaxed text-white/85">
          {log.length === 0 ?
            <p className="text-white/45">No messages yet. Drop an item on the kiosk to see commands.</p> :
            log.map((entry) => <p key={entry.id}>
                <span className="text-white/40">{format(entry.at, 'HH:mm:ss')} </span>
                <span className={entry.dir === 'in' ? 'text-sky-300' : 'text-emerald-300'}>
                  {entry.dir === 'in' ? '←' : '→'}
                </span>{' '}
                {entry.text}
                {entry.simulated && <span className="text-white/40"> (not sent)</span>}
              </p>)}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-muted">Protocol</h3>
        <dl className="mt-2 divide-y divide-line text-xs">
          {PROTOCOL.map((p) => <div key={p.cmd} className="grid grid-cols-[88px_1fr] gap-2 py-2">
              <dt className="font-mono font-medium">{p.cmd}</dt>
              <dd className="text-muted">
                {p.note} <span className="whitespace-nowrap">({p.dir})</span>
              </dd>
            </div>)}
        </dl>
      </div>
    </div>);
}
