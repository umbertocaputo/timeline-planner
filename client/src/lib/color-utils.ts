/**
 * Generates a consistent, vibrant HSL color based on a string hash.
 * Used to give localities a consistent, highly visible color.
 */
export function stringToColor(str: string): string {
  if (!str) return 'hsl(0, 0%, 50%)';
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Constrain hue to 0-360
  const h = Math.abs(hash % 360);
  // High saturation (95%) and medium-light lightness (45%) for maximum vibrancy
  return `hsl(${h}, 95%, 45%)`;
}
