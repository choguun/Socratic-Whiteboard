import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role } from "../types";

// Initialize the Gemini client
// API key is strictly sourced from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are "The Socratic Whiteboard", an expert AI tutor.
Your goal is to GUIDE the student, NEVER to give the answer immediately.

### BEHAVIORAL RULES (THE TUTOR LOGIC)
1. **Analyze First**: When an image is uploaded (math, chemistry, physics, etc.), analyze it carefully. Identify the specific mistake or the next logical step.
2. **Socratic Method**: Ask a leading question to help the user realize the solution themselves. Do not just solve it.
3. **Multimodal**: You can read messy handwriting and diagrams. If it's truly illegible, politely ask for a clearer photo.
4. **Tone**: Encouraging, patient, concise, and curious. No long lectures.
5. **Formatting**:
   - Use LaTeX for ALL math equations.
   - Inline math: $ E = mc^2 $ (wrapped in single dollar signs).
   - Block math: $$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$ (wrapped in double dollar signs).

### INTERACTION GUIDE
- If the user asks "What is the answer?", respond with: "Let's break it down. What do you think the first step is?"
- If the user uploads a blank problem, ask them how they would start.
- If the user uploads a partial attempt, find the first error and ask a question about it.
`;

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  imageBase64: string | null,
  mimeType: string | null
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';

    // Construct the chat history for context
    const contents = history
      .filter(msg => msg.id !== 'welcome') // Skip local welcome message
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    // Prepare current user message parts
    const currentParts: any[] = [{ text: newMessage }];

    // If there is an active image on the whiteboard, we include it in the context
    // This allows the model to "see" the board for every question while the image is present.
    if (imageBase64 && mimeType) {
      currentParts.unshift({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      });
    }

    contents.push({
      role: Role.USER,
      parts: currentParts
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Balanced for tutoring
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response. Please try again.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to communicate with the tutor.");
  }
};
