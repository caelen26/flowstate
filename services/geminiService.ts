
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI } from "@google/genai";

const getSystemInstruction = (userContext?: string) => {
  let baseInstruction = `You are "FlowState", a Water Conservation Specialist and Sustainability Guide. 
  Your tone is encouraging, knowledgeable, grounded, and calm.
  
  Your goal is to help users understand their water footprint and provide actionable advice to reduce it.
  
  Key facts you know:
  - Average shower: 8.0 L per minute.
  - Bath: ~115 L.
  - Washing machine: ~53 L per load (HE) to 76 L (Standard).
  - Virtual water of a cotton t-shirt: ~2700 L.
  - Beef: ~15944 L per kg (or ~1700 L per meal).
  
  When users ask for tips, give specific, high-impact advice (e.g., "Install a low-flow aerator," "Fix that dripping faucet," "Eat one less burger a week").
  If they share their usage data, praise their efforts and suggest one improvement.
  Keep answers concise (under 3-4 sentences) to fit the chat UI.`;

  if (userContext) {
    baseInstruction += `\n\nIMPORTANT: You are currently talking to a logged-in user. 
    Here is their current personal water usage data, including calculated litres per week.
    
    Use the "L/week" (litres per week) figures to identify their BIGGEST impact areas. 
    Comparison: Focus on the items with the highest litre usage. 
    If their "Virtual Usage" is higher than "Direct Usage", mention that diet or shopping might be a better place to start than shorter showers.
    
    USER DATA:
    ${userContext}`;
  }

  return baseInstruction;
};

export const sendMessageToGemini = async (
    history: {role: string, text: string}[], 
    newMessage: string,
    userContext?: string
): Promise<string> => {
  try {
    let apiKey: string | undefined;
    
    try {
      apiKey = process.env.API_KEY;
    } catch (e) {
      console.warn("Accessing process.env failed");
    }
    
    if (!apiKey) {
      return "I'm sorry, I cannot connect to the network right now. (Missing API Key)";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: getSystemInstruction(userContext),
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I apologize, but I am unable to access the conservation database at the moment.";
  }
};
