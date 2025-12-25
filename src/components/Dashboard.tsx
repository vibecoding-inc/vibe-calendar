'use client';

import { useState } from 'react';
import { Session } from 'next-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TaskInput from '@/components/TaskInput';
import Calendar from '@/components/Calendar';
import { ScheduledEvent, ScheduleResponse, CalendarAction } from '@/lib/types';

interface DashboardProps {
    initialEvents: ScheduledEvent[];
    session: Session | null;
}

export default function Dashboard({ initialEvents, session }: DashboardProps) {
    const queryClient = useQueryClient();
    const [proposedActions, setProposedActions] = useState<CalendarAction[]>([]);

    // Use TanStack Query for events
    const { data: events } = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const res = await fetch('/api/events');
            if (!res.ok) throw new Error('Failed to fetch events');
            const data = await res.json();
            return data.events as ScheduledEvent[];
        },
        initialData: initialEvents,
    });

    // Schedule Mutation
    const scheduleMutation = useMutation({
        mutationFn: async (tasks: string) => {
            const response = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tasks,
                    date: new Date().toDateString(),
                    existingEvents: events
                }),
            });
            return response.json() as Promise<ScheduleResponse>;
        },
        onSuccess: (data) => {
            if (data.actions && data.actions.length > 0) {
                setProposedActions(data.actions);
            } else if (data.events) {
                // Fallback for full replacements if no actions returned
                // Update cache directly if full replacement
                queryClient.setQueryData(['events'], data.events);
                setProposedActions([]);
            } else {
                alert('No schedule changes proposed.');
            }

            if (data.error) {
                console.error(data.error);
                alert('Warning: ' + data.error);
            }
        },
        onError: (e) => {
            console.error(e);
            alert('Network error');
        }
    });

    // Execute Mutation
    const executeMutation = useMutation({
        mutationFn: async (actions: CalendarAction[]) => {
            const res = await fetch('/api/calendar/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actions }),
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                alert('Schedule updated successfully!');
                setProposedActions([]);
                // Invalidate query to refetch latest events from GCal/API
                queryClient.invalidateQueries({ queryKey: ['events'] });
            } else {
                alert('Failed to execute: ' + data.error);
            }
        },
        onError: () => {
            alert('Error executing changes');
        }
    });

    const handleSchedule = async (tasks: string) => {
        await scheduleMutation.mutateAsync(tasks);
    };

    const handleExecute = () => {
        if (!session) {
            alert('Please sign in to execute changes.');
            return;
        }
        executeMutation.mutate(proposedActions);
    };

    const handleDiscard = () => {
        setProposedActions([]);
    };

    const isProcessing = scheduleMutation.isPending || executeMutation.isPending;

    const previewEvents = (() => {
        if (proposedActions.length === 0) return events;

        // Start with a copy of current events
        let updatedEvents = [...(events || [])];

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
        const event = (events || []).find(e => e.id === id);
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
