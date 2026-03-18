import * as vscode from "vscode"; // give access to VS Code API
import { exec } from "child_process"; // gives exec() to run terminal commands?

/**
 * The data passed to the commit callback.
 */
interface CommitData {
  diff: string;
  message: string;
}

/**
 * Tracks the commit state to detect new commits in a repo.
 */
interface RepoTracker {
  lastCommitHash: string | undefined;
  lastBranch: string | undefined;
  safetyDelay: NodeJS.Timeout | undefined;
}

/**
 * Gets the most recent commit message from git.
 *
 * @param folder folder to run the git command in
 * @returns commit message
 */
const getCommitMessage = (folder: string): Promise<string> => {
  // Note: Had to use Promises here because exec() is old and uses the old callback method.

  /*
   *  Promise is just async/await
   *  resolve = call when it works -> pass result
   *  reject = call when it fails -> pass error
   *  returns a Promise<string> because exec() is async
   */
  return new Promise((resolve, reject) => {
    /*
     *  exec() runs the terminal command
     *  1st arg: flags makes it get full message ONLY
     *  2nd arg = call when it fails -> pass error
     *  3rd arg = callback that runs when command finishes
     */
    exec("git log -1 --pretty=%B", { cwd: folder }, (error, output) => {
      if (error) {
        reject(error); // send error to catch()
      } else {
        resolve(output); // send text to then()
      }
    });
  });
};

// Repository - i think i can use this instead of that custom damn exec class..?
// getCommit(ref: string): Promise<Commit> {
// 		return this.repository.getCommit(ref);
// 	}

/**
 * Returns the changes between the previous and most recent commit.
 *
 * @param folder folder to run the git command in
 * @returns commit changes as a strinf
 */
const getCommitChanges = (folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec("git diff HEAD~1 HEAD", { cwd: folder }, (error, output) => {
      if (error) {
        reject("No changes were made.");
      } else {
        resolve(output);
      }
    });
  });
};

/**
 * A listener that gets triggered everytime a user makes a commit.
 * This function was created because VS Code's `onDidCommit()` function wasn't reliable.
 * e.g. if a user commited from the integrated terminal vs. their own terminal.
 *
 * To fix that, we watch for any change on the repo's state, then manually check if commit hash
 * hash has changed to get full coverage.
 *
 * @param context manages cleanup (given by VS Code in activate())
 * @param onCommit the callback event listener that watches for a commit
 */
export function watchForCommits(
  context: vscode.ExtensionContext,
  onCommit: (data: { diff: string; message: string }) => void,
) {
  // 1. Get the Git API
  const git = getGitAPI();

  // If it doesn't exist, return.
  if (!git) {
    console.log("Could not get Git Extension.");
    return;
  }

  // Set-up existing repos
  for (const repo of git.repositories) {
    setupRepo(repo, context, onCommit);
  }

  // Set up repositories to open while extension's already running
  const repoListener = git.onDidOpenRepository((repo: any) => {
    setupRepo(repo, context, onCommit);
  });

  // Clean-up
  context.subscriptions.push(repoListener);
}

/**
 * Grabs the latest commit diff and message and passes it to callback.
 *
 * @param folder the repo root path
 * @param onCommit the callback to pass commit data to
 */
async function triggerOnCommit(
  folder: string,
  onCommit: (data: CommitData) => void,
): Promise<void> {
  try {
    // Using async/await cause it's easier for me (and all of us) to understand.
    const diff = await getCommitChanges(folder);
    const message = await getCommitMessage(folder);

    onCommit({ diff, message });
  } catch (error) {
    console.error("Could not grab commit message: ", error);
  }
}

/**
 * Sets up commit detection for a repo in one of two ways:
 *  1. Watch for HEAD hash changes (to catch terminal/external commits)
 *  2. Listen to onDidCommit (catch VS Code UI integrated commits)
 *
 * The @param context is used for cleanup, so VS Code closes all listeners when
 * the extension isn't running.
 *
 * @param repo a repo object
 * @param context extension context for cleanup
 * @param onCommit the callback to call when a commit is detected
 */
function setupRepo(
  repo: any,
  context: vscode.ExtensionContext,
  onCommit: (data: CommitData) => void,
): void {
  const folder = repo.rootUri.fsPath;

  const tracker: RepoTracker = {
    lastCommitHash: repo.state.HEAD?.commit,
    lastBranch: repo.state.HEAD?.name, // added to fix the API firing bug
    safetyDelay: undefined,
  };

  // 1. Native terminal/external commits
  const stateListener = repo.state.onDidChange(() => {
    const currentHash = repo.state.HEAD?.commit;
    const currentBranch = repo.state.HEAD?.name;

    // If the branch changed, this is a branch switch, NOT a new commit.
    // Just update both values silently and bail out.
    if (currentBranch !== tracker.lastBranch) {
      tracker.lastBranch = currentBranch;
      tracker.lastCommitHash = currentHash;
      return; //  don't fire onCommit
    }

    if (currentHash && currentHash !== tracker.lastCommitHash) {
      tracker.lastCommitHash = currentHash;

      // Debounce: git can fire multiple state changes in one burst
      if (tracker.safetyDelay) {
        clearTimeout(tracker.safetyDelay);
      }

      tracker.safetyDelay = setTimeout(
        () => triggerOnCommit(folder, onCommit),
        1500,
      );
    }
  });

  // 2. VS Code's direct commit event
  const commitListener = repo.onDidCommit(() => {
    triggerOnCommit(folder, onCommit);
  });

  context.subscriptions.push(stateListener, commitListener);
}

/**
 * Returns the VS Code Git API built-in extension.
 *
 * @returns the API object or undefined if extension is unavailable.
 */
function getGitAPI(): any | undefined {
  const gitExtension = vscode.extensions.getExtension("vscode.git");

  if (!gitExtension) {
    return undefined;
  }

  return gitExtension.exports.getAPI(1);
}

// I am going in circles.. someone please send help what is this documentation :( where's my wiki links?!!?

/*
const git = gitExtension.getAPI(1); -> returns and API instance
git.repositories; -> a Repository[];

a Repository instance has:
    instance variables:
        - readonly rootUri: Uri;

    functions:
    - getCommit(ref: string): Promise<Commit> <- ??? need a hash :(
    - readonly onDidCommit: Event<void>; 
    - commit(message: string, opts?: CommitOptions): Promise<void>;
    - readonly onDidCommit: Event<void>;
    - add(paths: string[]): Promise<void>;
*/
