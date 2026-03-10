/**
 * Generates a consistent HSL color based on a string hash.
 * Used to give localities a consistent color.
 */
export function stringToColor(str: string): string {
  if (!str) return 'hsl(0, 0%, 50%)';
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Constrain hue to 0-360
  const h = Math.abs(hash % 360);
  // Keep saturation high and lightness medium for vibrant, readable colors
  return `hsl(${h}, 75%, 55%)`;
}
