import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize Gemini AI:", error);
}

export const generateGameOverMessage = async (score: number): Promise<string> => {
  if (!ai) {
    return `놀라운 실력이네요! 점수: ${score}`;
  }

  try {
    const prompt = `
      The player just finished a round of "Infinite Stairs" (a fast-paced arcade game).
      Their score is ${score} steps.
      
      Write a very short, single-sentence reaction in Korean.
      - If score < 50: Be sarcastic or gently teasing about their slow fingers.
      - If score 50-150: Be encouraging but say they can do better.
      - If score > 150: Be amazed and praise their god-like speed.
      
      Do not include quotes. Just the sentence.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || `게임 종료! 점수: ${score}`;
  } catch (error) {
    console.error("Gemini generation error:", error);
    return `게임 종료! 점수: ${score}`;
  }
};