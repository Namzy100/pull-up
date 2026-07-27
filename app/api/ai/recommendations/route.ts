import { jsonError, requireProfile, routeError, supabaseRest } from "../../_supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { profile } = await requireProfile(request, ["student", "admin"]);
    if (!process.env.OPENAI_API_KEY) {
      return jsonError("OpenAI API key is not configured.", 503);
    }

    const payload = (await request.json()) as {
      question?: string;
      preferences?: string[];
    };
    if (!payload.question?.trim()) return jsonError("question is required");

    const events = await supabaseRest(
      "events?select=title,description,starts_at,cover,age_rule,event_scores(state,confidence,demand_quality,manipulation_risk,explanation),venues(name,kind)&status=in.(approved,live)&order=starts_at.asc&limit=12",
    );

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5",
        store: false,
        input: [
          {
            role: "developer",
            content:
              "You are Pull Up's nightlife recommendation assistant. Recommend only from provided events. Be honest about uncertainty, never invent crowd claims, and mention privacy-safe reasoning.",
          },
          {
            role: "user",
            content: JSON.stringify({
              campus: profile.campus_id,
              question: payload.question,
              preferences: payload.preferences ?? [],
              availableEvents: events,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return jsonError(`AI request failed: ${await response.text()}`, 502);
    }

    const data = (await response.json()) as { output_text?: string };
    return Response.json({ answer: data.output_text ?? "I could not form a recommendation yet." });
  } catch (error) {
    return routeError(error);
  }
}
