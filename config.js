/**
 * ============================================================================
 * BABY GENDER REVEAL GAME — CONFIGURATION FILE
 * ============================================================================
 *
 * HOW TO SET THE GENDER PRIVATELY:
 * 1. Change `babyGender` below to either "girl" or "boy".
 * 2. Optionally customize `parentsNames`, `dueDate`, or the rhymes in `clueSets`.
 * 3. Save this file and refresh the browser!
 *
 * All 3 levels' end-of-level clues and the Level 3 castle fireworks will
 * automatically adapt to your choice.
 */

window.GAME_CONFIG = {
  // 👈 CHANGE THIS TO "boy" OR "girl"
  babyGender: "girl",

  // Optional personalization shown on the title screen & finale banner
  gameTitle: "Super Baby Bros.",
  subtitle: "A Gender Reveal Adventure!",
  parentsNames: "Mom & Dad",
  dueDate: "Arriving Soon!",

  // Gameplay tuning (kept forgiving & joyful by default)
  infiniteLives: true,
  soundEnabledByDefault: true,

  /**
   * Subtle riddles & playful rhymes revealed at the flagpole of each level.
   * Feel free to edit any text below to add personal inside jokes or details!
   */
  clueSets: {
    girl: {
      level1: {
        badge: "Clue #1 — Stork's Sunny Meadow",
        title: "A Whisper in the Breeze",
        riddle:
          "Ten tiny fingers, ten tiny toes,\n" +
          "A sweet little secret that nobody knows!\n" +
          "Sugar and starlight and everything bright,\n" +
          "Our heartbeat was racing at 160 in flight!",
        hintNote: "Old wives' tale hint: A fast heartbeat over 140 bpm often points one sweet way..."
      },
      level2: {
        badge: "Clue #2 — Starlight Nursery",
        title: "Riddle of the Stars",
        riddle:
          "Forget the frogs and snails and tails,\n" +
          "Our ship has set for sweeter sails!\n" +
          "With grace and charm and giggles galore,\n" +
          "A new little royalty knocks at the door!",
        hintNote: "Nursery rhyme hint: What are little ones made of? Think spice and everything nice!"
      },
      level3: {
        badge: "Final Reveal — Rainbow Castle",
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
        badge: "Clue #1 — Stork's Sunny Meadow",
        title: "A Whisper in the Breeze",
        riddle:
          "Ten tiny fingers, ten tiny toes,\n" +
          "A bold little secret that nobody knows!\n" +
          "Salty snacks, cravings, and steady strong beats,\n" +
          "A brand new adventurer's coming to meet!",
        hintNote: "Old wives' tale hint: Craving salty treats and a steady drumbeat below 140 bpm..."
      },
      level2: {
        badge: "Clue #2 — Starlight Nursery",
        title: "Riddle of the Stars",
        riddle:
          "With energy bouncing from morning till night,\n" +
          "This little explorer can't wait for the light!\n" +
          "Snips and snails and puppy-dog tails,\n" +
          "A brave little prince is setting his sails!",
        hintNote: "Nursery rhyme hint: What are little adventurers made of? Snips, snails & puppy-dog tails!"
      },
      level3: {
        badge: "Final Reveal — Rainbow Castle",
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
