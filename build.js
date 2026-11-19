#!/usr/bin/env node
/**
 * Build / Config Generator Script
 * Reads the BABY_GENDER (or GENDER) environment variable (or .env file)
 * and writes config.js for static hosting.
 */

const fs = require("fs");
const path = require("path");

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const parsed = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    parsed[key] = val;
  }
  return parsed;
}

function resolveGenderFromEnv() {
  const dotEnv = loadDotEnv();
  const raw =
    process.env.BABY_GENDER ||
    process.env.GENDER ||
    process.env.VITE_BABY_GENDER ||
    dotEnv.BABY_GENDER ||
    dotEnv.GENDER ||
    "girl";
  return String(raw).trim().toLowerCase() === "boy" ? "boy" : "girl";
}

function generateConfigJsContent(gender) {
  const configObj = {
    babyGender: gender,
    soundEnabledByDefault: true,
    clueSets: {
      girl: {
        level1: {
          badge: "Mystery Scroll #1 — Sunny Meadow",
          title: "A Whisper in the Breeze",
          riddle:
            "A brand-new player is joining the quest,\n" +
            "Tucked away cozy and getting some rest!\n" +
            "Craving sweet treats morning, noon, and at night,\n" +
            "With a swift little drumbeat at 160 in flight!",
          hintNote: "Wait... who is this new player? Reach the end of World 1-2 for the next scroll!"
        },
        level2: {
          badge: "Mystery Scroll #2 — Plot Twist Unlocked!",
          title: "The Secret Quest Revealed!",
          twistHeadline: "🎉 SURPRISE! IT'S A GENDER REVEAL! 👶",
          riddle:
            "You thought you were playing a regular game,\n" +
            "Now guess if a Prince or a Princess just came!\n" +
            "Clue #2: Forget frogs and snails and tails—\n" +
            "Sugar and spice have set our sweet sails!",
          hintNote: "One final world remains! Reach the Rainbow Castle in World 1-3 for the grand reveal!"
        },
        level3: {
          badge: "Final Scroll — Rainbow Castle",
          title: "The Castle Banner Unfurls!",
          headline: "IT'S A BABY GIRL!",
          riddle:
            "Through meadows and starlight you leaped to the end,\n" +
            "To meet our new bundle, our littlest friend!\n" +
            "With bows in the castle and pink in the sky,\n" +
            "Our sweet baby DAUGHTER is saying 'Hi!'",
          celebrationSubtext: "Get ready for giggles, bows, and big adventures!"
        }
      },
      boy: {
        level1: {
          badge: "Mystery Scroll #1 — Sunny Meadow",
          title: "A Whisper in the Breeze",
          riddle:
            "A brand-new player is joining the quest,\n" +
            "Tucked away cozy and getting some rest!\n" +
            "Craving salty snacks morning, noon, and at night,\n" +
            "With a steady strong drumbeat below 140 in flight!",
          hintNote: "Wait... who is this new player? Reach the end of World 1-2 for the next scroll!"
        },
        level2: {
          badge: "Mystery Scroll #2 — Plot Twist Unlocked!",
          title: "The Secret Quest Revealed!",
          twistHeadline: "🎉 SURPRISE! IT'S A GENDER REVEAL! 👶",
          riddle:
            "You thought you were playing a regular game,\n" +
            "Now guess if a Prince or a Princess just came!\n" +
            "Clue #2: With energy bouncing from morning till night,\n" +
            "Snips, snails, and puppy-dog tails take flight!",
          hintNote: "One final world remains! Reach the Rainbow Castle in World 1-3 for the grand reveal!"
        },
        level3: {
          badge: "Final Scroll — Rainbow Castle",
          title: "The Castle Banner Unfurls!",
          headline: "IT'S A BABY BOY!",
          riddle:
            "Through meadows and starlight you leaped to the end,\n" +
            "To meet our new bundle, our littlest friend!\n" +
            "With crowns in the castle and blue in the sky,\n" +
            "Our sweet baby SON is shouting 'Hi!'",
          celebrationSubtext: "Get ready for mud puddles, bowties, and big adventures!"
        }
      }
    }
  };

  return (
    "/**\n" +
    " * Generated from environment variable BABY_GENDER (via build.js / server.js).\n" +
    " * To change the gender, set BABY_GENDER=boy or BABY_GENDER=girl in your environment.\n" +
    " */\n" +
    `window.GAME_CONFIG = ${JSON.stringify(configObj, null, 2)};\n`
  );
}

if (require.main === module) {
  const gender = resolveGenderFromEnv();
  const outPath = path.join(__dirname, "config.js");
  fs.writeFileSync(outPath, generateConfigJsContent(gender), "utf8");
  console.log(`[build] Generated config.js with BABY_GENDER="${gender}"`);
}

module.exports = { resolveGenderFromEnv, generateConfigJsContent };
