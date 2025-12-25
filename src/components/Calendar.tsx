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
            backgroundColor: 'rgba(139, 92, 246, 0.3)',
            borderLeft: '4px solid var(--primary)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.875rem',
            overflow: 'hidden',
        };
    };

    return (
        <div className="card">
            <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Your Schedule</h2>
            <div style={{ position: 'relative' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 'var(--spacing-sm)' }}>
                    {hours.map((hour) => (
                        <div key={hour} style={{ display: 'contents' }}>
                            <div style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem',
                                textAlign: 'right',
                                transform: 'translateY(-10px)'
                            }}>
                                {hour}:00
                            </div>
                            <div style={{
                                height: '60px',
                                borderTop: '1px solid var(--border)',
                                position: 'relative'
                            }}>
                                {/* Grid lines */}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Events overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 'calc(60px + var(--spacing-sm))',
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none' // Let clicks pass through to grid if needed
                }}>
                    {events.map(event => (
                        <div key={event.id} style={getEventStyle(event)} title={`${event.title} (${new Date(event.startTime).toLocaleTimeString()})`}>
                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
