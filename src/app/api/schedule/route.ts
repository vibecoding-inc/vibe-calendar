import { NextResponse } from 'next/server';
import { ScheduleResponse } from '@/lib/types';

export async function POST(req: Request) {
    try {
        const { tasks, date, existingEvents } = await req.json();

        if (!tasks) {
            return NextResponse.json(
                { error: 'No tasks provided' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Missing OpenRouter API Key' },
                { status: 500 }
            );
        }

        const eventsContext = existingEvents
            ? `I have the following existing events scheduled for today:\n${existingEvents.map((e: any) => `- ID: ${e.id} (Calendar: ${e.calendarId || 'primary'}): ${e.title}: ${e.startTime} to ${e.endTime}`).join('\n')}`
            : "I have no other events scheduled for today.";

        const prompt = `
      You are an expert personal scheduler. I have the following tasks to do today (${date || 'today'}):
      ${tasks}

      ${eventsContext}

      Please schedule my tasks into a coherent plan. 
      You have full control to MODIFY existing events if necessary to fit the new tasks.
      For example, you can SHORTEN an existing "Work" event to make room for "Lunch", and then create a new "Work" event afterwards.
      
      Return a plan JSON with a key "actions" which is an array of actions.
      Valid actions are: 
      - { "type": "create", "event": { "title": "...", "startTime": "...", "endTime": "..." } }
      - { "type": "update", "eventId": "...", "calendarId": "...", "event": { "startTime": "...", "endTime": "..." } }  <-- Use this to RESCHEDULE or SHORTEN existing events. Only include fields you want to change.
      - { "type": "delete", "eventId": "...", "calendarId": "..." }

      Do not assume a strictly 9-5 workday. Fit the tasks in where they make sense.
            
      Return the result as a JSON object:
      {
        "actions": [ ... ]
      }
    `;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                plugins: [{ id: 'response-healing' }]
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API Error:", errorText);
            return NextResponse.json({ error: `OpenRouter API returned ${response.status}: ${errorText}` }, { status: 500 });
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content;

        // Response Healing should handle markdown, but keeping safe fallback
        content = content.replace(/^```json\n/, '').replace(/\n```$/, '');

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse JSON:", content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        // Handle both older "events" format (if AI messes up) AND new "actions" format
        const actions = parsed.actions;
        const events = parsed.events;

        return NextResponse.json({ actions, events } as ScheduleResponse);

    } catch (error) {
        console.error('Scheduling error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
