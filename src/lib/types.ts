export interface Task {
    id: string;
    title: string;
    duration: number; // in minutes
    priority: 'high' | 'medium' | 'low';
}

export interface ScheduledEvent {
    id: string;
    title: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
}

export interface ScheduleResponse {
    events: ScheduledEvent[];
    error?: string;
}
