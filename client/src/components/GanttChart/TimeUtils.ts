/**
 * Utility functions for Gantt chart time calculations
 */

// Calculate percentage across a 24h timeline (1440 minutes)
export function getPercentageOfDay(isoString: string): number {
  const d = new Date(isoString);
  const minutes = d.getHours() * 60 + d.getMinutes();
  return (minutes / 1440) * 100;
}

// Calculate width percentage based on start and end
export function getDurationPercentage(startIso: string, endIso: string): number {
  const startD = new Date(startIso);
  const endD = new Date(endIso);
  
  let startMinutes = startD.getHours() * 60 + startD.getMinutes();
  let endMinutes = endD.getHours() * 60 + endD.getMinutes();
  
  // Handle cross-midnight (simple case: if end is before start, assume it ends next day)
  if (endMinutes < startMinutes) {
    endMinutes += 1440;
  }
  
  const duration = endMinutes - startMinutes;
  return Math.max((duration / 1440) * 100, 0.5); // Minimum width of 0.5%
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
