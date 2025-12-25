
import { auth } from "@/auth"
import { createEvent, updateEvent, deleteEvent } from "@/lib/calendar"
import { CalendarAction } from "@/lib/types"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
        const { actions } = await req.json() as { actions: CalendarAction[] }

        if (!actions || !Array.isArray(actions)) {
            return NextResponse.json({ error: "Invalid actions" }, { status: 400 })
        }

        const results = []
        for (const action of actions) {
            try {
                if (action.type === 'create' && action.event) {
                    await createEvent({
                        summary: action.event.title,
                        description: action.event.description,
                        start: { dateTime: action.event.startTime },
                        end: { dateTime: action.event.endTime }
                    })
                    results.push({ status: 'created', title: action.event.title })
                } else if (action.type === 'update' && action.eventId && action.event) {
                    // map partial event to GCal patch object
                    const patchBody: any = {}
                    if (action.event.title) patchBody.summary = action.event.title
                    if (action.event.description) patchBody.description = action.event.description
                    if (action.event.startTime) patchBody.start = { dateTime: action.event.startTime }
                    if (action.event.endTime) patchBody.end = { dateTime: action.event.endTime }

                    await updateEvent(action.calendarId || 'primary', action.eventId, patchBody)
                    results.push({ status: 'updated', id: action.eventId })
                } else if (action.type === 'delete' && action.eventId) {
                    await deleteEvent(action.calendarId || 'primary', action.eventId)
                    results.push({ status: 'deleted', id: action.eventId })
                }
            } catch (error: any) {
                console.error(`Failed to execute action ${action.type}`, error)
                results.push({ status: 'failed', error: error.message, action })
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (error: any) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
