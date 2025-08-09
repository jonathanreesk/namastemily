
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { history = [], scene = "market", level = "beginner" } = req.body;

    const { readFile } = await import('fs/promises');
    const path = await import('path');
    
    const scenes = JSON.parse(await readFile(path.join(process.cwd(), 'server/scenes.json'), 'utf8'));
    const persona = await readFile(path.join(process.cwd(), 'server/persona.txt'), 'utf8');

    const scenePersona = scenes[scene] || scenes.market;
    const system = [
      persona,
      "Persona scene:", scenePersona,
      level === "beginner" ? "Use very simple sentences and slow pace." : "Use simple sentences; allow a bit more variety.",
      "Start with a friendly greeting and a clear question."
    ].join("\n");

    const messages = [
      { role: "system", content: system },
      ...history
    ];

    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages
    });
    const reply = resp.choices?.[0]?.message?.content || "Namaste, Emily! Kaise madad karun? (How can I help?)";

    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "roleplay_failed" });
  }
}
