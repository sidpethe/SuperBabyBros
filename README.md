# Super Baby Bros. — Gender Reveal Adventure 🍄👶

A bright, joyful, Super Mario Bros.–inspired 3-level platformer built for a baby gender reveal! Players run, jump, hit golden `?` blocks, bounce on mushroom trampolines, and slide down the flagpole at the end of each world to unlock playful rhyme clues leading up to the Grand Castle Fireworks Finale.

## How to Privately Set the Baby's Gender

You have **two ways** to configure the reveal without spoiling anyone:

### Option 1: Edit `config.js` directly (Recommended before hosting)
Open [`config.js`](./config.js) in any text editor and update the top fields:
```js
window.GAME_CONFIG = {
  // 👈 Change this to "boy" or "girl"
  babyGender: "girl",

  parentsNames: "Mom & Dad",
  dueDate: "Arriving Soon!",
  // ...
};
```
- Built-in subtle riddles and playful rhymes for **both `"girl"` and `"boy"`** are included in `config.js` under `clueSets.girl` and `clueSets.boy`, and you can customize any of the poems or hints!

### Option 2: Use the in-game **⚙️ Host Setup** button (Obfuscated Share Link)
Click **⚙️ Host Setup** in the top-right bar of the game to choose **Baby Girl 💖** or **Baby Boy 💙**, enter the parents' names and due date, and copy an **encoded shareable URL** (`?reveal=...`). The query parameter is XOR+Base64 encoded so friends and family can't guess the gender by glancing at the link!

## Levels Overview
1. **World 1-1: Stork's Sunny Meadow** — Lush green hills, warp pipes, golden `?` blocks, and **Clue #1** at the flagpole.
2. **World 1-2: Starlight Nursery** — Twilight starry sky, cloud platforms, bouncy mushroom trampolines, and **Clue #2** at the flagpole.
3. **World 1-3: Rainbow Castle Finale** — Pastel sunrise sky, rainbow bridge, and the **Grand Reveal Flagpole & Castle Fireworks**!

## Running Locally
Simply open [`index.html`](./index.html) in any modern browser, or serve the folder locally:
```bash
python3 -m http.server 8080
```
Then visit `http://localhost:8080`.
