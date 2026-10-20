"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
const DetectionLogContext = createContext(null);
export function DetectionLogProvider({ children }) {
    const [events, setEvents] = useState([]);
    const [riceDispensedGrams, setRice] = useState(0);
    const addEvent = useCallback((event) => {
        setEvents((prev) => [event, ...prev].slice(0, 50));
    }, []);
    const recordDispense = useCallback((grams) => {
        setRice((prev) => prev + grams);
    }, []);
    const value = useMemo(() => ({ events, riceDispensedGrams, addEvent, recordDispense }), [events, riceDispensedGrams, addEvent, recordDispense]);
    return <DetectionLogContext.Provider value={value}>{children}</DetectionLogContext.Provider>;
}
export function useDetectionLog() {
    const ctx = useContext(DetectionLogContext);
    if (!ctx)
        throw new Error('useDetectionLog must be used inside DetectionLogProvider');
    return ctx;
}
