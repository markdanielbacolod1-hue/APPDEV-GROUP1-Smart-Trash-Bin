import { useCallback, useEffect, useRef, useState } from 'react';
import { useArduino } from '../contexts/ArduinoContext';
import { useDetectionLog } from '../contexts/DetectionLogContext';
import { bins, trashCatalog } from '../data/trashCatalog';
import { apiPost } from '../lib/api';

const STAGE_MS = {
  sensing: 600,
  detecting: 1700,
  sorting: 1000,
  credited: 1800,
  rejected: 2600,
};

export function useKioskSession() {
  const { send, subscribe } = useArduino();
  const { addEvent, recordDispense } = useDetectionLog();
  const [stage, setStage] = useState('idle');
  const [current, setCurrent] = useState(null);
  const [distance, setDistance] = useState(null);
  const [items, setItems] = useState([]);
  const [dispense, setDispense] = useState('idle');
  const [dispenseMs, setDispenseMs] = useState(0);
  const [dispensedGrams, setDispensedGrams] = useState(0);

  const stageRef = useRef(stage);
  const dispenseRef = useRef(dispense);
  stageRef.current = stage;
  dispenseRef.current = dispense;

  const timers = useRef([]);

  const schedule = useCallback((fn, ms) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => timers.current.forEach((timer) => window.clearTimeout(timer)),
    []
  );

  const balance = items.reduce((sum, entry) => sum + entry.item.riceGrams, 0);

  const finish = useCallback(() => {
    setStage('idle');
    setCurrent(null);
    setDistance(null);
  }, []);

  const trigger = useCallback((distanceCm) => {
    if (stageRef.current !== 'idle' || dispenseRef.current === 'dispensing') {
      return;
    }

    const item = pickItem();
    const event = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      item,
      confidence: 0.86 + Math.random() * 0.13,
      distanceCm,
      at: Date.now(),
    };

    setDistance(distanceCm);
    setCurrent(event);
    setStage('sensing');

    schedule(() => setStage('detecting'), STAGE_MS.sensing);

    schedule(() => {
      const bin = bins.find((entry) => entry.id === item.bin);
      void send(`SORT:${bin?.servoAngle ?? 180}`);

      const categoryMap = {
        plastic: 'Plastic Bottle',
        metal: 'Aluminum Can',
        paper: 'Paper Cardboard',
        residual: 'Plastic Wrapper',
      };

      const savedEvent = {
        ...event,
        dbTransactionId: null,
        saveError: false,
      };

      // Use POST to create a new kiosk event in MySQL.
      void apiPost('/kiosk/events', {
        detected_label: item.label,
        confidence_score: event.confidence,
        category_name: categoryMap[item.bin] || 'Other Waste',
        transaction_status: item.recyclable ? 'accepted' : 'rejected',
        rice_amount_grams: item.recyclable ? item.riceGrams : 0,
        target_compartment: bin?.label || 'Residual compartment',
        servo_angle: bin?.servoAngle ?? 180,
      })
        .then((saved) => {
          savedEvent.dbTransactionId = saved.transaction_id;
          addEvent({ ...savedEvent });
          setItems((prev) =>
            item.recyclable
              ? [
                  ...prev.filter((entry) => entry.id !== savedEvent.id),
                  { ...savedEvent },
                ]
              : prev
          );
        })
        .catch((error) => {
          console.error('Could not save kiosk event to MySQL:', error);
          savedEvent.saveError = true;
          addEvent({ ...savedEvent });
        });

      if (item.recyclable) {
        setStage('sorting');
        schedule(() => {
          setStage('credited');
        }, STAGE_MS.sorting);

        schedule(finish, STAGE_MS.sorting + STAGE_MS.credited);
      } else {
        setStage('rejected');
        schedule(finish, STAGE_MS.rejected);
      }
    }, STAGE_MS.sensing + STAGE_MS.detecting);
  }, [addEvent, finish, schedule, send]);

  useEffect(
    () =>
      subscribe((line) => {
        const match = /^OBJ:(\d+(?:\.\d+)?)/i.exec(line);
        if (match) trigger(parseFloat(match[1]));
      }),
    [subscribe, trigger]
  );

  const simulateDrop = useCallback(() => {
    trigger(Math.round((5 + Math.random() * 7) * 10) / 10);
  }, [trigger]);

  const dispenseRice = useCallback(() => {
    if (
      balance <= 0 ||
      stageRef.current !== 'idle' ||
      dispenseRef.current === 'dispensing'
    ) {
      return;
    }

    const duration = Math.min(3200, 900 + balance * 25);
    void send(`RICE:${balance}`);
    setDispensedGrams(balance);
    setDispenseMs(duration);
    setDispense('dispensing');

    schedule(() => {
      const pending = items.filter((entry) => entry.dbTransactionId);

      Promise.all(
        pending.map((entry) =>
          apiPost(
            `/rice-transactions/${entry.dbTransactionId}/dispense`,
            {}
          )
        )
      )
        .then(() => {
          recordDispense(balance);
          setItems([]);
          setDispense('done');
        })
        .catch((error) => {
          console.error(
            'Rice dispensing could not be saved to MySQL:',
            error
          );
          setDispense('idle');
        });
    }, duration);

    schedule(() => setDispense('idle'), duration + 3500);
  }, [balance, items, recordDispense, schedule, send]);

  return {
    stage,
    current,
    distance,
    items,
    balance,
    dispense,
    dispenseMs,
    dispensedGrams,
    simulateDrop,
    dispenseRice,
  };
}

function pickItem() {
  const total = trashCatalog.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of trashCatalog) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }

  return trashCatalog[0];
}
