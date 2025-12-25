import { google } from "googleapis"
import { auth } from "@/auth"

export async function getGoogleCalendarClient() {
    const session = await auth()
    if (!session?.accessToken) {
        throw new Error("Not authenticated")
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    return google.calendar({ version: "v3", auth: oauth2Client })
}

export async function listCalendars() {
    const calendar = await getGoogleCalendarClient()
    const res = await calendar.calendarList.list()
    return res.data.items || []
}

export async function getEventsForDay(start: string, end: string) {
    const calendar = await getGoogleCalendarClient()
    const calendarsToCheck = ['primary']

    // Try to find Vibe App calendar
    try {
        const calList = await calendar.calendarList.list()
        const vibeCal = calList.data.items?.find(c => c.summary === "Vibe App")
        if (vibeCal && vibeCal.id) {
            calendarsToCheck.push(vibeCal.id)
        }
    } catch (e) {
        console.error("Error listing calendars", e)
    }

    const allEvents = await Promise.all(calendarsToCheck.map(async (calId) => {
        try {
            const data = await calendar.events.list({
                calendarId: calId,
                timeMin: start,
                timeMax: end,
                singleEvents: true,
                orderBy: 'startTime',
            })
            return (data.data.items || []).map(event => ({ ...event, calendarId: calId }))
        } catch (e) {
            console.error(`Error fetching events for ${calId}`, e)
            return []
        }
    }))

    // Flatten and sort by start time
    return allEvents.flat().sort((a, b) => {
        const tA = new Date(a.start?.dateTime || a.start?.date || 0).getTime()
        const tB = new Date(b.start?.dateTime || b.start?.date || 0).getTime()
        return tA - tB
    })
}

// Keep backward compatibility if needed, or update consumers
export const checkConflicts = getEventsForDay

export async function createVibeCalendar() {
    const calendar = await getGoogleCalendarClient()
    // Check if it exists first
    const calendars = await listCalendars()
    const existing = calendars.find(c => c.summary === "Vibe App")
    if (existing) return existing

    const res = await calendar.calendars.insert({
        requestBody: {
            summary: "Vibe App",
            description: "Calendar for Vibe App planning"
        }
    })
    return res.data
}

export async function createEvent(event: any) {
    const calendar = await getGoogleCalendarClient()
    const vibecal = await createVibeCalendar()
    if (!vibecal.id) throw new Error("Could not create vibe calendar")

    // Insert event into Vibe App calendar
    // Assuming event object is formatted for Google Calendar API
    const res = await calendar.events.insert({
        calendarId: vibecal.id,
        requestBody: event
    })
    return res.data
}

export async function updateEvent(calendarId: string, eventId: string, event: any) {
    const calendar = await getGoogleCalendarClient()
    const res = await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: event
    })
    return res.data
}

export async function deleteEvent(calendarId: string, eventId: string) {
    const calendar = await getGoogleCalendarClient()
    await calendar.events.delete({
        calendarId,
        eventId
    })
}
