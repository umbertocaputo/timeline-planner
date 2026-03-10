export function TimelineHeader() {
  const START_HOUR = 4;
  const END_HOUR = 24;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

  return (
    <div className="flex relative h-12 border-b border-border bg-muted/30 select-none sticky top-0 z-10">
      {/* Spacer for Nastro labels */}
      <div className="w-48 shrink-0 border-r border-border bg-card flex items-center px-4 font-semibold text-sm text-muted-foreground">
        Nastro
      </div>
      
      {/* 20h Ruler (04:00 to 23:59) */}
      <div className="flex-1 relative">
        {hours.map((hour) => {
          const minutesFromStart = (hour - START_HOUR) * 60;
          const percentage = (minutesFromStart / TOTAL_MINUTES) * 100;
          
          return (
            <div
              key={hour}
              className="absolute top-0 bottom-0 border-l border-border/60 flex flex-col justify-end pb-1"
              style={{ left: `${percentage}%` }}
            >
              <span className="text-[10px] font-mono text-muted-foreground -ml-3 bg-background px-1">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
