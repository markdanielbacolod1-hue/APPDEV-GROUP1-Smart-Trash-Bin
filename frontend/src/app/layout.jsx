import "./globals.css";
import { ArduinoProvider } from "../contexts/ArduinoContext";
import { DetectionLogProvider } from "../contexts/DetectionLogContext";
import { AppHeader } from "../components/AppHeader";
export const metadata = {
    title: "RiceBin",
    description: "Trade recyclables for rice with RiceBin.",
};
export default function RootLayout({ children }) {
    return (<html lang="en">
      <body>
        <ArduinoProvider>
          <DetectionLogProvider>
            <div className="min-h-screen w-full bg-canvas text-ink">
              <AppHeader />
              {children}
            </div>
          </DetectionLogProvider>
        </ArduinoProvider>
      </body>
    </html>);
}
