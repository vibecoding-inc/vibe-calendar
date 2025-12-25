
import { auth } from "@/auth";
import { getEventsForDay } from "@/lib/calendar";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        // Default to today if not provided
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const startTime = start || startOfDay.toISOString();
        const endTime = end || endOfDay.toISOString();

        const gEvents = await getEventsForDay(startTime, endTime);

        // Map to ScheduledEvent consistent with page.tsx
        const events = gEvents.map((e: any) => ({
            id: e.id,
            title: e.summary || '(No Title)',
            startTime: e.start.dateTime || e.start.date,
            endTime: e.end.dateTime || e.end.date,
            calendarId: e.calendarId,
        }));

        return NextResponse.json({ events });
    } catch (error: any) {
        console.error("Error fetching events:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
