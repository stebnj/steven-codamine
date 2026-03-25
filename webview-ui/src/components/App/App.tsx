import "./App.css";
import Summary from "../Summary/Summary";
import Arsen from "../ForArsen/Arsen";
import { useState, useEffect } from "react";
import XPBar from "../XPBar/XPBar";
import LinesWritten from "../LinesWritten/LinesWritten";
import Stats from "../Stats/StatsButton";


interface DailyStats {
  date: string
  keystrokes: number
  lines: number
  commits: number
  xpGained: number
}

declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

const vscode = acquireVsCodeApi();

function App() {
  const [xp, setXp] = useState(0);
  const [summary, setSummary] = useState("");
  const [statsHistory, setStatsHistory] = useState<DailyStats[]>([]);
  const [showStats, setShowStats] = useState(false);


  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "initializeBar":
          setXp(message.xp);
          break;
        case "updateXP":
          setXp(message.xp);
          vscode.setState({ xp: message.xp });
          break;
        case "levelUp":
          break;
        case "aiSummary":
          setSummary(message.summary);
          break;
        case "statsHistory":
          setStatsHistory(message.history)
          setShowStats(true)
          break;

      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

    const handleStatsClick = () => {
      vscode.postMessage({type: "getStats"})
    }

  return (
    <>
      <section id="panel" className="dashboard">
        <Summary summary={summary} />
        <Arsen />
        <XPBar xp={xp} />
        <button onClick={handleStatsClick}>Stats</button>
        {showStats && (
          <Stats
              history = {statsHistory}
              onClose={() => setShowStats(false)}
              />
        )}
        <LinesWritten />
      </section>
    </>
  );
}

export default App;
