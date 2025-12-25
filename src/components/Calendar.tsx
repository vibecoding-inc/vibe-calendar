import { ScheduledEvent } from '@/lib/types';

interface CalendarProps {
    events?: ScheduledEvent[];
}

export default function Calendar({ events = [] }: CalendarProps) {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

    // Helper to calculate position and height from time
    const getEventStyle = (event: ScheduledEvent) => {
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);

        const startHour = start.getHours();
        const startMin = start.getMinutes();
        const endHour = end.getHours();
        const endMin = end.getMinutes();

        // 8 AM is 0px. Each hour is 60px.
        const top = ((startHour - 8) * 60) + startMin;
        const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        const height = Math.max(durationMinutes, 20); // Minimum height for visibility

        return {
            top: `${top}px`,
            height: `${height}px`,
            position: 'absolute' as const,
            left: '0',
            right: '0',
        };
    };

    return (
        <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Your Schedule</h2>
            <div className="relative">
                <div className="grid grid-cols-[60px_1fr]">
                    {hours.map((hour) => (
                        <div key={hour} className="contents">
                            <div className="text-text-secondary text-sm text-right -translate-y-2.5 pr-2">
                                {hour}:00
                            </div>
                            <div className="h-[60px] border-t border-border relative">
                                {/* Grid lines */}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Events overlay */}
                <div className="absolute top-0 left-[60px] right-0 bottom-0 pointer-events-none">
                    {events.map(event => (
                        <div
                            key={event.id}
                            style={getEventStyle(event)}
                            title={`${event.title} (${new Date(event.startTime).toLocaleTimeString()})`}
                            className="bg-primary/30 border-l-4 border-primary px-2 rounded text-sm overflow-hidden"
                        >
                            <div className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{event.title}</div>
                            <div className="text-xs opacity-80">
                                {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
