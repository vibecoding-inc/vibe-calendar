import { auth } from "@/auth"
import { getEventsForDay } from "@/lib/calendar"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date") || new Date().toISOString()

    // Calculate start and end of day in user's potential timezone (simplifying to UTC/server time for now or just whole day)
    // For better accuracy, we might want to pass timezone from client, but let's start with simple ISO day
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    const timeMin = targetDate.toISOString()

    const targetEndDate = new Date(date)
    targetEndDate.setHours(23, 59, 59, 999)
    const timeMax = targetEndDate.toISOString()

    try {
        const events = await getEventsForDay(timeMin, timeMax)
        return NextResponse.json({ events })
    } catch (error: any) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
