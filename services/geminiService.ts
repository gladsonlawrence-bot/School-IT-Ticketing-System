
import { GoogleGenAI } from "@google/genai";
import { Ticket } from "../types";

export async function suggestSolution(ticket: Ticket) {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert school IT support agent. Analyze this ticket and provide a short, actionable 3-step solution or troubleshooting guide for the staff to follow. 
      Use Google Search to find the latest solutions for this specific hardware, software, or network issue if applicable.
      
      Category: ${ticket.category}
      Title: ${ticket.title}
      Description: ${ticket.description}
      ${ticket.customData ? `Additional Context: ${JSON.stringify(ticket.customData)}` : ''}`,
      config: {
        systemInstruction: "Keep advice professional, concise, and specific to a school environment. If you found specific documentation or helpful links, mention them.",
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => chunk.web?.uri).filter(Boolean) || [];
    
    return {
      text: response.text,
      sources: Array.from(new Set(groundingLinks)) as string[]
    };
  } catch (err) {
    console.error("Gemini Error:", err);
    return {
      text: "Could not generate an AI suggestion at this time.",
      sources: []
    };
  }
}
