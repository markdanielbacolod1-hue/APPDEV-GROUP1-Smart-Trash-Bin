"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RecycleIcon, UsbIcon } from "lucide-react";
import { useArduino } from "../contexts/ArduinoContext";
const STATUS_COPY = {
    unsupported: { label: "Test mode (no Web Serial)", dot: "bg-muted" },
    disconnected: { label: "Arduino not connected", dot: "bg-muted" },
    connecting: { label: "Connecting…", dot: "bg-warn" },
    connected: { label: "Arduino connected", dot: "bg-accent" },
    error: { label: "Connection error", dot: "bg-danger" },
};
export function AppHeader() {
    const pathname = usePathname();
    const { status, connect, disconnect } = useArduino();
    const copy = STATUS_COPY[status];
   const navClass = (active) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
    active
      ? "bg-[#202522] text-white"
      : "text-[#626963] hover:bg-gray-100 hover:text-[#202522]"
  }`;
    return (<header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">
            <RecycleIcon className="h-4 w-4" aria-hidden/>
          </span>
          <span className="whitespace-nowrap font-semibold tracking-tight">RiceBin</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <Link href="/" className={navClass(pathname === "/")}>Kiosk</Link>
          <Link href="/dashboard" className={navClass(pathname.startsWith("/dashboard"))}>Dashboard</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 whitespace-nowrap text-sm text-muted md:flex">
            <span className={`h-2 w-2 rounded-full ${copy.dot}`} aria-hidden/>
            {copy.label}
          </span>
          {status !== "unsupported" && (<button type="button" onClick={status === "connected" ? disconnect : connect} disabled={status === "connecting"} className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50">
              <UsbIcon className="h-4 w-4" aria-hidden/>
              {status === "connected" ? "Disconnect" : "Connect Arduino"}
            </button>)}
        </div>
      </div>
    </header>);
}
