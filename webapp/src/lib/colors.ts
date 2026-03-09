/**
 * Zone-based color utility for usage warnings.
 *
 * Smoothly interpolates between three anchor colors based on
 * the ratio of current usage to the daily limit:
 *   0–60%  → brand green (#1fc762)
 *   60–100% → transitions green → amber (#F59E0B)
 *   100%+  → transitions amber → red (#EF4444), capping at ~150%
 */

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToHSL(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: h * 360, s, l };
}

function hslToHex(hsl: HSL): string {
  const { h, s, l } = hsl;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpHSL(a: HSL, b: HSL, t: number): HSL {
  // Shortest-path hue interpolation
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  return {
    h: ((a.h + dh * t) % 360 + 360) % 360,
    s: a.s + (b.s - a.s) * t,
    l: a.l + (b.l - a.l) * t,
  };
}

const GREEN = hexToHSL("#1fc762");
const AMBER = hexToHSL("#F59E0B");
const RED = hexToHSL("#EF4444");

/**
 * Returns a smoothly interpolated hex color based on usage ratio.
 *
 * @param current - current usage count
 * @param limit   - daily limit (baseline or explicit limit)
 * @returns hex color string
 */
export function getZoneColor(current: number, limit: number): string {
  if (limit <= 0) return hslToHex(GREEN);

  const pct = current / limit;

  if (pct <= 0.6) {
    return hslToHex(GREEN);
  }

  if (pct <= 1) {
    // 60%–100%: green → amber
    const t = (pct - 0.6) / 0.4;
    return hslToHex(lerpHSL(GREEN, AMBER, t));
  }

  // 100%–150%: amber → red (clamp at 150%)
  const t = Math.min((pct - 1) / 0.5, 1);
  return hslToHex(lerpHSL(AMBER, RED, t));
}
