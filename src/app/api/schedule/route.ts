import { NextResponse } from 'next/server';
import { ScheduleResponse } from '@/lib/types';

export async function POST(req: Request) {
    try {
        const { tasks, date } = await req.json();

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

        const prompt = `
      You are an expert scheduler. I have the following tasks to do today (${date || 'today'}):
      ${tasks}

      Please schedule them into a coherent plan, assuming an 8-hour workday starting at 9:00 AM.
      Return the result as a JSON object with a key "events" containing an array of objects with the following structure:
      {
        "events": [
          {
            "id": "unique_id",
            "title": "Task Name",
            "startTime": "YYYY-MM-DDTHH:mm:ss",
            "endTime": "YYYY-MM-DDTHH:mm:ss"
          }
        ]
      }
      Do not include any other text.
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

        const events = parsed.events || parsed; // Handle both wrapped and unwrapped just in case


        return NextResponse.json({ events } as ScheduleResponse);

    } catch (error) {
        console.error('Scheduling error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
