
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { audioBase64, mime = "audio/webm" } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "missing_audio" });
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const buffer = Buffer.from(audioBase64, "base64");
    const file = new Blob([buffer], { type: mime });

    const transcript = await client.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "hi",
      response_format: "json"
    });

    res.json({ text: transcript.text || "" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "stt_failed" });
  }
}
