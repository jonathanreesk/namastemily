# Namaste, Emily — Bolt Version
This is a Bolt-ready Hindi learning pilot for Emily.

## Features
- Roleplay chat with "Asha Aunty" (Market, Taxi, Neighbor, Church, Rickshaw, Introductions)
- Hindi TTS in browser
- Optional server Whisper STT for better Hindi recognition
- Phrase packs for each scene

## Running in Bolt
1. Upload this folder to your Bolt workspace.
2. Set environment variable `OPENAI_API_KEY` in Bolt's settings.
3. Click "Run" — your app will be live with `/api/roleplay` and `/api/stt` endpoints.

Static files are in `/public`.
API routes are defined in `bolt.config.json`.
