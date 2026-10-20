"use client";
import React from 'react';
import { CameraFeed } from '../components/kiosk/CameraFeed';
import { PipelineSteps } from '../components/kiosk/PipelineSteps';
import { RiceWallet } from '../components/kiosk/RiceWallet';
import { useArduino } from '../contexts/ArduinoContext';
import { trashCatalog } from '../data/trashCatalog';
import { useKioskSession } from '../hooks/useKioskSession';
export function Kiosk() {
    const session = useKioskSession();
    const { status } = useArduino();
    const busy = session.stage !== 'idle' || session.dispense === 'dispensing';
    return (<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Trade recyclables for rice</h1>
            <p className="mt-1 text-muted">Insert one item at a time. The machine identifies, sorts, and credits it.</p>
          </div>
          <CameraFeed stage={session.stage} event={session.current} distance={session.distance}/>
          <PipelineSteps stage={session.stage}/>
        </div>

        <aside className="space-y-6">
          <RiceWallet balance={session.balance} items={session.items} dispense={session.dispense} dispenseMs={session.dispenseMs} dispensedGrams={session.dispensedGrams} canDispense={session.balance > 0 && !busy} onDispense={session.dispenseRice}/>
          

          <section aria-labelledby="rates-heading">
            <h2 id="rates-heading" className="text-sm font-medium text-muted">
              Rice per item
            </h2>
            <dl className="mt-2 divide-y divide-line">
              {trashCatalog.map((item) => <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                  <dt>{item.category}</dt>
                  <dd className={`tabular-nums ${item.recyclable ? 'font-medium' : 'text-muted'}`}>
                    {item.recyclable ? `${item.riceGrams} g` : 'Logged only'}
                  </dd>
                </div>)}
            </dl>
          </section>

          <section className="rounded-lg border border-dashed border-line p-4">
            <p className="text-sm font-medium">
              {status === 'connected' ? 'Listening for OBJ:<cm> from Arduino' : 'Test without hardware'}
            </p>
            <p className="mt-1 text-xs text-muted">
              Simulates the ultrasonic sensor firing. Detection results are simulated in this prototype.
            </p>
            <button type="button" onClick={session.simulateDrop} disabled={busy} className="mt-3 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50">
              
              Simulate item drop
            </button>
          </section>
        </aside>
      </div>
    </main>);
}
