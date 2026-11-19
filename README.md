# Super Starlight Bros. — 3-World Mystery Quest 🍄⭐

A bright, forgiving 3-level Super Mario Bros.–style platformer that keeps the fact that it's a **baby gender reveal** completely secret until the player clears **World 1-2**!

## How the Mystery Unfolds
1. **Title Screen & World 1-1 (Sunny Meadow):**
   - Looks and plays like a classic retro platformer (**"Super Starlight Bros. — 3-World Mystery Quest"**) with zero mention of babies, storks, or a gender reveal.
   - Reaching the World 1-1 flagpole unlocks **Mystery Scroll #1**, a playful riddle about a brand-new player joining the quest soon (with a subtle heartbeat/craving clue).
2. **World 1-2 (Starlight Cavern) — The Plot Twist:**
   - Reaching the World 1-2 flagpole unlocks **Mystery Scroll #2**, which reveals the twist: **`🎉 SURPRISE! IT'S A GENDER REVEAL! 👶`**, along with the second rhyme clue!
   - The top HUD badge then transforms from `Mystery Quest` into `👶 Gender Reveal Quest!`.
3. **World 1-3 (Rainbow Castle Finale) — Guess & Big Reveal:**
   - Reaching the final flagpole and castle prompts the player to lock in their final guess (**`💙 It's a Boy!`** or **`💖 It's a Girl!`**) before any colors or banners are shown.
   - Once they choose, the sky erupts into **Pink & Gold** or **Blue & Gold** fireworks, the castle banner unfurls, and the final rhyme announces whether their prediction was spot on!

---

## Configuring the Gender via Environment Variable

All in-game Host Setup UI has been removed. The gender is configured strictly through the `BABY_GENDER` environment variable (`"girl"` or `"boy"`).

### Option A: Run with the Node server (dynamic environment variable)
```bash
BABY_GENDER=boy npm start
# or
BABY_GENDER=girl npm start
```
Then open `http://localhost:8080`. The server reads `BABY_GENDER` directly from the environment (or a `.env` file, see [`.env.example`](./.env.example)) and serves `/config.js` dynamically.

### Option B: Build static files for deployment (Vercel, Netlify, Render, GitHub Pages)
Set `BABY_GENDER=boy` or `BABY_GENDER=girl` in your hosting platform's Environment Variables and use the build command:
```bash
BABY_GENDER=boy npm run build
```
This runs [`build.js`](./build.js) to bake `BABY_GENDER` into [`config.js`](./config.js) at build time.
