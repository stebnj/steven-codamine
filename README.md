# Codamine

> **Get your daily dose of coding dopamine with your buddy Codamine!**

---

## Inspiration

Are you struggling to lock in on your project? Craving a sense of progress? Do you need your ego to be kept in check? Maybe we can **LINK** you to a **WILDER** solution. ;)

**Codamine** is a VSCode extension that gamifies the coding experience by giving you XP for each keystroke in a project, tracking the number of lines of code you've written, and summarizing your commit-diffs all while motivating you with a harmless-looking mascot that calls you out in the sidebar.

Get your daily dose of coding dopamine with your buddy Codamine!

---

## What It Does

**Codamine** was developed for **HackTheBreak 2026** to help developers to _unLINK_ from distractions, and get _WILDER_ with our code. We wanted to build a took that brought back the simple joy of seeing numbers go up, but with the specific brand of savage, motivational push inspired from two very memorable instructors.

**Codamine** sits in the sidebar autonomously so it doesn't distract you when you're locked in, but when your eyes start glazing over it's there to remind you to LOCK IN. Any developer who gets distracted, thinks too highly of themself, or has a crumb of whimsy in their soul will get something out of **Codamine**.

### Features

- An innocent looking animated coding-buddy (a Co.ddy) sits on the bottom right of your side bar to keep you company.
- Co.ddy encourages you with "motivational" quips to help boost your focus and productivity in a set interval.
  - Need more motivation? Click on him for more!
- A gamified system and UI where you can level that also tracks statistics and metrics like:
  - Key strokes give a certain amount of exp. More keystrokes = more exp earned
  - Tracks how many lines of code you've coded for the day that resets the next day but adds onto the total.
  - Levels are project scoped, so every new project/repo means you restart, you wanna beat your previous level? Code more.
- An AI powered commit-diff analyzer that tracks your diff between commits, analyzes them and summarizes what you've committed into a further "motivating" (savage) quip.

---

## How to Run

1. Download VSCode and install the extension “**Codamine**” from the VSCode.
2. Open a new workspace and check in the Primary Side Bar, where you should see a “**Codamine**” tab under the Explorer section.
3. A Co.ddy is now live in your sidebar. He’s cute, he’s whimsical... he’s seen your commit history, he’s unimpressed by your variable naming, and he isn't going anywhere until you're actually productive.

Try not to disappoint him, he has a very loud voice and zero boundaries.

---

## Techstack + Tools

- **Front End** - React + TypeScript
- **Build System** - ESBuild
- **Backend** - VS Code Extension, VS Code Git API + GeminiAI API
- **Styling** - CSS

---

## Challenges We Ran Into

**Biggeset Challenge**: Git commit integration. Hours were spent debugging on:

- Retrieving commit messages reliably. VS Code provided an `onCommit` listener that led to bugs because of timing issues where the extension would trigger before the commit was finalized.
- Had to really dive deep into Git and got lost in the documentation due to type restriction (lots of inheritances and properties)

**Other Challenges**:

- Setting up the VSCode Extension template and integrating it with React + Vite (initially).
  - Managing state between the VS Code backend and React frontend was really challenging to set up with CORS restrictions and URI sanitization.
- Ensuring XP updates were calculated and reflected accurately (no double-counting/missed events).
- Syncing asynchronous Git commands with real-time UI.
- AI API testing due to token limits.
  - We had to build a mock-API that matched the response structure of the AI provider that we were planned to use. Testing for errors were more challenging without a live API.

---

## Accomplishments We're Proud Of

- We're all from the same intake, and seeing our growth throughout the terms has been motivating and validating.
- Each and everyone of us has either learned a new tool, framework or language and was able to implement it.
- Successfully implementing AI into our project (first time for all).
- Growth - how we adapted our workflow and our teamwork style throughout the project.
- Everyone agrees that we're getting better as individuals, growth as a developer was clear in between our previous projects and Codamine.

---

## What We Learned

- Halfway we realized that time could've been used more efficiently by not only working on our own separate branches. If two people are working in some kind of relation, a shared branch would've saved us so much more time and had us more productive.
- We chose **React** and **TypeScript** not because it was the "best option", but specifically as a learning opportunity (our main goal)
  - Half the team had never used React
  - The other half of the team has never used TypeScript
- How to work in a team, and as a team. Seeing each others strengths, teaching and learning from one another, and learning how to adapt our work under high-pressure.

---

## What's Next for Codamine (Wishlist)

- Add a daily streak system
- Data visualization of stats and metrics
- A shop system with economy
  - Unlock a selection of Co.ddy() sprites as rewards that are available for adoption.
- Attaching a "title" per user level that fits Codamine's vibe (e.g. `Level 0` = `Pushes to main branch` and` Level 67` = `Eats Assembly for Breakfast`)
- Customizable XP curves and skill trees based on language usage or user preference.
- (_HUGE WISH_) A stress-release feature (random event) where you can mash the keyboard and `X` will happen (e.g. a balloon pops up in the dashboard, and player must mash keyboard to pop it and gain rewards/incentives)
