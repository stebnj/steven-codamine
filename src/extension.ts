import * as vscode from "vscode";
import { watchForCommits } from "./gitHandler";
import { getAiSummary } from "./aiSummary";

const pressesKey = "keypresses";
const levelKey = "level";
const timestampKey = "locTimestamp";
const initLocKey = "initLoc";
const curLocKey = "curLoc";

export function activate(context: vscode.ExtensionContext) {
  // 1. REGISTER THE SIDEBAR PROVIDER
  const provider = new BruceViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("bruce.window", provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  // 2. COMMANDS
  const openPanel = vscode.commands.registerCommand("bruce.start", () => {
    vscode.window.createWebviewPanel(
      "bruce",
      "brucey loosey",
      vscode.ViewColumn.One,
      {},
    );
  });

  const motivationMsg = vscode.commands.registerCommand(
    "bruce.getRoasted",
    () => {
      vscode.window.showInformationMessage("@#$%^you suck at coding!!@#$%^&");
    },
  );

  // 3. SET UP EVENT LISTENERS
  // Commit Listener
  watchForCommits(context, (data) => {
    vscode.window.showInformationMessage("Committed: " + data.message);

    console.log("Diff content: " + data);

    getAiSummary(data.diff)
      .then((summary) => {
        provider.sendAiSummary(summary);
      })
      .catch((error) => {
        console.error("Could not generate summary:", error);
      });
  });

  initializeXPTracking(context, provider);
  vscode.window.onDidChangeActiveTextEditor(
    (e: vscode.TextEditor | undefined) => {
      initializeXPTracking(context, provider);
    },
  );

  /* Whenever the user opens a file for the first time:
   * 1. Read the timestamp associated with that file in workspaceState
   * 2. If the timestamp is on a different day than today:
   *   a) Set the timestamp to now
   *   b) Set the initial # of lines of code for that file to the current lines of code in that file
   */
  vscode.workspace.onDidOpenTextDocument((e: vscode.TextDocument) => {
    const uriString = e.uri.toString();

    const currentTime = new Date();
    const locTimestamp: number | undefined = context.workspaceState.get(
      `${uriString}.${timestampKey}`,
    );
    const locDate: Date | undefined =
      locTimestamp == undefined ? undefined : new Date(locTimestamp);

    if (
      locDate == undefined ||
      locDate.getDate() != currentTime.getDate() ||
      locDate.getFullYear() != currentTime.getFullYear()
    ) {
      context.workspaceState.update(
        `${uriString}.${timestampKey}`,
        currentTime.getTime(),
      );
      context.workspaceState.update(`${uriString}.${initLocKey}`, e.lineCount);
    }
  });

  /* Whenever the user changes a file's contents (ie, on every keystroke):
   * 1. Increment the global and workspace keypress counts
   * 2. Divide workspace keypress count by 10 to get xp and send it to the webview
   * 3. Determine if the user has leveled up, and if so, tell the webview
   * 4. Get the initial lines of code (if undefined, set it and the timestamp based on current file contents)
   * 5. Update the current lines of code for the current file in the workspace state with the current lines of code in the file
   * 6. Add up the progress (current - initial) for each document in the workspace
   * 7. Send the total progress (total lines of code written in project today) to webview
   */
  vscode.workspace.onDidChangeTextDocument(
    (e: vscode.TextDocumentChangeEvent) => {
      const currentWorkspacePresses: number =
        context.workspaceState.get(pressesKey) ?? 0;
      context.workspaceState.update(pressesKey, currentWorkspacePresses + 1);

      const currentGlobalPresses: number =
        context.globalState.get(pressesKey) ?? 0;
      context.globalState.update(pressesKey, currentGlobalPresses + 1);

      const xp = (currentWorkspacePresses + 1) / 10;
      const level: number = context.workspaceState.get(levelKey) ?? 1;

      provider.sendXPMessage(xp);
      if (xp >= xpForLevel(level + 1)) {
        context.workspaceState.update(levelKey, level + 1);
        provider.sendLevelUpMessage(xpForLevel(level + 1));
      }

      // Lines of code stuff
      let initialLoc: number | undefined = context.workspaceState.get(
        `${e.document.uri.toString()}.${initLocKey}`,
      );
      if (initialLoc === undefined) {
        initialLoc = e.document.lineCount;
        context.workspaceState.update(
          `${e.document.uri.toString()}.${initLocKey}`,
          e.document.lineCount,
        );
        context.workspaceState.update(
          `${e.document.uri.toString()}.${timestampKey}`,
          Date.now(),
        );
      }

      context.workspaceState.update(
        `${e.document.uri.toString()}.${curLocKey}`,
        e.document.lineCount,
      );

      // tally up total lines of code
      let totalLoc: number = 0;
      for (const doc of vscode.workspace.textDocuments) {
        const docLoc: number =
          context.workspaceState.get(`${doc.uri.toString()}.${curLocKey}`) ?? 0;
        const docInitLoc: number =
          context.workspaceState.get(`${doc.uri.toString()}.${initLocKey}`) ??
          docLoc;

        totalLoc += docLoc > docInitLoc ? docLoc - docInitLoc : 0;
      }

      provider.sendNumLinesMessage(totalLoc);
    },
  );

  context.subscriptions.push(openPanel, motivationMsg);
}

// THE SIDEBAR PROVIDER CLASS
class BruceViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "bruce.window";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "webview.js"),
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "webview.css"),
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>                                                                    
    <html lang="en">                                                                           
    <head>                                                                                     
    <meta charset="UTF-8">                                                                   
    <meta http-equiv="Content-Security-Policy"                                               
    content="default-src 'none';                                                             
            style-src ${webview.cspSource} 'unsafe-inline';                                 
            img-src ${webview.cspSource} data: vscode-webview-resource:;                    
            script-src 'nonce-${nonce}' 'unsafe-eval' ${webview.cspSource};                 
            connect-src http://127.0.0.1:3001 http://localhost:3001;">                      
    <meta name="viewport" content="width=device-width, initial-scale=1.0">                   
    <link href="${styleUri}" rel="stylesheet">                                               
    <title>Brucey Loosey</title>                                                             
  </head>                                                                                    
  <body>                                                                                     
    <div id="root">Loading Brucey Loosey...</div>                                            
    <script nonce="${nonce}" src="${scriptUri}"></script>                                    
  </body>                                                                                    
  </html>`;
  }

  // Sends a message to the webview to completely reset the xp display to these values
  public sendInitMessage(xp: number, level: number, xpToNext: number) {
    if (this._view) {
      this._view.webview.postMessage({
        type: "initializeBar",
        xp: xp,
        level: level,
        xpToNext: xpToNext,
      });
    }
  }

  // Sends a message to the webview to update the user's xp to this value
  public sendXPMessage(xp: number) {
    if (this._view) {
      this._view.webview.postMessage({
        type: "updateXP",
        xp: xp,
      });
    }
  }

  // Sends a message to the webview that the user has leveled up. xpToNext should be the necessary xp for the new next level.
  public sendLevelUpMessage(xpToNext: number) {
    if (this._view) {
      this._view.webview.postMessage({
        type: "levelUp",
        xpToNext: xpToNext,
      });
    }
  }

  // Sends a message to the webview containing the total lines of code the user has written in this workspace
  public sendNumLinesMessage(lines: number) {
    if (this._view) {
      this._view.webview.postMessage({
        type: "numLines",
        lines: lines,
      });
    }
  }

  /**
   * Passes the AI generated summary to Summary React Component.
   *
   * @param summary ai generated summary
   */
  public sendAiSummary(summary: string) {
    if (this._view) {
      this._view.webview.postMessage({
        type: "aiSummary",
        summary: summary,
      });
    }
  }
}

// Helper wrapper function around the code to set up the initial initmessage to the webview for a document
function initializeXPTracking(
  context: vscode.ExtensionContext,
  provider: BruceViewProvider,
) {
  const workspacePresses: number = context.workspaceState.get(pressesKey) ?? 0;
  const xp: number = workspacePresses / 10;
  let workspaceLevel: number | undefined = context.workspaceState.get(levelKey);

  if (workspaceLevel === undefined) {
    context.workspaceState.update(levelKey, 1);
    workspaceLevel = 1;
  }

  const xpToNext: number = xpForLevel(workspaceLevel);
  provider.sendInitMessage(xp, workspaceLevel, xpToNext);
}

// Given a level, calculate the xp to the next level
function xpForLevel(level: number): number {
  if (level <= 0) {
    return 100;
  } else {
    return 100 * 1.15 ** level + xpForLevel(level - 1);
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// DEACTIVATE EXTENSION
export function deactivate() {}
