import { auth } from "@/auth";
import { getEventsForDay } from "@/lib/calendar";
import Dashboard from "@/components/Dashboard";
import { ScheduledEvent } from "@/lib/types";

export default async function Home() {
  const session = await auth();
  let initialEvents: ScheduledEvent[] = [];

  if (session?.user) {
    try {
      const now = new Date();
      // Server-side now. In a real app, might want to respect user's timezone if known.
      // Reset to start of day UTC or local server time
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch from Google Calendar
      const gEvents = await getEventsForDay(startOfDay.toISOString(), endOfDay.toISOString());

      // Map to ScheduledEvent
      initialEvents = gEvents.map((e: any) => ({
        id: e.id,
        title: e.summary || '(No Title)',
        startTime: e.start.dateTime || e.start.date,
        endTime: e.end.dateTime || e.end.date,
        calendarId: e.calendarId,
      }));
    } catch (error) {
      console.error("Failed to fetch initial events", error);
      // Fallback to empty events if fetch fails (e.g. token expired, network)
    }
  }

  return (
    <Dashboard initialEvents={initialEvents} session={session} />
  );
}
