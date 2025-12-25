import { auth } from "@/auth"
import { createEvent } from "@/lib/calendar"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
        const { events } = await req.json()
        if (!events || !Array.isArray(events)) {
            return NextResponse.json({ error: "Invalid events" }, { status: 400 })
        }

        const results = await Promise.all(events.map(async (evt: any) => {
            const googleEvent = {
                summary: evt.title,
                start: { dateTime: evt.startTime },
                end: { dateTime: evt.endTime },
            }
            return createEvent(googleEvent)
        }))

        return NextResponse.json({ success: true, count: results.length })
    } catch (error: any) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
