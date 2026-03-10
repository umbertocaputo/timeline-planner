/**
 * Utility functions for Gantt chart time calculations
 * Timeline: 04:00 to 23:59 (20 hours = 1200 minutes)
 */

const START_HOUR = 4; // 04:00
const END_HOUR = 24; // 23:59
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 1200 minutes

// Calculate percentage across the 20h timeline (04:00 to 23:59)
export function getPercentageOfDay(isoString: string): number {
  const d = new Date(isoString);
  const totalMinutes = d.getHours() * 60 + d.getMinutes();
  
  // If before 04:00, consider it as next day
  let adjustedMinutes = totalMinutes;
  if (totalMinutes < START_HOUR * 60) {
    adjustedMinutes += 1440;
  }
  
  const minutesFromStart = adjustedMinutes - (START_HOUR * 60);
  return Math.max(0, Math.min((minutesFromStart / TOTAL_MINUTES) * 100, 100));
}

// Calculate width percentage based on start and end
export function getDurationPercentage(startIso: string, endIso: string): number {
  const startD = new Date(startIso);
  const endD = new Date(endIso);
  
  let startMinutes = startD.getHours() * 60 + startD.getMinutes();
  let endMinutes = endD.getHours() * 60 + endD.getMinutes();
  
  // Handle times before 04:00 as next day
  if (startMinutes < START_HOUR * 60) {
    startMinutes += 1440;
  }
  if (endMinutes < START_HOUR * 60) {
    endMinutes += 1440;
  }
  
  // Handle cross-midnight
  if (endMinutes < startMinutes) {
    endMinutes += 1440;
  }
  
  const startAdjusted = startMinutes - (START_HOUR * 60);
  const endAdjusted = endMinutes - (START_HOUR * 60);
  const duration = endAdjusted - startAdjusted;
  
  return Math.max((duration / TOTAL_MINUTES) * 100, 0.5); // Minimum width of 0.5%
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
