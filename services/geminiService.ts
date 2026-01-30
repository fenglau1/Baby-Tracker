import { GoogleGenAI, Type } from "@google/genai";
import { ActivityType, LogEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-3-flash-preview";

export async function interpretVoiceCommand(transcript: string): Promise<Partial<LogEntry> | null> {
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Interpret this baby tracking voice command and return a JSON object representing the log entry.
      Command: "${transcript}"
      
      Current Timestamp: ${Date.now()}
      
      Map to one of these ActivityTypes: NURSING, BOTTLE, FOOD, DIAPER, SLEEP, HEALTH, GROWTH, VACCINE, OTHER.
      
      For 'value', use numbers (e.g., minutes for sleep/nursing, oz for bottle, temperature for health).
      For 'subType', infer categories like 'wet'/'dirty' for diaper, 'left'/'right' for nursing.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: Object.values(ActivityType) },
            details: { type: Type.STRING },
            value: { type: Type.NUMBER },
            subType: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
          required: ["type", "details"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as Partial<LogEntry>;
  } catch (error) {
    console.error("Error interpreting voice command:", error);
    return null;
  }
}
