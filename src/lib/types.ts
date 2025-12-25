export interface Task {
    id: string;
    title: string;
    duration: number; // in minutes
    priority: 'high' | 'medium' | 'low';
}

export interface ScheduledEvent {
    id: string;
    title: string;
    description?: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    calendarId?: string;
}

export type ActionType = 'create' | 'update' | 'delete';

export interface CalendarAction {
    type: ActionType;
    event: Partial<ScheduledEvent>; // For create/update
    eventId?: string; // For update/delete
    calendarId?: string; // For update/delete
}

export interface ScheduleResponse {
    events?: ScheduledEvent[];
    actions?: CalendarAction[];
    error?: string;
}
