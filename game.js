/**
 * Super Starlight Bros. — 3-World Mystery Platformer
 * Pure HTML5 Canvas + Web Audio API + Native <dialog> Modals
 * (Reveals that the game is a Baby Gender Reveal only upon unlocking Clue #2!)
 */

(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // 1. Light-Dismiss <dialog> Fallback (per modern-web-guidance)
  // ---------------------------------------------------------------------------
  const allDialogs = document.querySelectorAll("dialog");
  if (!("closedBy" in HTMLDialogElement.prototype)) {
    allDialogs.forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Environment-Driven Configuration (via config.js generated from BABY_GENDER)
  // ---------------------------------------------------------------------------
  const defaultConfig = window.GAME_CONFIG || {};
  const stateConfig = {
    babyGender: (defaultConfig.babyGender || "girl").toLowerCase() === "boy" ? "boy" : "girl",
    soundEnabled: defaultConfig.soundEnabledByDefault !== false,
    clueSets: defaultConfig.clueSets
  };

  // ---------------------------------------------------------------------------
  // 3. Retro Web Audio Synthesizer
  // ---------------------------------------------------------------------------
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = stateConfig.soundEnabled;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }

    tone(freq, type, duration, startTime = 0, vol = 0.14, slideTo = null) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const t0 = this.ctx.currentTime + startTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
      }
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration);
    }

    jump() {
      this.tone(260, "square", 0.18, 0, 0.1, 580);
    }

    trampoline() {
      this.tone(220, "sine", 0.28, 0, 0.16, 880);
    }

    coin() {
      this.tone(987.77, "square", 0.07, 0, 0.1);
      this.tone(1318.51, "square", 0.22, 0.07, 0.1);
    }

    blockBump() {
      this.tone(160, "triangle", 0.09, 0, 0.15, 110);
    }

    powerupAppear() {
      const notes = [330, 392, 659, 523, 587, 784];
      notes.forEach((n, i) => this.tone(n, "square", 0.08, i * 0.055, 0.09));
    }

    stomp() {
      this.tone(400, "triangle", 0.12, 0, 0.14, 160);
      this.tone(600, "sine", 0.12, 0.06, 0.1, 900);
    }

    levelClear() {
      const melody = [
        [523.25, 0.12],
        [659.25, 0.12],
        [783.99, 0.12],
        [1046.5, 0.22],
        [783.99, 0.12],
        [1046.5, 0.38]
      ];
      let offset = 0;
      melody.forEach(([freq, dur]) => {
        this.tone(freq, "square", dur, offset, 0.11);
        offset += dur * 0.95;
      });
    }

    grandFinale() {
      const fanfare = [
        [523.25, 0.13],
        [659.25, 0.13],
        [783.99, 0.13],
        [1046.5, 0.18],
        [987.77, 0.13],
        [1046.5, 0.18],
        [1174.66, 0.18],
        [1318.51, 0.45]
      ];
      let offset = 0;
      fanfare.forEach(([freq, dur]) => {
        this.tone(freq, "triangle", dur, offset, 0.15);
        this.tone(freq * 0.5, "square", dur, offset, 0.07);
        offset += dur * 0.95;
      });
    }

    fireworkPop() {
      this.tone(180 + Math.random() * 160, "sawtooth", 0.16, 0, 0.06, 55);
    }
  }

  const sfx = new SoundFX();

  // ---------------------------------------------------------------------------
  // 4. Level Definitions (3 Vibrant Worlds — Spoiler-Free Names!)
  // ---------------------------------------------------------------------------
  const TILE = 40; // 40px tile grid; canvas is 960x540 (24x13.5 tiles visible)

  const LEVEL_THEMES = [
    {
      id: "1-1",
      name: "World 1-1: Sunny Meadow",
      progressHue: 45,
      skyTop: "#38b6ff",
      skyBottom: "#c4f0ff",
      hillColor1: "#52b788",
      hillColor2: "#74c69d",
      groundTop: "#40916c",
      groundDirt: "#b07d4f",
      brickColor: "#e07a5f"
    },
    {
      id: "1-2",
      name: "World 1-2: Starlight Cavern",
      progressHue: 265,
      skyTop: "#1d1e4e",
      skyBottom: "#5e548e",
      hillColor1: "#4a4e69",
      hillColor2: "#6c757d",
      groundTop: "#9f86c0",
      groundDirt: "#483d58",
      brickColor: "#be95c4",
      hasStars: true
    },
    {
      id: "1-3",
      name: "World 1-3: Rainbow Castle Finale",
      progressHue: 330,
      skyTop: "#ff9ebb",
      skyBottom: "#fff1c1",
      hillColor1: "#ff85a1",
      hillColor2: "#70d6ff",
      groundTop: "#ffbe0b",
      groundDirt: "#9b5de5",
      brickColor: "#f15bb5",
      hasRainbow: true
    }
  ];

  function buildLevelData(levelIndex) {
    const blocks = [];
    const coins = [];
    const critters = [];
    const clouds = [];

    const lengthTiles = 92;
    const groundY = 11 * TILE;

    for (let i = 0; i < 22; i++) {
      clouds.push({
        x: i * 190 + (i % 3) * 40,
        y: 50 + (i % 4) * 42,
        scale: 0.75 + (i % 3) * 0.22
      });
    }

    const gapRanges =
      levelIndex === 0
        ? [
            [28, 30],
            [56, 58]
          ]
        : levelIndex === 1
          ? [
              [24, 27],
              [48, 51],
              [67, 69]
            ]
          : [
              [26, 29],
              [52, 55]
            ];

    const isGap = (tx) => gapRanges.some(([a, b]) => tx >= a && tx <= b);

    for (let tx = 0; tx < lengthTiles; tx++) {
      if (!isGap(tx)) {
        blocks.push({
          x: tx * TILE,
          y: groundY,
          w: TILE,
          h: 3 * TILE,
          type: "ground"
        });
      }
    }

    gapRanges.forEach(([startTx, endTx]) => {
      const midX = ((startTx + endTx) / 2) * TILE;
      blocks.push({
        x: midX - TILE * 0.5,
        y: groundY - TILE * 1.5,
        w: TILE * 2,
        h: TILE * 0.6,
        type: "cloud"
      });
      for (let i = -1; i <= 1; i++) {
        coins.push({
          x: midX + i * 36 + 18,
          y: groundY - TILE * 3.2 - (1 - Math.abs(i)) * 18,
          collected: false,
          bobOffset: i
        });
      }
    });

    const addBlockRow = (startTx, ty, pattern) => {
      for (let i = 0; i < pattern.length; i++) {
        const ch = pattern[i];
        const bx = (startTx + i) * TILE;
        const by = ty * TILE;
        if (ch === "B") {
          blocks.push({ x: bx, y: by, w: TILE, h: TILE, type: "brick", bumpY: 0 });
        } else if (ch === "?" || ch === "S") {
          blocks.push({
            x: bx,
            y: by,
            w: TILE,
            h: TILE,
            type: "qblock",
            content: ch === "S" ? "star" : "coin",
            hit: false,
            bumpY: 0
          });
        }
      }
    };

    const addPipe = (tx, heightTiles = 2) => {
      blocks.push({
        x: tx * TILE,
        y: groundY - heightTiles * TILE,
        w: TILE * 1.8,
        h: heightTiles * TILE,
        type: "pipe"
      });
    };

    const addTrampoline = (tx, ty = 10) => {
      blocks.push({
        x: tx * TILE,
        y: ty * TILE,
        w: TILE * 1.2,
        h: TILE,
        type: "trampoline",
        bounceAnim: 0
      });
    };

    const addCoins = (startTx, ty, count) => {
      for (let i = 0; i < count; i++) {
        coins.push({
          x: (startTx + i) * TILE + TILE / 2,
          y: ty * TILE + TILE / 2,
          collected: false,
          bobOffset: i * 0.7
        });
      }
    };

    const addCritter = (tx, minTx, maxTx) => {
      critters.push({
        x: tx * TILE,
        y: groundY - 34,
        w: 34,
        h: 34,
        vx: -1.1,
        minX: minTx * TILE,
        maxX: maxTx * TILE,
        alive: true,
        squishedTimer: 0
      });
    };

    if (levelIndex === 0) {
      addBlockRow(8, 7, "B?B?B");
      addCoins(8, 5, 5);
      addPipe(16, 2);
      addCritter(21, 18, 26);

      addBlockRow(21, 7, "?S?");
      addBlockRow(33, 7, "B?B");
      addBlockRow(35, 4, "???");
      addCoins(35, 2, 3);

      addPipe(42, 2);
      addCritter(46, 44, 53);
      addTrampoline(49, 10);
      addCoins(49, 5, 4);

      addBlockRow(61, 7, "B?S?B");
      addCoins(62, 5, 3);
      addCritter(67, 62, 72);
    } else if (levelIndex === 1) {
      addBlockRow(7, 7, "?B?S?");
      addTrampoline(14, 10);
      addCoins(14, 5, 5);

      blocks.push({ x: 18 * TILE, y: 6 * TILE, w: TILE * 3, h: TILE * 0.6, type: "cloud" });
      addCoins(18, 4, 3);

      addBlockRow(30, 7, "B?B?B");
      addCritter(34, 29, 39);
      addTrampoline(40, 10);
      blocks.push({ x: 43 * TILE, y: 5 * TILE, w: TILE * 3, h: TILE * 0.6, type: "cloud" });
      addBlockRow(44, 2, "S");

      addPipe(54, 2);
      addCritter(59, 56, 65);
      addBlockRow(58, 7, "???");
      addCoins(58, 5, 3);

      addTrampoline(71, 10);
      addCoins(71, 6, 3);
    } else {
      addBlockRow(7, 7, "??S??");
      addCoins(7, 5, 5);
      addTrampoline(14, 10);
      blocks.push({ x: 17 * TILE, y: 5.5 * TILE, w: TILE * 4, h: TILE * 0.6, type: "cloud" });
      addCoins(17, 4, 4);

      addPipe(23, 2);
      addBlockRow(31, 7, "B?B?B");
      addBlockRow(32, 4, "?S?");
      addCritter(37, 31, 42);

      addTrampoline(44, 10);
      blocks.push({ x: 47 * TILE, y: 6 * TILE, w: TILE * 3, h: TILE * 0.6, type: "cloud" });
      addCoins(47, 4, 3);

      addBlockRow(58, 7, "?????");
      addCoins(58, 5, 5);
      addCritter(65, 58, 71);
    }

    // Classic Staircase leading to the Flagpole
    for (let step = 0; step < 5; step++) {
      for (let h = 0; h <= step; h++) {
        blocks.push({
          x: (74 + step) * TILE,
          y: groundY - (h + 1) * TILE,
          w: TILE,
          h: TILE,
          type: "stair"
        });
      }
    }

    const flagpole = {
      x: 83 * TILE,
      y: groundY - 8 * TILE,
      height: 8 * TILE,
      flagY: groundY - 7.5 * TILE,
      reached: false
    };

    const castle = {
      x: 86.5 * TILE,
      y: groundY - 4.5 * TILE,
      w: 4.5 * TILE,
      h: 4.5 * TILE
    };

    return {
      theme: LEVEL_THEMES[levelIndex],
      lengthPx: lengthTiles * TILE,
      groundY,
      blocks,
      coins,
      critters,
      clouds,
      flagpole,
      castle
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Game State & Entities
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  const keys = {
    left: false,
    right: false,
    jumpPressed: false,
    jumpHeld: false
  };

  let currentLevelIndex = 0;
  let level = buildLevelData(0);
  let totalCoins = 0;
  const unlockedClues = [false, false, false];
  let playerGuess = null; // null until player guesses 'boy' or 'girl' at the end of Level 3
  let gameStarted = false;
  let toastTimer = null;

  const player = {
    x: 3 * TILE,
    y: 8 * TILE,
    w: 32,
    h: 40,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    coyoteTimer: 0,
    jumpBuffer: 0,
    invincibleTimer: 0,
    starBoostTimer: 0,
    lastSafeX: 3 * TILE,
    lastSafeY: 8 * TILE,
    state: "play",
    animFrame: 0
  };

  let cameraX = 0;
  const particles = [];
  const powerups = [];
  let fireworkTimer = 0;

  // ---------------------------------------------------------------------------
  // 6. UI & HUD Synchronization (Secret kept until Clue #2 is unlocked!)
  // ---------------------------------------------------------------------------
  const elQuestPill = document.getElementById("hud-quest-pill");
  const elWorld = document.getElementById("hud-world");
  const elCoins = document.getElementById("hud-coins");
  const elClueSlots = document.querySelectorAll(".clue-slot");
  const elOverlay = document.getElementById("title-overlay");
  const elLevelBanner = document.getElementById("level-name-banner");
  const elLevelProgress = document.getElementById("level-progress");
  const elToast = document.getElementById("level-toast");

  const clueDialog = document.getElementById("clue-dialog");
  const elClueBadge = document.getElementById("clue-dialog-badge");
  const elClueTitle = document.getElementById("clue-dialog-title");
  const elGuessResultPill = document.getElementById("guess-result-pill");
  const elFinaleBox = document.getElementById("finale-headline-box");
  const elFinaleHeadline = document.getElementById("finale-headline");
  const elClueRiddle = document.getElementById("clue-dialog-riddle");
  const elClueNote = document.getElementById("clue-dialog-note");
  const elGuessChoiceBox = document.getElementById("guess-choice-box");
  const elClueDialogForm = document.getElementById("clue-dialog-form");
  const btnNextLevel = document.getElementById("btn-next-level");

  const helpDialog = document.getElementById("help-dialog");

  function isGenderRevealSecretOut() {
    return unlockedClues[1] || unlockedClues[2];
  }

  function isFinalAnswerRevealed() {
    return unlockedClues[2] && playerGuess !== null;
  }

  function syncHudText() {
    elWorld.textContent = level.theme.id;
    elCoins.textContent = `🪙 ${totalCoins}`;
    elLevelBanner.textContent = level.theme.name;
    elLevelProgress.style.setProperty("--progress-hue", String(level.theme.progressHue));

    // Only mention "Gender Reveal" in the top badge AFTER Level 2's clue is unlocked!
    if (isGenderRevealSecretOut()) {
      elQuestPill.textContent = "👶 Gender Reveal Quest!";
      elQuestPill.classList.add("revealed-mode");
    } else {
      elQuestPill.textContent = "Mystery Quest";
      elQuestPill.classList.remove("revealed-mode");
    }

    elClueSlots.forEach((btn, idx) => {
      if (unlockedClues[idx]) {
        btn.disabled = false;
        btn.classList.add("unlocked");
        if (idx === 2) {
          btn.textContent = playerGuess ? "👑 3" : "❓ 3";
        } else {
          btn.textContent = `📜 ${idx + 1}`;
        }
        btn.setAttribute("aria-label", `View Clue ${idx + 1} (Unlocked)`);
      } else {
        btn.disabled = true;
        btn.classList.remove("unlocked");
        btn.textContent = `🔒 ${idx + 1}`;
        btn.setAttribute("aria-label", `View Clue ${idx + 1} (Locked)`);
      }
    });
  }

  function showToast(msg, durationMs = 2600) {
    elToast.textContent = msg;
    elToast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elToast.hidden = true;
    }, durationMs);
  }

  function loadLevel(idx) {
    currentLevelIndex = idx;
    level = buildLevelData(idx);
    player.x = 3 * TILE;
    player.y = 8 * TILE;
    player.vx = 0;
    player.vy = 0;
    player.facing = 1;
    player.onGround = false;
    player.state = "play";
    player.lastSafeX = player.x;
    player.lastSafeY = player.y;
    cameraX = 0;
    particles.length = 0;
    powerups.length = 0;
    syncHudText();
    showToast(`✨ ${level.theme.name} ✨`, 2500);
  }

  // ---------------------------------------------------------------------------
  // 7. Clue & Finale Modal Presentation
  // ---------------------------------------------------------------------------
  function getActiveClueSet() {
    const sets = stateConfig.clueSets || {};
    return stateConfig.babyGender === "boy" ? sets.boy : sets.girl;
  }

  function openClueModal(levelIdx) {
    const clueSet = getActiveClueSet();
    const key = `level${levelIdx + 1}`;
    const data = clueSet[key];
    if (!data) return;

    if (levelIdx === 0) {
      // Level 1: Pure mystery riddle — no mention of gender reveal!
      elClueBadge.textContent = data.badge;
      elClueTitle.textContent = data.title;
      elClueRiddle.textContent = data.riddle;
      elGuessResultPill.hidden = true;
      elFinaleBox.hidden = true;
      elGuessChoiceBox.hidden = true;
      elClueDialogForm.hidden = false;
      elClueNote.textContent = data.hintNote || "";
      btnNextLevel.textContent = "Continue to World 1-2 ▶";
    } else if (levelIdx === 1) {
      // Level 2: The Big Plot Twist! Reveal that this game is a Gender Reveal + Clue #2!
      elClueBadge.textContent = data.badge;
      elClueTitle.textContent = data.title;
      elClueRiddle.textContent = data.riddle;
      elGuessResultPill.hidden = true;
      elFinaleBox.hidden = false;
      elFinaleBox.className = "finale-headline-box theme-twist";
      elFinaleHeadline.textContent = data.twistHeadline || "🎉 SURPRISE! IT'S A GENDER REVEAL! 👶";
      elGuessChoiceBox.hidden = true;
      elClueDialogForm.hidden = false;
      elClueNote.textContent = data.hintNote || "";
      btnNextLevel.textContent = "Storm the Rainbow Castle (World 1-3) ▶";
    } else if (playerGuess === null) {
      // Level 3 (Step 1): Ask the player to guess Boy or Girl before revealing!
      elClueBadge.textContent = "Rainbow Castle Gate — Make Your Guess!";
      elClueTitle.textContent = "Boy or Girl? What's Your Prediction?";
      elGuessResultPill.hidden = true;
      elFinaleBox.hidden = true;
      elClueRiddle.textContent =
        "You've gathered two clues on your journey today,\n" +
        "Now the Rainbow Castle is ready to say!\n" +
        "Before the fireworks light up the sky,\n" +
        "Who do you think is about to say 'Hi'?";
      elClueNote.textContent = "Lock in your final guess below to launch the fireworks and reveal the answer!";
      elGuessChoiceBox.hidden = false;
      elClueDialogForm.hidden = true;
    } else {
      // Level 3 (Step 2): The Grand Finale Answer after guessing!
      elClueBadge.textContent = data.badge;
      elClueTitle.textContent = data.title;
      elClueRiddle.textContent = data.riddle;

      const guessedCorrectly = playerGuess === stateConfig.babyGender;
      const guessedLabel = playerGuess === "boy" ? "Boy" : "Girl";
      elGuessResultPill.hidden = false;
      if (guessedCorrectly) {
        elGuessResultPill.className = "guess-result-pill is-correct";
        elGuessResultPill.textContent = `🎯 Spot On! You Guessed Baby ${guessedLabel}!`;
      } else {
        elGuessResultPill.className = "guess-result-pill is-plot-twist";
        elGuessResultPill.textContent = `😮 Plot Twist! You Guessed ${guessedLabel}, But...`;
      }

      elFinaleBox.hidden = false;
      elFinaleBox.className = `finale-headline-box theme-${stateConfig.babyGender}`;
      elFinaleHeadline.textContent =
        data.headline || (stateConfig.babyGender === "boy" ? "IT'S A BABY BOY! 💙" : "IT'S A BABY GIRL! 💖");
      elClueNote.textContent = data.celebrationSubtext || "";
      elGuessChoiceBox.hidden = true;
      elClueDialogForm.hidden = false;
      btnNextLevel.textContent = "🔄 Play All Levels Again";
    }

    if (!clueDialog.open) {
      clueDialog.showModal();
    }
  }

  function submitFinalGuess(chosenGender) {
    playerGuess = chosenGender;
    syncHudText();
    sfx.grandFinale();
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        spawnGenderFirework(
          level.castle.x + (Math.random() - 0.2) * 220,
          110 + Math.random() * 120
        );
      }, i * 320);
    }
    openClueModal(2);
  }

  document.getElementById("btn-guess-boy").addEventListener("click", () => {
    submitFinalGuess("boy");
  });

  document.getElementById("btn-guess-girl").addEventListener("click", () => {
    submitFinalGuess("girl");
  });

  clueDialog.addEventListener("close", () => {
    if (clueDialog.returnValue === "next") {
      if (currentLevelIndex < 2) {
        loadLevel(currentLevelIndex + 1);
      } else {
        // Reset secret state when restarting from World 1-1
        unlockedClues[0] = false;
        unlockedClues[1] = false;
        unlockedClues[2] = false;
        playerGuess = null;
        totalCoins = 0;
        loadLevel(0);
      }
    } else if (player.state === "celebrate" && currentLevelIndex < 2) {
      player.state = "play";
    }
  });

  elClueSlots.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.level);
      if (unlockedClues[idx]) {
        openClueModal(idx);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Controls (Keyboard, Touch, & UI Buttons)
  // ---------------------------------------------------------------------------
  window.addEventListener("keydown", (e) => {
    if (clueDialog.open || helpDialog.open) return;

    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      keys.left = true;
    } else if (e.code === "ArrowRight" || e.code === "KeyD") {
      keys.right = true;
    } else if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      if (!keys.jumpHeld) keys.jumpPressed = true;
      keys.jumpHeld = true;
      if (!gameStarted) startGame();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      keys.left = false;
    } else if (e.code === "ArrowRight" || e.code === "KeyD") {
      keys.right = false;
    } else if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      keys.jumpHeld = false;
    }
  });

  function bindTouchButton(id, onDown, onUp) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const press = (e) => {
      e.preventDefault();
      btn.classList.add("is-pressed");
      if (!gameStarted) startGame();
      onDown();
    };
    const release = (e) => {
      e.preventDefault();
      btn.classList.remove("is-pressed");
      onUp();
    };
    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointerleave", release);
    btn.addEventListener("pointercancel", release);
  }

  bindTouchButton(
    "touch-left",
    () => {
      keys.left = true;
    },
    () => {
      keys.left = false;
    }
  );

  bindTouchButton(
    "touch-right",
    () => {
      keys.right = true;
    },
    () => {
      keys.right = false;
    }
  );

  bindTouchButton(
    "touch-jump",
    () => {
      keys.jumpPressed = true;
      keys.jumpHeld = true;
    },
    () => {
      keys.jumpHeld = false;
    }
  );

  function startGame() {
    gameStarted = true;
    elOverlay.hidden = true;
    sfx.init();
    showToast(`✨ ${level.theme.name} — Reach the Flagpole! ✨`);
  }

  document.getElementById("btn-start-game").addEventListener("click", () => {
    startGame();
  });

  const btnSound = document.getElementById("btn-sound");
  btnSound.addEventListener("click", () => {
    sfx.enabled = !sfx.enabled;
    btnSound.setAttribute("aria-pressed", String(sfx.enabled));
    btnSound.textContent = sfx.enabled ? "🔊 Sound" : "🔇 Muted";
  });

  document.getElementById("btn-help").addEventListener("click", () => {
    helpDialog.showModal();
  });

  // ---------------------------------------------------------------------------
  // 9. Particles & Celebration Fireworks
  // ---------------------------------------------------------------------------
  function spawnSparkles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 3.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 32 + Math.random() * 16,
        maxLife: 48,
        color,
        size: 4 + Math.random() * 4,
        kind: "spark"
      });
    }
  }

  function spawnFloatingText(x, y, text, color = "#ffbe0b") {
    particles.push({
      x,
      y,
      vx: 0,
      vy: -1.3,
      life: 45,
      maxLife: 45,
      text,
      color,
      kind: "text"
    });
  }

  function spawnGenderFirework(x, y) {
    const isBoy = stateConfig.babyGender === "boy";
    const palette = isBoy
      ? ["#00bbf9", "#4cc9f0", "#3a86ff", "#ffbe0b", "#ffffff"]
      : ["#ff4d8d", "#ff85a1", "#ffbe0b", "#f15bb5", "#ffffff"];

    sfx.fireworkPop();
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.2;
      const speed = 2 + Math.random() * 4.8;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 55 + Math.random() * 25,
        maxLife: 80,
        color: palette[i % palette.length],
        size: 5 + Math.random() * 4,
        kind: "spark"
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 10. Physics & Collision Update Loop
  // ---------------------------------------------------------------------------
  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function triggerQuestionBlock(block) {
    if (block.hit) {
      sfx.blockBump();
      return;
    }
    block.hit = true;
    block.bumpY = -10;
    if (block.content === "coin") {
      totalCoins += 1;
      sfx.coin();
      spawnSparkles(block.x + TILE / 2, block.y, "#ffbe0b", 10);
      spawnFloatingText(block.x + TILE / 2, block.y - 12, "+1 🪙", "#ffbe0b");
      syncHudText();
    } else if (block.content === "star") {
      sfx.powerupAppear();
      powerups.push({
        x: block.x + 4,
        y: block.y - 34,
        w: 32,
        h: 32,
        vx: 1.6,
        vy: -4
      });
      spawnFloatingText(block.x + TILE / 2, block.y - 18, "⭐ Super Star!", "#ffbe0b");
    }
  }

  function updatePlayerPlayState() {
    const maxSpeed = player.starBoostTimer > 0 ? 5.6 : 4.3;
    const accel = player.onGround ? 0.55 : 0.38;
    const friction = player.onGround ? 0.8 : 0.9;

    if (keys.left) {
      player.vx = Math.max(player.vx - accel, -maxSpeed);
      player.facing = -1;
    } else if (keys.right) {
      player.vx = Math.min(player.vx + accel, maxSpeed);
      player.facing = 1;
    } else {
      player.vx *= friction;
      if (Math.abs(player.vx) < 0.08) player.vx = 0;
    }

    if (player.onGround) {
      player.coyoteTimer = 8;
    } else if (player.coyoteTimer > 0) {
      player.coyoteTimer--;
    }

    if (keys.jumpPressed) {
      player.jumpBuffer = 8;
      keys.jumpPressed = false;
    } else if (player.jumpBuffer > 0) {
      player.jumpBuffer--;
    }

    if (player.jumpBuffer > 0 && player.coyoteTimer > 0) {
      player.vy = player.starBoostTimer > 0 ? -12.6 : -11.4;
      player.onGround = false;
      player.coyoteTimer = 0;
      player.jumpBuffer = 0;
      sfx.jump();
      spawnSparkles(player.x + player.w / 2, player.y + player.h, "#ffffff", 5);
    }

    if (!keys.jumpHeld && player.vy < -4.5) {
      player.vy *= 0.85;
    }

    player.vy = Math.min(player.vy + 0.52, 12);

    player.x += player.vx;
    if (player.x < 0) {
      player.x = 0;
      player.vx = 0;
    }

    for (const b of level.blocks) {
      if (b.type === "cloud") continue;
      if (aabb(player, b)) {
        if (player.vx > 0) {
          player.x = b.x - player.w;
          player.vx = 0;
        } else if (player.vx < 0) {
          player.x = b.x + b.w;
          player.vx = 0;
        }
      }
    }

    const prevBottom = player.y + player.h;
    player.y += player.vy;
    player.onGround = false;

    for (const b of level.blocks) {
      if (b.type === "cloud") {
        if (
          player.vy >= 0 &&
          prevBottom <= b.y + 8 &&
          player.x + player.w > b.x + 4 &&
          player.x < b.x + b.w - 4 &&
          player.y + player.h >= b.y &&
          player.y + player.h <= b.y + b.h + 12
        ) {
          player.y = b.y - player.h;
          player.vy = 0;
          player.onGround = true;
        }
        continue;
      }

      if (aabb(player, b)) {
        if (player.vy > 0) {
          player.y = b.y - player.h;
          if (b.type === "trampoline") {
            player.vy = -15.2;
            b.bounceAnim = 10;
            sfx.trampoline();
            spawnSparkles(b.x + b.w / 2, b.y, "#ff4d8d", 12);
          } else {
            player.vy = 0;
            player.onGround = true;
            if (b.type === "ground" || b.type === "pipe" || b.type === "stair") {
              player.lastSafeX = player.x;
              player.lastSafeY = player.y;
            }
          }
        } else if (player.vy < 0) {
          player.y = b.y + b.h;
          player.vy = 1.5;
          if (b.type === "qblock") {
            triggerQuestionBlock(b);
          } else if (b.type === "brick") {
            b.bumpY = -8;
            sfx.blockBump();
          }
        }
      }
    }

    // Friendly Cloud Rescue if player falls below screen (spoiler-free!)
    if (player.y > canvas.height + 60) {
      player.x = player.lastSafeX;
      player.y = player.lastSafeY - 30;
      player.vx = 0;
      player.vy = -4;
      player.invincibleTimer = 60;
      showToast("☁️ Friendly Cloud lifted you back up! Keep going!");
      spawnSparkles(player.x + player.w / 2, player.y + player.h / 2, "#38b6ff", 14);
    }

    // Collect Coins
    for (const c of level.coins) {
      if (!c.collected) {
        const dx = player.x + player.w / 2 - c.x;
        const dy = player.y + player.h / 2 - c.y;
        if (dx * dx + dy * dy < 28 * 28) {
          c.collected = true;
          totalCoins += 1;
          sfx.coin();
          spawnSparkles(c.x, c.y, "#ffbe0b", 8);
          syncHudText();
        }
      }
    }

    // Collect Power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.vy = Math.min(p.vy + 0.4, 8);
      p.x += p.vx;
      p.y += p.vy;
      for (const b of level.blocks) {
        if (aabb(p, b)) {
          if (p.vy > 0 && p.y + p.h - p.vy <= b.y + 8) {
            p.y = b.y - p.h;
            p.vy = -5.5;
          } else {
            p.vx *= -1;
          }
        }
      }
      if (aabb(player, p)) {
        powerups.splice(i, 1);
        player.starBoostTimer = 360;
        totalCoins += 5;
        sfx.levelClear();
        spawnFloatingText(player.x + player.w / 2, player.y - 10, "⭐ STAR BOOST! +5 🪙", "#ffbe0b");
        syncHudText();
      }
    }

    // Critters Interaction
    for (const cr of level.critters) {
      if (!cr.alive) {
        if (cr.squishedTimer > 0) cr.squishedTimer--;
        continue;
      }
      cr.x += cr.vx;
      if (cr.x < cr.minX || cr.x > cr.maxX) cr.vx *= -1;

      if (aabb(player, cr)) {
        if (player.vy > 0 && player.y + player.h - player.vy <= cr.y + 18) {
          cr.alive = false;
          cr.squishedTimer = 35;
          player.vy = -9.5;
          totalCoins += 2;
          sfx.stomp();
          spawnSparkles(cr.x + cr.w / 2, cr.y, "#ffbe0b", 10);
          spawnFloatingText(cr.x + cr.w / 2, cr.y - 10, "BOING! +2 🪙", "#2dc653");
          syncHudText();
        } else if (player.invincibleTimer <= 0 && player.starBoostTimer <= 0) {
          player.vy = -6.5;
          player.vx = player.x < cr.x ? -4 : 4;
          player.invincibleTimer = 50;
          sfx.blockBump();
        } else if (player.starBoostTimer > 0) {
          cr.alive = false;
          cr.squishedTimer = 35;
          totalCoins += 2;
          sfx.stomp();
          syncHudText();
        }
      }
    }

    // Check Flagpole Reach!
    const fp = level.flagpole;
    if (!fp.reached && player.x + player.w >= fp.x - 6 && player.x <= fp.x + 20 && player.y + player.h >= fp.y) {
      fp.reached = true;
      player.state = "flagSlide";
      player.x = fp.x - player.w / 2;
      player.vx = 0;
      player.vy = 0;
      sfx.levelClear();
      spawnSparkles(fp.x, player.y, "#ffbe0b", 22);
    }

    if (player.invincibleTimer > 0) player.invincibleTimer--;
    if (player.starBoostTimer > 0) {
      player.starBoostTimer--;
      if (player.starBoostTimer % 4 === 0) {
        spawnSparkles(player.x + player.w / 2, player.y + player.h / 2, "#ffbe0b", 1);
      }
    }

    if (Math.abs(player.vx) > 0.2) {
      player.animFrame += 0.18;
    } else {
      player.animFrame = 0;
    }
  }

  function updateFlagSequence() {
    const fp = level.flagpole;
    const flagBottom = level.groundY - TILE;

    if (player.state === "flagSlide") {
      player.y = Math.min(player.y + 4.2, level.groundY - player.h);
      fp.flagY = Math.min(fp.flagY + 4.2, flagBottom);
      if (player.y >= level.groundY - player.h && fp.flagY >= flagBottom) {
        player.state = "walkToCastle";
        player.facing = 1;
      }
    } else if (player.state === "walkToCastle") {
      const targetX = level.castle.x + level.castle.w / 2 - player.w / 2;
      player.x += 3.2;
      player.animFrame += 0.2;
      if (player.x >= targetX) {
        player.x = targetX;
        player.state = "celebrate";
        unlockedClues[currentLevelIndex] = true;
        syncHudText();
        spawnSparkles(level.castle.x + level.castle.w / 2, level.castle.y + 40, "#ffbe0b", 28);
        setTimeout(() => openClueModal(currentLevelIndex), 450);
      }
    } else if (player.state === "celebrate" && currentLevelIndex === 2 && isFinalAnswerRevealed()) {
      fireworkTimer++;
      if (fireworkTimer % 42 === 0) {
        spawnGenderFirework(
          cameraX + 180 + Math.random() * (canvas.width - 360),
          80 + Math.random() * 160
        );
      }
    }
  }

  function update() {
    for (const b of level.blocks) {
      if (b.bumpY && b.bumpY < 0) {
        b.bumpY = Math.min(0, b.bumpY + 1.5);
      }
      if (b.bounceAnim && b.bounceAnim > 0) {
        b.bounceAnim--;
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      if (pt.kind === "spark") pt.vy += 0.12;
      pt.life--;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    if (!gameStarted) return;

    if (player.state === "play") {
      updatePlayerPlayState();
    } else {
      updateFlagSequence();
    }

    const targetCam = player.x - canvas.width * 0.35;
    const maxCam = level.lengthPx - canvas.width;
    cameraX += (Math.max(0, Math.min(targetCam, maxCam)) - cameraX) * 0.14;

    const pct = Math.min(100, Math.max(0, Math.round((player.x / level.flagpole.x) * 100)));
    elLevelProgress.value = pct;
  }

  // ---------------------------------------------------------------------------
  // 11. Bright Nintendo-Style Canvas Rendering
  // ---------------------------------------------------------------------------
  function drawBackground(theme, time) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, theme.skyTop);
    grad.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (theme.hasStars) {
      ctx.fillStyle = "#fff9db";
      for (let i = 0; i < 45; i++) {
        const sx = ((i * 173 - cameraX * 0.15) % canvas.width + canvas.width) % canvas.width;
        const sy = (i * 67) % 300;
        const r = 1.5 + Math.sin(time * 0.004 + i) * 1.1;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.arc(820, 85, 36, 0, Math.PI * 2);
      ctx.fill();
    }

    if (theme.hasRainbow) {
      const rainbowColors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];
      ctx.save();
      ctx.globalAlpha = 0.35;
      rainbowColors.forEach((col, idx) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(canvas.width * 0.5, canvas.height + 60, 460 - idx * 14, Math.PI, 0);
        ctx.stroke();
      });
      ctx.restore();
    }

    for (let i = 0; i < 12; i++) {
      const hx = i * 340 - ((cameraX * 0.35) % 340);
      ctx.fillStyle = i % 2 === 0 ? theme.hillColor1 : theme.hillColor2;
      ctx.beginPath();
      ctx.arc(hx + 120, level.groundY + 20, 150, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "#1f2438";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    level.clouds.forEach((cl) => {
      const cx = cl.x - cameraX * 0.5;
      if (cx < -150 || cx > canvas.width + 150) return;
      ctx.save();
      ctx.translate(cx, cl.y);
      ctx.scale(cl.scale, cl.scale);
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.arc(22, -8, 28, 0, Math.PI * 2);
      ctx.arc(48, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1f2438";
      ctx.beginPath();
      ctx.arc(16, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(30, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawBlocks(theme, time) {
    for (const b of level.blocks) {
      if (b.x + b.w < cameraX - 40 || b.x > cameraX + canvas.width + 40) continue;
      const bx = b.x - cameraX;
      const by = b.y + (b.bumpY || 0);

      if (b.type === "ground") {
        ctx.fillStyle = theme.groundDirt;
        ctx.fillRect(bx, by, b.w, b.h);
        ctx.fillStyle = theme.groundTop;
        ctx.fillRect(bx, by, b.w, 12);
        ctx.strokeStyle = "#1f2438";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, b.w, b.h);
      } else if (b.type === "brick") {
        ctx.fillStyle = theme.brickColor;
        ctx.fillRect(bx, by, b.w, b.h);
        ctx.strokeStyle = "#1f2438";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx + 1, by + 1, b.w - 2, b.h - 2);
        ctx.beginPath();
        ctx.moveTo(bx, by + b.h / 2);
        ctx.lineTo(bx + b.w, by + b.h / 2);
        ctx.moveTo(bx + b.w / 2, by);
        ctx.lineTo(bx + b.w / 2, by + b.h / 2);
        ctx.stroke();
      } else if (b.type === "qblock") {
        const pulse = Math.sin(time * 0.008) * 15;
        ctx.fillStyle = b.hit ? "#94a3b8" : `hsl(${45 + pulse * 0.3}, 100%, 52%)`;
        ctx.fillRect(bx, by, b.w, b.h);
        ctx.strokeStyle = "#1f2438";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx + 1, by + 1, b.w - 2, b.h - 2);
        if (!b.hit) {
          ctx.fillStyle = "#1f2438";
          ctx.font = "900 22px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("?", bx + b.w / 2, by + b.h / 2 + 1);
        }
      } else if (b.type === "pipe") {
        const pipeGrad = ctx.createLinearGradient(bx, by, bx + b.w, by);
        pipeGrad.addColorStop(0, "#2dc653");
        pipeGrad.addColorStop(0.4, "#80ed99");
        pipeGrad.addColorStop(1, "#1b8a3b");
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(bx + 4, by + 14, b.w - 8, b.h - 14);
        ctx.strokeStyle = "#1f2438";
        ctx.lineWidth = 3;
        ctx.strokeRect(bx + 4, by + 14, b.w - 8, b.h - 14);
        ctx.fillRect(bx, by, b.w, 16);
        ctx.strokeRect(bx, by, b.w, 16);
      } else if (b.type === "cloud") {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#1f2438";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(bx, by, b.w, b.h, 12);
        ctx.fill();
        ctx.stroke();
      } else if (b.type === "trampoline") {
        const sq = b.bounceAnim ? Math.sin(b.bounceAnim * 0.6) * 6 : 0;
        ctx.fillStyle = "#fff3b0";
        ctx.fillRect(bx + 14, by + 14 + sq, b.w - 28, b.h - 14 - sq);
        ctx.strokeStyle = "#1f2438";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx + 14, by + 14 + sq, b.w - 28, b.h - 14 - sq);
        ctx.fillStyle = "#ff4d8d";
        ctx.beginPath();
        ctx.roundRect(bx - 2, by + sq, b.w + 4, 18, 9);
        ctx.fill();
        ctx.stroke();
      } else if (b.type === "stair") {
        ctx.fillStyle = "#f4a261";
        ctx.fillRect(bx, by, b.w, b.h);
        ctx.strokeStyle = "#1f2438";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx + 1, by + 1, b.w - 2, b.h - 2);
      }
    }
  }

  function drawCoinsAndPowerups(time) {
    for (const c of level.coins) {
      if (c.collected) continue;
      if (c.x < cameraX - 30 || c.x > cameraX + canvas.width + 30) continue;
      const cx = c.x - cameraX;
      const cy = c.y + Math.sin(time * 0.006 + c.bobOffset) * 4;

      ctx.fillStyle = "#ffbe0b";
      ctx.strokeStyle = "#1f2438";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 11, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fff3b0";
      ctx.fillRect(cx - 2, cy - 7, 4, 14);
    }

    // Power-ups use a classic Super Star icon so nothing spoils the baby theme early!
    for (const p of powerups) {
      const px = p.x - cameraX;
      ctx.font = "28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⭐", px + p.w / 2, p.y + p.h / 2);
    }
  }

  function drawCritters(time) {
    for (const cr of level.critters) {
      if (!cr.alive && cr.squishedTimer <= 0) continue;
      if (cr.x + cr.w < cameraX - 40 || cr.x > cameraX + canvas.width + 40) continue;

      const cx = cr.x - cameraX;
      const cy = cr.y;

      ctx.save();
      if (!cr.alive) {
        ctx.translate(cx + cr.w / 2, cy + cr.h);
        ctx.scale(1.3, 0.4);
        ctx.translate(-(cx + cr.w / 2), -(cy + cr.h));
      }

      const waddle = cr.alive ? Math.sin(time * 0.015 + cr.x * 0.1) * 2.5 : 0;
      ctx.fillStyle = "#f4a261";
      ctx.strokeStyle = "#1f2438";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx + cr.w / 2, cy + cr.h / 2 + waddle, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#1f2438";
      ctx.beginPath();
      ctx.arc(cx + 11, cy + 14 + waddle, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 23, cy + 14 + waddle, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#e76f51";
      ctx.beginPath();
      ctx.ellipse(cx + 9, cy + cr.h - 2, 6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 25, cy + cr.h - 2, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFlagpoleAndCastle() {
    const fp = level.flagpole;
    const fx = fp.x - cameraX;

    ctx.strokeStyle = "#1f2438";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(fx, fp.y);
    ctx.lineTo(fx, level.groundY);
    ctx.stroke();

    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, fp.y);
    ctx.lineTo(fx, level.groundY);
    ctx.stroke();

    ctx.fillStyle = "#ffbe0b";
    ctx.strokeStyle = "#1f2438";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(fx, fp.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const isFinalRevealed = currentLevelIndex === 2 && isFinalAnswerRevealed();
    const flagColor = isFinalRevealed
      ? stateConfig.babyGender === "boy"
        ? "#00bbf9"
        : "#ff4d8d"
      : "#ffbe0b";

    ctx.fillStyle = flagColor;
    ctx.beginPath();
    ctx.moveTo(fx, fp.flagY);
    ctx.lineTo(fx - 56, fp.flagY + 20);
    ctx.lineTo(fx, fp.flagY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1f2438";
    ctx.font = "900 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isFinalRevealed ? (stateConfig.babyGender === "boy" ? "💙" : "💖") : "★", fx - 24, fp.flagY + 25);

    const cs = level.castle;
    const cx = cs.x - cameraX;
    const cy = cs.y;

    ctx.fillStyle = "#f8edeb";
    ctx.strokeStyle = "#1f2438";
    ctx.lineWidth = 3;
    ctx.fillRect(cx, cy + 40, cs.w, cs.h - 40);
    ctx.strokeRect(cx, cy + 40, cs.w, cs.h - 40);

    ctx.fillStyle = "#fcd5ce";
    ctx.fillRect(cx + 28, cy, cs.w - 56, 44);
    ctx.strokeRect(cx + 28, cy, cs.w - 56, 44);

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "#ffbe0b";
      ctx.fillRect(cx + i * (cs.w / 4) + 6, cy + 26, 26, 14);
      ctx.strokeRect(cx + i * (cs.w / 4) + 6, cy + 26, 26, 14);
    }

    ctx.fillStyle = "#2b2d42";
    ctx.beginPath();
    ctx.arc(cx + cs.w / 2, level.groundY - 34, 24, Math.PI, 0);
    ctx.lineTo(cx + cs.w / 2 + 24, level.groundY);
    ctx.lineTo(cx + cs.w / 2 - 24, level.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (isFinalRevealed) {
      const bannerColor = stateConfig.babyGender === "boy" ? "#00bbf9" : "#ff4d8d";
      const label = stateConfig.babyGender === "boy" ? "IT'S A BOY! 💙" : "IT'S A GIRL! 💖";
      ctx.fillStyle = bannerColor;
      ctx.beginPath();
      ctx.roundRect(cx - 20, cy - 58, cs.w + 40, 42, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, cx + cs.w / 2, cy - 37);
    }
  }

  function drawPlayer() {
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 4) % 2 === 1) {
      return;
    }

    const px = player.x - cameraX;
    const py = player.y;

    ctx.save();
    ctx.translate(px + player.w / 2, py + player.h / 2);
    ctx.scale(player.facing, 1);

    const stride = player.onGround ? Math.sin(player.animFrame) * 4 : 4;

    // Classic Mario-inspired Red & Blue outfit (no early pink/blue spoiler colors!)
    ctx.fillStyle = player.starBoostTimer > 0 ? "#ffbe0b" : "#2563eb";
    ctx.strokeStyle = "#1f2438";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-12, -2, 24, 18, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#7f5539";
    ctx.beginPath();
    ctx.roundRect(-12 + stride, 13, 11, 7, 3);
    ctx.roundRect(1 - stride, 13, 11, 7, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffe5d9";
    ctx.beginPath();
    ctx.arc(0, -10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Classic Red & Gold Adventurer Cap
    ctx.fillStyle = "#e63946";
    ctx.beginPath();
    ctx.arc(0, -13, 12.5, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffbe0b";
    ctx.beginPath();
    ctx.roundRect(2, -16, 15, 5, 2.5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1f2438";
    ctx.beginPath();
    ctx.arc(5, -9, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawParticles() {
    for (const pt of particles) {
      const px = pt.x - cameraX;
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      if (pt.kind === "text") {
        ctx.font = "900 17px system-ui, sans-serif";
        ctx.fillStyle = pt.color;
        ctx.strokeStyle = "#1f2438";
        ctx.lineWidth = 3;
        ctx.textAlign = "center";
        ctx.strokeText(pt.text, px, pt.y);
        ctx.fillText(pt.text, px, pt.y);
      } else {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(px, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function render(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(level.theme, time);
    drawBlocks(level.theme, time);
    drawFlagpoleAndCastle();
    drawCoinsAndPowerups(time);
    drawCritters(time);
    drawPlayer();
    drawParticles();
  }

  function loop(time) {
    update();
    render(time);
    requestAnimationFrame(loop);
  }

  syncHudText();
  requestAnimationFrame(loop);
})();
