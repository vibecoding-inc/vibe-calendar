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
        <div className="card">
            <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Tasks</h2>
            <textarea
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                placeholder="Enter your tasks here...&#10;- Buy milk&#10;- Finish report"
                style={{
                    width: '100%',
                    height: '200px',
                    background: 'var(--surface-highlight)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--spacing-md)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical',
                    marginBottom: 'var(--spacing-md)',
                    outline: 'none',
                }}
            />
            <button
                className="btn"
                style={{ width: '100%' }}
                onClick={handleSchedule}
                disabled={isScheduling}
            >
                {isScheduling ? 'Scheduling...' : 'Plan My Day'}
            </button>
        </div>
    );
}
