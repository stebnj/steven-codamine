import "./App.css";
import Summary from "../Summary/Summary";
import Arsen from "../ForArsen/Arsen";
import { useState, useEffect } from "react";
import XPBar from "../XPBar/XPBar";
import LinesWritten from "../LinesWritten/LinesWritten";

declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

const vscode = acquireVsCodeApi();

function App() {
  const [xp, setXp] = useState(0);
  const [summary, setSummary] = useState("");

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
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <>
      <section id="panel" className="dashboard">
        <Summary summary={summary} />
        <Arsen />
        <XPBar xp={xp} />
        <LinesWritten />
      </section>
    </>
  );
}

export default App;
