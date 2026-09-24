import { hexToRgb, contrast, copyText, flashCopied } from "./color.js";

const $ = (id) => document.getElementById(id);

const state = { fg: "#22D3C5", bg: "#0A0F1A" };

const fgColor = $("fgColor");
const fgHex = $("fgHex");
const bgColor = $("bgColor");
const bgHex = $("bgHex");
const preview = $("preview");
const ratioEl = $("ratio");
const resultsEl = $("results");
const swapBtn = $("swapBtn");
const copyRatioBtn = $("copyRatio");

const RESULTS = [
  { label: "AA · Normal text", min: 4.5 },
  { label: "AA · Large text", min: 3 },
  { label: "AAA · Normal text", min: 7 },
  { label: "AAA · Large text", min: 4.5 },
  { label: "UI components", min: 3 },
];

function normalize(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return (
    "#" +
    rgb.map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()
  );
}

function render() {
  const fgRgb = hexToRgb(state.fg);
  const bgRgb = hexToRgb(state.bg);
  if (!fgRgb || !bgRgb) return;

  fgColor.value = state.fg;
  bgColor.value = state.bg;
  fgHex.value = state.fg;
  bgHex.value = state.bg;

  preview.style.background = state.bg;
  preview.style.color = state.fg;

  const ratio = contrast(fgRgb, bgRgb);
  ratioEl.textContent = ratio.toFixed(2);
  ratioEl.style.color = ratio >= 4.5 ? "var(--cyan)" : ratio >= 3 ? "var(--amber)" : "var(--rose)";

  resultsEl.innerHTML = RESULTS.map(
    (r) => `
    <div class="result-row glass-soft">
      <span class="result-name">${r.label}</span>
      <span class="badge ${ratio >= r.min ? "pass" : "fail"}">${ratio >= r.min ? "PASS" : "FAIL"}</span>
    </div>`
  ).join("");

  try {
    localStorage.setItem("chromalab:last", state.fg);
  } catch {}
}

function wireSide(side, colorInput, hexInput) {
  colorInput.addEventListener("input", () => {
    const v = normalize(colorInput.value);
    if (v) {
      state[side] = v;
      hexInput.classList.remove("invalid");
      render();
    }
  });
  hexInput.addEventListener("input", () => {
    const v = normalize(hexInput.value);
    if (v) {
      state[side] = v;
      hexInput.classList.remove("invalid");
      render();
    } else {
      hexInput.classList.add("invalid");
    }
  });
  hexInput.addEventListener("blur", () => render());
  hexInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") hexInput.blur();
  });
}

wireSide("fg", fgColor, fgHex);
wireSide("bg", bgColor, bgHex);

swapBtn.addEventListener("click", () => {
  [state.fg, state.bg] = [state.bg, state.fg];
  render();
});

copyRatioBtn.addEventListener("click", async () => {
  await copyText(`${state.fg} on ${state.bg} — ${ratioEl.textContent}:1 contrast ratio`);
  flashCopied(copyRatioBtn);
});

// ---------- init ----------

try {
  const last = localStorage.getItem("chromalab:last");
  const v = last && normalize(last);
  if (v) state.fg = v;
} catch {}

render();
