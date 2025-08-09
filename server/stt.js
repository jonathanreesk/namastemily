
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    // Handle multipart form data from the frontend
    const formData = req.body;
    const audioFile = req.files?.audio;
    
    if (!audioFile) {
      return res.status(400).json({ error: "missing_audio" });
    }
    
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcript = await client.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
      language: "hi",
      response_format: "json"
    });

    res.json({ text: transcript.text || "" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "stt_failed" });
  }
}
