import { hsvToRgb, rgbToHex, clamp, copyText, flashCopied } from "./color.js";

const HARMONIES = {
  analogous: { name: "Analogous", hues: [-28, -14, 0, 14, 28] },
  complementary: { name: "Complementary", hues: [0, 14, 180, 194, 30] },
  triadic: { name: "Triadic", hues: [0, 12, 120, 132, 240] },
  tetradic: { name: "Tetradic", hues: [0, 90, 180, 270, 45] },
  monochromatic: { name: "Monochromatic", hues: [0, 0, 0, 0, 0] },
};

const STORAGE_KEY = "chromalab:palette";

const $ = (id) => document.getElementById(id);
const grid = $("swatchGrid");
const harmonySelect = $("harmony");
const harmonyLabel = $("harmonyLabel");
const regenerateBtn = $("regenerate");
const copyAllBtn = $("copyAll");

let harmonyKey = "analogous";
let locks = [false, false, false, false, false];
let colors = [];

function save() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ harmonyKey, locks, colors })
    );
  } catch {}
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.colors) || data.colors.length !== 5) return false;
    harmonyKey = HARMONIES[data.harmonyKey] ? data.harmonyKey : "analogous";
    locks = Array.isArray(data.locks) && data.locks.length === 5 ? data.locks : locks;
    colors = data.colors;
    return true;
  } catch {
    return false;
  }
}

function randomPalette() {
  const harmony = HARMONIES[harmonyKey];
  const baseH = Math.random() * 360;
  const baseS = 0.55 + Math.random() * 0.4;
  const baseV = 0.68 + Math.random() * 0.28;
  return harmony.hues.map((off, i) => {
    if (locks[i] && colors[i]) return colors[i];
    if (harmonyKey === "monochromatic") {
      const t = i / (harmony.hues.length - 1);
      return {
        h: baseH,
        s: clamp(baseS - t * 0.3 + 0.05, 0.2, 1),
        v: clamp(baseV - t * 0.45 + 0.12, 0.22, 1),
      };
    }
    const jitter = (i % 2 === 0 ? 1 : -1) * (Math.random() * 0.1);
    return {
      h: (baseH + off + 360) % 360,
      s: clamp(baseS + jitter, 0.3, 1),
      v: clamp(baseV + ((i % 3) - 1) * 0.07, 0.35, 1),
    };
  });
}

function toHex(hsv) {
  return rgbToHex(...hsvToRgb(hsv.h, hsv.s, hsv.v));
}

// ---------- DOM ----------

const swatches = [];
for (let i = 0; i < 5; i++) {
  const el = document.createElement("div");
  el.className = "swatch";
  el.innerHTML = `
    <button class="swatch-color" type="button" aria-label="Copy color"></button>
    <div class="swatch-meta">
      <span class="swatch-hex"></span>
      <span class="swatch-actions">
        <button class="mini-btn lock-btn" type="button">Lock</button>
        <button class="mini-btn copy-btn" type="button">Copy</button>
      </span>
    </div>`;
  grid.appendChild(el);
  swatches.push(el);

  const colorBtn = el.querySelector(".swatch-color");
  const copyBtn = el.querySelector(".copy-btn");
  const lockBtn = el.querySelector(".lock-btn");

  colorBtn.addEventListener("click", async () => {
    await copyText(colors[i].hex);
    flashCopied(copyBtn);
  });
  copyBtn.addEventListener("click", async () => {
    await copyText(colors[i].hex);
    flashCopied(copyBtn);
  });
  lockBtn.addEventListener("click", () => {
    locks[i] = !locks[i];
    renderLock(i);
    save();
  });
}

function renderLock(i) {
  swatches[i].classList.toggle("locked", locks[i]);
  swatches[i].querySelector(".lock-btn").textContent = locks[i] ? "Locked" : "Lock";
}

function render() {
  colors.forEach((c, i) => {
    const hex = toHex(c);
    c.hex = hex;
    swatches[i].querySelector(".swatch-color").style.background = hex;
    swatches[i].querySelector(".swatch-hex").textContent = hex;
    renderLock(i);
  });
  harmonyLabel.textContent = `${HARMONIES[harmonyKey].name} harmony · 5 swatches`;
}

function regenerate() {
  colors = randomPalette();
  render();
  save();
}

harmonySelect.addEventListener("change", () => {
  harmonyKey = harmonySelect.value;
  regenerate();
});

regenerateBtn.addEventListener("click", regenerate);

copyAllBtn.addEventListener("click", async () => {
  const css = `:root {\n${colors
    .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
    .join("\n")}\n}`;
  await copyText(css);
  flashCopied(copyAllBtn);
});

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (e.code === "Space" && !["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag)) {
    e.preventDefault();
    regenerate();
  }
});

// ---------- init ----------

harmonySelect.value = harmonyKey;
if (!load()) regenerate();
else render();
