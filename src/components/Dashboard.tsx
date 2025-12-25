'use client';

import { useState } from 'react';
import { Session } from 'next-auth';
import TaskInput from '@/components/TaskInput';
import Calendar from '@/components/Calendar';
import { ScheduledEvent, ScheduleResponse, CalendarAction } from '@/lib/types';

interface DashboardProps {
    initialEvents: ScheduledEvent[];
    session: Session | null;
}

export default function Dashboard({ initialEvents, session }: DashboardProps) {
    const [events, setEvents] = useState<ScheduledEvent[]>(initialEvents);
    const [proposedActions, setProposedActions] = useState<CalendarAction[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSchedule = async (tasks: string) => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tasks,
                    date: new Date().toDateString(),
                    existingEvents: events
                }),
            });

            const data: ScheduleResponse = await response.json();

            if (data.actions && data.actions.length > 0) {
                setProposedActions(data.actions);
            } else if (data.events) {
                // Fallback for full replacements if no actions returned
                setEvents(data.events);
                setProposedActions([]);
            } else {
                alert('No schedule changes proposed.');
            }

            if (data.error) {
                console.error(data.error);
                alert('Warning: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Network error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExecute = async () => {
        if (!session) {
            alert('Please sign in to execute changes.');
            return;
        }
        setIsProcessing(true);
        try {
            const res = await fetch('/api/calendar/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actions: proposedActions }),
            });
            const data = await res.json();
            if (data.success) {
                alert('Schedule updated successfully!');
                setProposedActions([]);
                // Reload page to fetch fresh events or apply locally. 
                // For now, let's refresh page to be safe as we modified GCal.
                window.location.reload();
            } else {
                alert('Failed to execute: ' + data.error);
            }
        } catch (e) {
            alert('Error executing changes');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDiscard = () => {
        setProposedActions([]);
    };

    const previewEvents = (() => {
        if (proposedActions.length === 0) return events;

        // Start with a copy of current events
        let updatedEvents = [...events];

        for (const action of proposedActions) {
            if (action.type === 'create' && action.event) {
                // Add new event
                updatedEvents.push({
                    id: 'temp-' + Math.random(), // Temp ID for display
                    title: action.event.title || 'New Event',
                    startTime: action.event.startTime || '',
                    endTime: action.event.endTime || '',
                    calendarId: 'primary'
                } as ScheduledEvent);
            } else if (action.type === 'update' && action.eventId) {
                // Update existing event
                updatedEvents = updatedEvents.map(e => {
                    if (e.id === action.eventId) {
                        return { ...e, ...action.event };
                    }
                    return e;
                });
            } else if (action.type === 'delete' && action.eventId) {
                // Filter out deleted event
                updatedEvents = updatedEvents.filter(e => e.id !== action.eventId);
            }
        }

        return updatedEvents;
    })();

    const getEventTitle = (id: string) => {
        const event = events.find(e => e.id === id);
        return event ? event.title : id;
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-8 items-start">
                <section className="space-y-6">
                    <TaskInput onSchedule={handleSchedule} />

                    {proposedActions.length > 0 && (
                        <div className="bg-surface-highlight p-4 rounded-lg border border-border">
                            <h3 className="font-semibold mb-3">Proposed Changes ({proposedActions.length})</h3>
                            <ul className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                {proposedActions.map((action, idx) => (
                                    <li key={idx} className="text-sm bg-surface p-2 rounded flex items-start gap-2">
                                        <span className={`
                                            uppercase text-[10px] font-bold px-1.5 py-0.5 rounded
                                            ${action.type === 'create' ? 'bg-green-500/20 text-green-500' : ''}
                                            ${action.type === 'update' ? 'bg-blue-500/20 text-blue-500' : ''}
                                            ${action.type === 'delete' ? 'bg-red-500/20 text-red-500' : ''}
                                        `}>
                                            {action.type}
                                        </span>
                                        <div className="flex-1">
                                            {action.type === 'create' && (
                                                <span>Add "{action.event?.title}" at {new Date(action.event?.startTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            )}
                                            {action.type === 'update' && (
                                                <span>Update <strong>{getEventTitle(action.eventId!)}</strong></span>
                                            )}
                                            {action.type === 'delete' && (
                                                <span>Delete <strong>{getEventTitle(action.eventId!)}</strong></span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExecute}
                                    disabled={isProcessing}
                                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded text-sm font-medium transition-colors"
                                >
                                    {isProcessing ? 'Executing...' : 'Execute Changes'}
                                </button>
                                <button
                                    onClick={handleDiscard}
                                    disabled={isProcessing}
                                    className="px-3 py-2 bg-surface hover:bg-surface-highlight border border-border rounded text-sm transition-colors"
                                >
                                    Discard
                                </button>
                            </div>
                        </div>
                    )}
                </section>
                <section>
                    <Calendar events={previewEvents} />
                </section>
            </div>
        </div>
    );
}
