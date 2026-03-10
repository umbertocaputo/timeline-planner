/**
 * Generates a consistent, vibrant color based on a string.
 * Uses golden ratio angle distribution (137.508°) to ensure that strings
 * with similar hash values get very different hues — prevents color clustering.
 */
export function stringToColor(str: string): string {
  if (!str) return 'hsl(0, 0%, 50%)';

  // Build a better hash (djb2 variant) for wider spread
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  hash = Math.abs(hash);

  // Golden ratio angle ensures maximum visual separation between successive hues
  const GOLDEN_ANGLE = 137.508;
  const h = (hash * GOLDEN_ANGLE) % 360;

  // Vary saturation and lightness slightly based on hue to compensate for
  // perceptual lightness differences across the hue wheel (yellows look brighter, etc.)
  // Yellow-green band (50-80°) and cyan band (170-200°) get slightly reduced lightness
  let s = 88;
  let l = 48;
  if (h >= 45 && h <= 85) {
    // Yellow/yellow-green: reduce lightness to avoid looking washed out
    l = 38;
    s = 80;
  } else if (h >= 170 && h <= 210) {
    // Cyan: slightly boost saturation
    s = 90;
    l = 44;
  }

  return `hsl(${Math.round(h)}, ${s}%, ${l}%)`;
}
