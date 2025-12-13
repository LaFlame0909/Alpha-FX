import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

export const getStrategyTagSuggestion = async (notes: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on these trade notes, suggest a VERY short (1-2 words max) strategy tag (e.g., "Trend Pullback", "Breakout"). Output ONLY the tag. Notes: "${notes}"`
    });
    return response.text?.trim() || "Unknown";
  } catch (error: any) {
    if (error.message === 'API_KEY_MISSING') return "Set API Key in env";
    console.error("Gemini Error:", error);
    return "Error";
  }
};

export const getMarketBriefing = async (): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Provide a concise bullet-point summary of the top 3 high-impact Forex news events for today and their potential impact on major pairs (EURUSD, USDJPY, GBPUSD). Use Markdown formatting.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    let text = response.text || "Unable to fetch news.";
    // Extract grounding sources as per guidelines
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const sources = response.candidates[0].groundingMetadata.groundingChunks
            .map((c: any) => c.web?.uri)
            .filter((u: any) => u);
            
        if (sources.length > 0) {
            text += "\n\n**Sources:**\n" + sources.map((s: string) => `- ${s}`).join("\n");
        }
    }
    return text;

  } catch (error: any) {
    if (error.message === 'API_KEY_MISSING') return "⚠️ API Key missing. Please configure process.env.API_KEY.";
    console.error("Gemini Error:", error);
    return "Error retrieving market news.";
  }
};

export const analyzeTradeImage = async (base64Image: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: "Analyze this chart. Focus strictly on KEY PRICE LEVELS (Support/Resistance) and the directional BIAS (Bullish/Bearish/Neutral). Be concise. Use Markdown bullet points. Do not provide excessive reasoning or long paragraphs, just the actionable data." },
          { 
            inlineData: {
              mimeType: 'image/png', 
              data: cleanBase64
            }
          }
        ]
      }
    });
    return response.text || "No analysis generated.";
  } catch (error: any) {
    if (error.message === 'API_KEY_MISSING') return "⚠️ API Key missing. Please configure process.env.API_KEY.";
    console.error("Gemini Vision Error:", error);
    return "Error analyzing chart image.";
  }
};

export const chatWithCoach = async (message: string, contextTrades: Trade[]): Promise<string> => {
  try {
    const ai = getAIClient();
    const contextStr = JSON.stringify(contextTrades.slice(0, 20)); 
    const prompt = `
      You are an expert Forex Trading Coach. 
      Here is the user's recent trade history (last 20 trades): ${contextStr}.
      
      User Question: ${message}
      
      Answer strictly based on trading principles and the data provided. 
      IMPORTANT: Format your response using Markdown. Use bolding for key terms, bullet points for lists, and clear headers. Avoid long paragraphs. Keep it professional and concise.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "I couldn't generate a response.";
  } catch (error: any) {
    if (error.message === 'API_KEY_MISSING') return "⚠️ API Key missing. Please configure process.env.API_KEY.";
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to the coaching server.";
  }
};

export const analyzePsychology = async (entry: string, recentTrades: Trade[]): Promise<string> => {
    try {
        const ai = getAIClient();
        const contextStr = JSON.stringify(recentTrades.slice(0, 10));
        const prompt = `
          Analyze the psychology of this trader based on their journal entry: "${entry}" 
          and their recent trade results: ${contextStr}. 
          Look for signs of FOMO, revenge trading, hesitation, or overconfidence. 
          Format response in Markdown with bullet points for observations and actionable advice.
        `;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        return response.text || "Analysis failed.";
      } catch (error: any) {
        if (error.message === 'API_KEY_MISSING') return "⚠️ API Key missing. Please configure process.env.API_KEY.";
        console.error("Gemini Psycho Error:", error);
        return "Error analyzing psychology.";
      }
}