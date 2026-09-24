import {
  hsvToRgb, rgbToHsv, rgbToHsl, rgbToHex, hexToRgb,
  rgbaString, hslString, contrast, clamp, alphaHex,
  copyText, flashCopied,
} from "./color.js";

const state = { h: 174, s: 0.85, v: 0.84, a: 1, format: "hex" };

const $ = (id) => document.getElementById(id);
const svArea = $("svArea");
const svBase = $("svBase");
const svKnob = $("svKnob");
const sliders = {
  hue: $("hueSlider"),
  sat: $("satSlider"),
  val: $("valSlider"),
  alpha: $("alphaSlider"),
};
const knobs = Object.fromEntries(
  Object.entries(sliders).map(([k, el]) => [k, el.querySelector(".slider-knob")])
);
const values = {
  hue: $("hueValue"),
  sat: $("satValue"),
  val: $("valValue"),
  alpha: $("alphaValue"),
};
const chips = { h: $("chipH"), s: $("chipS"), l: $("chipL") };
const bigInput = $("bigValue");
const readoutSub = $("readoutSub");
const swatchFill = $("swatchFill");
const rows = { hex: $("rowHex"), rgb: $("rowRgb"), hsl: $("rowHsl") };
const liveDot = $("liveDot");
const liveHex = $("liveHex");
const wcagDot = $("wcagDot");
const wcagText = $("wcagText");
const eyedropperBtn = $("eyedropperBtn");

function currentRgb() {
  return hsvToRgb(state.h, state.s, state.v);
}

function setKnob(knob, pct) {
  knob.style.left = `${clamp(pct) * 100}%`;
}

function drag(el, handler) {
  const apply = (e) => {
    const rect = el.getBoundingClientRect();
    handler(
      clamp((e.clientX - rect.left) / rect.width),
      clamp((e.clientY - rect.top) / rect.height)
    );
  };
  el.addEventListener("pointerdown", (e) => {
    el.setPointerCapture(e.pointerId);
    apply(e);
    const move = (ev) => apply(ev);
    const stop = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", stop);
      el.removeEventListener("pointercancel", stop);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
  });
}

function formatFor(key) {
  const rgb = currentRgb();
  const [h, s, l] = rgbToHsl(...rgb);
  if (key === "hex") {
    return state.a < 1 ? rgbToHex(...rgb) + alphaHex(state.a) : rgbToHex(...rgb);
  }
  if (key === "rgb") return rgbaString(rgb, state.a);
  return hslString(h, s, l, state.a);
}

function update() {
  const { h, s, v, a } = state;
  const rgb = currentRgb();
  const hex = rgbToHex(...rgb);
  const hsl = rgbToHsl(...rgb);
  updateDom({ h, s, v, a, rgb, hex, hsl });
}

function updateDom({ h, s, v, a, rgb, hex, hsl }) {
  // saturation/value square
  svBase.style.background = `hsl(${Math.round(h)}, 100%, 50%)`;
  svKnob.style.left = `${s * 100}%`;
  svKnob.style.top = `${(1 - v) * 100}%`;

  // sliders
  setKnob(knobs.hue, h / 360);
  setKnob(knobs.sat, s);
  setKnob(knobs.val, v);
  setKnob(knobs.alpha, a);
  sliders.sat.style.background =
    `linear-gradient(90deg, ${rgbaString(hsvToRgb(h, 0, v))}, ${rgbaString(hsvToRgb(h, 1, v))})`;
  sliders.val.style.background =
    `linear-gradient(90deg, #05070d, ${rgbaString(hsvToRgb(h, s, 1))})`;
  sliders.alpha.style.background =
    `linear-gradient(90deg, ${rgbaString(rgb, 0)}, ${rgbaString(rgb, 1)}), ` +
    `repeating-conic-gradient(#e8edf7 0% 25%, #0a0f1a 0% 50%) 0 0 / 12px 12px`;

  values.hue.textContent = `${Math.round(h)}°`;
  values.sat.textContent = `${Math.round(s * 100)}%`;
  values.val.textContent = `${Math.round(v * 100)}%`;
  values.alpha.textContent = `${Math.round(a * 100)}%`;

  chips.h.textContent = `H ${Math.round(h)}°`;
  chips.s.textContent = `S ${Math.round(rgbToHsv(...rgb)[1] * 100)}%`;
  chips.l.textContent = `L ${Math.round(hsl[2] * 100)}%`;

  // hero readout
  swatchFill.style.background = rgbaString(rgb, a);
  if (document.activeElement !== bigInput) bigInput.value = formatFor(state.format);
  readoutSub.textContent =
    state.format === "hex" ? rgbaString(rgb, a) : rgbToHex(...rgb) + (a < 1 ? alphaHex(a) : "");

  rows.hex.textContent = formatFor("hex");
  rows.rgb.textContent = formatFor("rgb");
  rows.hsl.textContent = formatFor("hsl");

  // header chip
  liveDot.style.background = hex;
  liveDot.style.boxShadow = `0 0 22px 4px ${hex}80`;
  liveHex.textContent = hex;

  // WCAG note: current color against the page's dark ink
  const ratio = contrast(rgb, [10, 15, 26]);
  wcagText.textContent = `WCAG AA on dark ink — ${ratio.toFixed(1)}:1`;
  wcagDot.style.background = ratio >= 4.5 ? "var(--cyan)" : "var(--rose)";

  try {
    localStorage.setItem("chromalab:last", hex);
  } catch {}
}

// ---------- interactions ----------

drag(svArea, (x, y) => { state.s = x; state.v = 1 - y; update(); });
drag(sliders.hue, (x) => { state.h = x * 360; update(); });
drag(sliders.sat, (x) => { state.s = x; update(); });
drag(sliders.val, (x) => { state.v = x; update(); });
drag(sliders.alpha, (x) => { state.a = Math.round(x * 100) / 100; update(); });

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.format = tab.dataset.format;
    update();
  });
});

function parseColorInput(str) {
  const raw = String(str).trim();
  const hexBody = raw.replace(/^#/, "");
  if (raw.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(hexBody)) {
    const rgb = hexToRgb(hexBody.slice(0, 6));
    if (rgb) {
      let a = 1;
      if (hexBody.length === 8) a = Math.round(parseInt(hexBody.slice(6, 8), 16) / 2.55) / 100;
      const [h, s, v] = rgbToHsv(...rgb);
      return { h, s, v, a };
    }
  }
  const rgbMatch = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((p) => parseFloat(p));
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => !Number.isNaN(n))) {
      const [h, s, v] = rgbToHsv(parts[0], parts[1], parts[2]);
      return { h, s, v, a: parts[3] === undefined ? 1 : parts[3] };
    }
  }
  return null;
}

bigInput.addEventListener("change", () => {
  const parsed = parseColorInput(bigInput.value);
  if (parsed) Object.assign(state, parsed);
  update();
});
bigInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") bigInput.blur();
});

function wireCopy(id, getText) {
  const btn = $(id);
  btn.addEventListener("click", async () => {
    await copyText(getText());
    flashCopied(btn);
  });
}

wireCopy("copyHex", () => rows.hex.textContent);
wireCopy("copyRgb", () => rows.rgb.textContent);
wireCopy("copyHsl", () => rows.hsl.textContent);
wireCopy(
  "copyAll",
  () => `HEX  ${rows.hex.textContent}\nRGB  ${rows.rgb.textContent}\nHSL  ${rows.hsl.textContent}`
);

if ("EyeDropper" in window) {
  eyedropperBtn.hidden = false;
  eyedropperBtn.addEventListener("click", async () => {
    try {
      const result = await new window.EyeDropper().open();
      const parsed = parseColorInput(result.sRGBHex);
      if (parsed) {
        Object.assign(state, parsed);
        update();
      }
    } catch {} // user cancelled
  });
}

update();
