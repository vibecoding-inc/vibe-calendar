'use client';

import { useState } from 'react';
import TaskInput from '@/components/TaskInput';
import Calendar from '@/components/Calendar';
import styles from './page.module.css';
import { ScheduledEvent, ScheduleResponse } from '@/lib/types';

export default function Home() {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);

  const handleSchedule = async (tasks: string) => {
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, date: new Date().toDateString() }),
      });

      const data: ScheduleResponse = await response.json();
      if (data.events) {
        setEvents(data.events);
      } else {
        console.error(data.error);
        alert('Error scheduling tasks: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  };

  return (
    <main className="container">
      <header style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Vibe Calendar</h1>
        <p style={{ color: 'var(--text-secondary)' }}>AI-Powered Time Boxing</p>
      </header>

      <div className={styles.grid}>
        <section>
          <TaskInput onSchedule={handleSchedule} />
        </section>
        <section>
          <Calendar events={events} />
        </section>
      </div>
    </main>
  );
}
