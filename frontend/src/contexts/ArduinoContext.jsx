"use client";
import React, { createContext, useCallback, useEffect, useContext, useMemo, useRef, useState } from 'react';
const ArduinoContext = createContext(null);
const BAUD_RATE = 9600;
export function ArduinoProvider({ children }) {
    const supported =
        typeof navigator !== "undefined" && "serial" in navigator;

    const [status, setStatus] = useState("unsupported");

    useEffect(() => {
    setStatus(supported ? "disconnected" : "unsupported");
    }, [supported]);
    const [log, setLog] = useState([]);
    const portRef = useRef(null);
    const readerRef = useRef(null);
    const listeners = useRef(new Set());
    const idRef = useRef(0);
    const pushLog = useCallback((dir, text, simulated) => {
        idRef.current += 1;
        const entry = { id: idRef.current, dir, text, at: Date.now(), simulated };
        setLog((prev) => [entry, ...prev].slice(0, 40));
    }, []);
    const readLoop = useCallback(async (port) => {
        if (!port.readable)
            return;
        const decoder = new TextDecoderStream();
        const piped = port.readable.
            pipeTo(decoder.writable).
            catch(() => undefined);
        const reader = decoder.readable.getReader();
        readerRef.current = reader;
        let buffer = '';
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                buffer += value;
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() ?? '';
                for (const raw of lines) {
                    const line = raw.trim();
                    if (!line)
                        continue;
                    pushLog('in', line, false);
                    listeners.current.forEach((fn) => fn(line));
                }
            }
        }
        catch {
            setStatus('error');
        }
        finally {
            reader.releaseLock();
            await piped;
        }
    }, [pushLog]);
    const connect = useCallback(async () => {
        if (!supported)
            return;
        setStatus('connecting');
        try {
            const serial = navigator.serial;
            const port = await serial.requestPort();
            await port.open({ baudRate: BAUD_RATE });
            portRef.current = port;
            setStatus('connected');
            pushLog('in', `Port opened at ${BAUD_RATE} baud`, false);
            void readLoop(port);
        }
        catch (err) {
            const cancelled = err instanceof DOMException && err.name === 'NotFoundError';
            setStatus(cancelled ? 'disconnected' : 'error');
        }
    }, [supported, pushLog, readLoop]);
    const disconnect = useCallback(async () => {
        try {
            await readerRef.current?.cancel();
            await portRef.current?.close();
        }
        catch {
            // port may already be closed
        }
        portRef.current = null;
        readerRef.current = null;
        setStatus(supported ? 'disconnected' : 'unsupported');
    }, [supported]);
    const send = useCallback(async (command) => {
        const port = portRef.current;
        if (!port?.writable) {
            pushLog('out', command, true);
            return;
        }
        pushLog('out', command, false);
        const writer = port.writable.getWriter();
        try {
            await writer.write(new TextEncoder().encode(`${command}\n`));
        }
        finally {
            writer.releaseLock();
        }
    }, [pushLog]);
    const subscribe = useCallback((listener) => {
        listeners.current.add(listener);
        return () => {
            listeners.current.delete(listener);
        };
    }, []);
    const value = useMemo(() => ({ status, log, connect, disconnect, send, subscribe }), [status, log, connect, disconnect, send, subscribe]);
    return <ArduinoContext.Provider value={value}>{children}</ArduinoContext.Provider>;
}
export function useArduino() {
    const ctx = useContext(ArduinoContext);
    if (!ctx)
        throw new Error('useArduino must be used inside ArduinoProvider');
    return ctx;
}
