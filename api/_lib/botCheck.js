"use strict";

const { checkBotId } = require("botid/server");

// Vercel BotID: the browser solves an invisible challenge (src/lib/botProtection.js)
// and sends the result in "x-is-human"; Vercel tells us whether it was a bot.
//
// Blocks only a confirmed bot verdict. A request without a challenge result
// (script blocked by an ad blocker, a slow network) or a BotID outage is let
// through and logged: plain scripts are already stopped at the edge by the
// Vercel Firewall, and endpoint rate limits still apply.
async function rejectBots(req, res) {
  if (!req.headers["x-is-human"]) {
    console.warn(`[botid] ${req.url}: no challenge result; allowed`);
    return true;
  }
  try {
    const verdict = await checkBotId({ advancedOptions: { headers: req.headers } });
    if (verdict.isBot) {
      console.warn(`[botid] ${req.url}: bot blocked${verdict.verifiedBotName ? ` (${verdict.verifiedBotName})` : ""}`);
      res.status(403).json({ message: "We couldn't verify this request. Please refresh the page and try again." });
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[botid] ${req.url}: check failed (allowed):`, error.message);
    return true;
  }
}

module.exports = { rejectBots };
