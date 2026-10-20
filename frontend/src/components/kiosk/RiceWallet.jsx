"use client";
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WheatIcon } from 'lucide-react';
const CUP_GRAMS = 180;
const EASE = [0.23, 1, 0.32, 1];
export function RiceWallet({ balance, items, dispense, dispenseMs, dispensedGrams, canDispense, onDispense }) {
    const cupProgress = Math.min(1, balance / CUP_GRAMS);
    return (<section aria-labelledby="wallet-heading" className="rounded-xl border border-line bg-surface p-6">
      <h2 id="wallet-heading" className="text-sm font-medium text-muted">
        Your rice balance
      </h2>

      <AnimatePresence mode="wait" initial={false}>
        {dispense === 'idle' &&
            <motion.div key="balance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-6xl font-semibold tabular-nums tracking-tight">{balance}</span>
              <span className="text-xl text-muted">g</span>
            </p>
            <div className="mt-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out" style={{ width: `${cupProgress * 100}%` }}/>
              
              </div>
              <p className="mt-2 text-xs text-muted">
                {balance >= CUP_GRAMS ? 'A full cup earned' : `${CUP_GRAMS - balance} g more for a full cup`}
              </p>
            </div>

            {items.length > 0 ?
                    <ul className="mt-5 max-h-44 divide-y divide-line overflow-y-auto border-t border-line">
                {items.map((e) => <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span>{e.item.label}</span>
                    <span className="font-medium tabular-nums text-accent">+{e.item.riceGrams} g</span>
                  </li>)}
              </ul> :
                    <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
                Items you insert will appear here.
              </p>}

            <button type="button" onClick={onDispense} disabled={!canDispense} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3.5 text-base font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-accent/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted">
            
              <WheatIcon className="h-5 w-5" aria-hidden/>
              {balance > 0 ? `Dispense ${balance} g of rice` : 'Dispense rice'}
            </button>
          </motion.div>}

        {dispense === 'dispensing' &&
            <motion.div key="dispensing" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="py-6">
          
            <p className="text-2xl font-semibold">Releasing {dispensedGrams} g…</p>
            <p className="mt-1 text-sm text-muted">Hold your container under the rice outlet.</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-canvas">
              <motion.div className="h-full rounded-full bg-accent" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: dispenseMs / 1000, ease: 'linear' }}/>
            
            </div>
          </motion.div>}

        {dispense === 'done' &&
            <motion.div key="done" role="status" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE }} className="py-6">
          
            <p className="text-2xl font-semibold">Enjoy your rice</p>
            <p className="mt-1 text-sm text-muted">
              {dispensedGrams} g dispensed. Thank you for recycling.
            </p>
          </motion.div>}
      </AnimatePresence>
    </section>);
}
