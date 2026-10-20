"use client";
import React from 'react';
import { CheckIcon } from 'lucide-react';
const STEPS = [
    { title: 'Ultrasonic sensor', detail: 'Object in slot' },
    { title: 'Camera detection', detail: 'Identify item' },
    { title: 'Servo sorter', detail: 'Route to bin' },
    { title: 'Rice credit', detail: 'Add to balance' }
];
const STAGE_INDEX = {
    idle: -1,
    sensing: 0,
    detecting: 1,
    sorting: 2,
    credited: 3,
    rejected: 3
};
export function PipelineSteps({ stage }) {
    const activeIndex = STAGE_INDEX[stage];
    const stateFor = (i) => {
        if (activeIndex < 0 || i > activeIndex)
            return 'pending';
        if (i < activeIndex)
            return 'done';
        if (stage === 'credited')
            return 'done';
        if (stage === 'rejected')
            return 'blocked';
        return 'active';
    };
    return (<ol aria-label="Machine pipeline" className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
      {STEPS.map((step, i) => {
            const state = stateFor(i);
            return (<li key={step.title} className="flex gap-3">
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-medium transition-colors duration-200 ${state === 'done' ?
                    'border-accent bg-accent text-white' :
                    state === 'active' ?
                        'border-accent text-accent' :
                        state === 'blocked' ?
                            'border-warn bg-warn text-white' :
                            'border-line text-muted'}`} aria-hidden>
              
              {state === 'done' ? <CheckIcon className="h-3.5 w-3.5"/> : i + 1}
            </span>
            <div>
              <p className={`text-sm font-medium ${state === 'pending' ? 'text-muted' : 'text-ink'}`}>{step.title}</p>
              <p className={`text-xs ${state === 'blocked' ? 'text-warn' : 'text-muted'}`}>
                {state === 'blocked' ? 'Not recyclable — no rice' : step.detail}
              </p>
            </div>
          </li>);
        })}
    </ol>);
}
