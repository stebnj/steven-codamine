/**
 * Fallback if AI API is down or doesn't work.
 * Returns a random savage summary from a general pool.
 *
 * @returns a random fallback message
 */
export function fallbackSummary(): string {
  const summaries = [
    "You committed something. Whether it works is between you and God.",
    "Another commit. Another mass of code I'd rather not look at.",
    "Bold move. Let's see if it pays off. It won't.",
    "I've seen things. This commit is now one of them.",
    "That's... certainly one way to write code. Not the right way, but a way.",
    "You just mass committed. I'm not mad, I'm disappointed.",
    "Somewhere, a senior developer just felt a disturbance in the force.",
    "Committing code at a hackathon without tests. Living on the edge.",
    "Code pushed. Bugs included. No refunds.",
    "I'd roast your code but it's already on fire.",
    "Another commit, another mass of 'I'll fix this later' lies.",
    "You ship code like you're trying to get rid of it. Respect.",
    "This commit has the energy of someone running from a fire they started.",
    "Congratulations. You just mass committed. Your future self will hate you.",
    "If spaghetti code was an Olympic sport, you'd be on the podium.",
  ];

  return summaries[Math.floor(Math.random() * summaries.length)];
}
