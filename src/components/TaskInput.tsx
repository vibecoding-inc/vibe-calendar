'use client';

import { useState } from 'react';

interface TaskInputProps {
    onSchedule: (tasks: string) => Promise<void>;
}

export default function TaskInput({ onSchedule }: TaskInputProps) {
    const [tasks, setTasks] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);

    const handleSchedule = async () => {
        if (!tasks.trim()) return;

        setIsScheduling(true);
        try {
            await onSchedule(tasks);
        } catch (error) {
            console.error(error);
            alert('Failed to schedule tasks');
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Tasks</h2>
            <textarea
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                placeholder="Enter your tasks here...&#10;- Buy milk&#10;- Finish report"
                className="w-full h-[200px] bg-surface-highlight border border-border rounded p-4 text-text-primary text-base resize-y mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
                className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-wait"
                onClick={handleSchedule}
                disabled={isScheduling}
            >
                {isScheduling ? 'Scheduling...' : 'Plan My Day'}
            </button>
        </div>
    );
}
