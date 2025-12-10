import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role } from "../types";

// Initialize the Gemini client
// API key is strictly sourced from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a Socratic Tutor acting as a "Whiteboard Companion". 
Your goal is to help the user learn by guiding them, NOT by giving them the answer directly.

Rules:
1. **Never** solve the problem for the user immediately.
2. If the user uploads an image (math problem, chemistry diagram, physics sketch, essay snippet), analyze it carefully. Identify where they might be stuck or what the next logical step is.
3. Ask a leading question to nudge them in the right direction. 
4. Be encouraging, patient, and concise. Avoid long lectures.
5. Use LaTeX formatting for all mathematical expressions. Enclose inline math in single dollar signs ($...$) and block math in double dollar signs ($$...$$).
6. If the image is messy or illegible, politely ask for a clearer photo.
7. If the user is just saying hello, be friendly but remind them you are here to help them solve problems.

Tone: Academic but approachable. Like a kind professor during office hours.
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
    // We only send the text history here for context window efficiency, 
    // unless the image is part of the *current* turn.
    // In a production app, you might want to manage history more robustly with the Chat API,
    // but for this stateless request model, we construct the prompt manually or use a fresh chat session.
    
    // Using `ai.chats.create` is better for maintaining conversation history state automatically
    // provided we can inject the system instruction.
    
    // However, since we might inject an image at any point (stateless injection for the current turn),
    // we will construct the contents array manually to include history + current payload.

    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Prepare current user message parts
    const currentParts: any[] = [{ text: newMessage }];

    // If there is an image attached to this specific turn
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
        temperature: 0.7, // Balanced creativity for teaching
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response. Please try again.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to communicate with the tutor.");
  }
};