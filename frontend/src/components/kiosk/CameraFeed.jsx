"use client";
import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ScanLineIcon } from 'lucide-react';
import { bins } from '../../data/trashCatalog';
const EASE = [0.23, 1, 0.32, 1];
export function CameraFeed({ stage, event, distance }) {
    const reduceMotion = useReducedMotion();
    const showFrame = event && stage !== 'idle' && stage !== 'sensing';
    const revealed = stage === 'sorting' || stage === 'credited' || stage === 'rejected';
    const item = event?.item;
    const bin = item ? bins.find((b) => b.id === item.bin) : undefined;
    return (<section aria-label="Camera detection feed" className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-screen text-white">
      
      {showFrame && item &&
            <img src={item.image} alt="Camera frame of the inserted item" className="absolute inset-0 h-full w-full object-cover"/>}

      {/* HUD */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 font-mono text-xs">
        <span className="flex items-center gap-2 rounded bg-black/50 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden/>
          CAM-01 · 1080p · local model v1
        </span>
        <span className="rounded bg-black/50 px-2 py-1">
          Ultrasonic {distance !== null ? `${distance.toFixed(1)} cm` : '— cm'}
        </span>
      </div>

      {stage === 'idle' &&
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div>
            <ScanLineIcon className="mx-auto h-10 w-10 text-white/40" aria-hidden/>
            <p className="mt-4 text-2xl font-semibold">Drop an item into the slot</p>
            <p className="mt-2 text-sm text-white/60">Bottles, cans, and cartons earn rice.</p>
          </div>
        </div>}

      {stage === 'sensing' &&
            <div className="absolute inset-0 grid place-items-center text-center" role="status">
          <div>
            <p className="font-mono text-sm text-white/70">Object detected at {distance?.toFixed(1)} cm</p>
            <p className="mt-2 text-xl font-semibold">Starting camera…</p>
          </div>
        </div>}

      {showFrame && item &&
            <>
          {stage === 'detecting' && !reduceMotion &&
                    <motion.div aria-hidden className="absolute inset-x-0 h-px bg-emerald-300" initial={{ top: '8%' }} animate={{ top: '92%' }} transition={{ duration: 1.1, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}/>}

          <div className={`absolute rounded-sm border-2 transition-colors duration-200 ${revealed ?
                    item.recyclable ?
                        'border-emerald-400' :
                        'border-amber-400' :
                    'border-dashed border-white/70'}`} style={{ left: `${item.box.x}%`, top: `${item.box.y}%`, width: `${item.box.w}%`, height: `${item.box.h}%` }}>
          
            <AnimatePresence>
              {revealed && event &&
                    <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE }} className={`absolute -top-7 left-[-2px] whitespace-nowrap rounded-sm px-2 py-1 font-mono text-xs font-medium text-black ${item.recyclable ? 'bg-emerald-400' : 'bg-amber-400'}`}>
              
                  {item.id} {(event.confidence * 100).toFixed(1)}%
                </motion.span>}
            </AnimatePresence>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-black/70 px-5 py-4" role="status" aria-live="polite">
            {revealed && bin ?
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <p className="text-lg font-semibold">{item.label}</p>
                <p className="font-mono text-sm text-white/75">
                  → {bin.label} · servo {bin.servoAngle}°
                </p>
              </div> :
                    <p className="font-mono text-sm text-white/75">Running object detection…</p>}
          </div>
        </>}
    </section>);
}
