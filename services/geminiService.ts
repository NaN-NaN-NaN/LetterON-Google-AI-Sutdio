

import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Letter, SenderInfo, LetterCategory, ChatMessage } from "../types";
import { TOP_LANGUAGES } from "../constants";

// This is a placeholder for the API key.
// In a real application, this would be handled securely.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("Gemini API key not found. Using mock data. Please set the API_KEY environment variable.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Mock data for when API key is not available
const MOCK_ANALYSIS_RESULT = {
    title: "Mock Utility Bill",
    category: LetterCategory.UTILITY,
    sender_info: {
        name: "City Power & Light",
        address: "123 Energy Way, Metropolis",
        phone: "1-800-555-1234",
        email: "billing@citypower.com",
    },
    ai_summary: "This is a monthly electricity bill for the period of October. The total amount due is €120 and must be paid by November 15, 2025.",
    ai_suggestion: "Pay €120 to IBAN DE49 3704 0044 0532 0130 00 before 2025/11/15.",
    ai_suggestion_action_deadline_date: "2025-11-15",
};

const MOCK_LETTER_CONTENT = `
City Power & Light
123 Energy Way, Metropolis
billing@citypower.com
1-800-555-1234

Date: 2025-10-20

To: Jane Doe
456 Residence Ave
Metropolis

Customer ID: CUST-98765

Subject: Your Monthly Electricity Bill

Dear Jane Doe,

This is your bill for electricity usage from Sep 15, 2025 to Oct 15, 2025.

Total Amount Due: €120
Due Date: 2025-11-15

Please pay the amount by the due date to avoid any late fees. 
Payment can be made via bank transfer to the following account:
IBAN: DE49 3704 0044 0532 0130 00

Thank you for being a valued customer.

Sincerely,
City Power & Light
`;

// FIX: Added a robust JSON parser for Gemini's response, which can sometimes be wrapped in markdown.
function parseJsonFromGeminiResponse(text: string): any {
    text = text.trim();
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            return JSON.parse(jsonMatch[1]);
        } catch (error) {
            console.error("Failed to parse extracted JSON from Gemini response:", error);
        }
    }
    try {
        return JSON.parse(text);
    } catch (error) {
        console.error("Failed to parse raw text as JSON from Gemini response", error);
        throw new Error("AI returned an invalid JSON format.");
    }
}

export const analyzeLetterContent = async (
    images: string[],
    translationLanguage?: string
): Promise<Partial<Letter>> => {
    if (!ai) {
        console.log("Using mock data for letter analysis.");
        await new Promise(res => setTimeout(res, 2000));
        return {
            ...MOCK_ANALYSIS_RESULT,
            content: MOCK_LETTER_CONTENT,
            sent_at: "2025-10-20"
        } as any;
    }

    const imageParts = images.map(imageDataUrl => {
        const [meta, base64Data] = imageDataUrl.split(',');
        if (!meta || !base64Data) {
            console.error("Invalid base64 image format", imageDataUrl.substring(0, 30));
            throw new Error("Invalid base64 image format");
        }
        const mimeType = meta.split(';')[0].split(':')[1];
        return {
            inlineData: {
                mimeType,
                data: base64Data,
            },
        };
    });

    const languageName = translationLanguage ? TOP_LANGUAGES.find(l => l.code === translationLanguage)?.name || translationLanguage : '';

    const promptText = `
    System Instruction: You are an expert administrative assistant specializing in analyzing official and personal letters from images. Your task is to perform OCR on the images, extract specific information from the transcribed text, and return it in a structured JSON format. The user may be a non-native speaker, so summaries and suggestions should be clear, simple, and direct.

    Analyze the content from the provided images and provide all the information requested in the JSON schema.
    First, perform OCR to get the full_text.
    Then, detect the dominant language of the full_text. It's crucial that you generate the 'title', 'ai_summary', and 'ai_suggestion' fields in that same detected language.
    If a piece of information is not present, use an empty string "" or null for dates.
    Dates must be in YYYY-MM-DD format.
    ${translationLanguage ? `Additionally, translate the 'full_text', 'ai_summary', and 'ai_suggestion' fields into ${languageName} and provide them in a 'translation' object.` : ''}
    `;
    
    const contents = { parts: [...imageParts, { text: promptText }] };

    const dynamicSchema: any = {
        type: Type.OBJECT,
        properties: {
            full_text: {
                type: Type.STRING,
                description: "The full transcribed text from the letter, preserving line breaks and original language."
            },
            title: {
                type: Type.STRING,
                description: "A short, descriptive title for the letter, under 10 words."
            },
            category: {
                type: Type.STRING,
                description: `The category of the letter. Must be one of: ${Object.values(LetterCategory).join(', ')}.`
            },
            sender_info: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Sender's name or organization name." },
                    address: { type: Type.STRING, description: "Sender's full address." },
                    phone: { type: Type.STRING, description: "Sender's phone number." },
                    email: { type: Type.STRING, description: "Sender's email address." },
                    sent_at: { type: Type.STRING, description: "Date the letter was sent, in YYYY-MM-DD format." }
                },
            },
            ai_summary: {
                type: Type.STRING,
                description: "A concise summary of the letter's main purpose in 2-3 sentences."
            },
            ai_suggestion: {
                type: Type.STRING,
                description: "A clear, actionable suggestion for the user. e.g., 'Pay €50.00 to IBAN X by YYYY-MM-DD.'"
            },
            ai_suggestion_action_deadline_date: {
                type: Type.STRING,
                description: "The deadline for the suggested action in YYYY-MM-DD format. Null if no deadline."
            },
        }
    };

    if (translationLanguage) {
        dynamicSchema.properties.translation = {
            type: Type.OBJECT,
            description: `Translated content, summary, and suggestion into ${languageName}.`,
            properties: {
                content: { type: Type.STRING, description: `The full translated content of the letter.` },
                summary: { type: Type.STRING, description: `The translated summary.` },
                suggestion: { type: Type.STRING, description: `The translated suggestion.` },
            },
            required: ['content', 'summary', 'suggestion']
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: dynamicSchema,
            },
        });

        const resultJson = parseJsonFromGeminiResponse(response.text);

        // FIX: Destructure sender_info to separate sent_at for better type safety.
        const { sent_at, ...senderInfo } = resultJson.sender_info || {};

        const letterData: Partial<Letter> = {
            title: resultJson.title,
            content: resultJson.full_text,
            category: resultJson.category as LetterCategory,
            sender_info: senderInfo,
            sent_at: sent_at,
            ai_summary: resultJson.ai_summary,
            ai_suggestion: resultJson.ai_suggestion,
            ai_suggestion_action_deadline_date: resultJson.ai_suggestion_action_deadline_date,
            translations: {},
        };
        
        if (resultJson.translation && translationLanguage) {
            letterData.translations = {
                [translationLanguage]: resultJson.translation
            };
        }

        return letterData;
    } catch (error) {
        console.error("Error analyzing letter with Gemini:", error);
        throw new Error("Failed to analyze letter content. The document might not be a valid letter or the image quality is poor.");
    }
};

export const translateLetterDetails = async (
    details: { content: string; summary: string; suggestion: string },
    languageCode: string
): Promise<{ content: string; summary: string; suggestion: string }> => {
    if (!ai) {
        await new Promise(res => setTimeout(res, 1500));
        const languageName = TOP_LANGUAGES.find(l => l.code === languageCode)?.name || languageCode;
        return {
            content: `[Mock Translation to ${languageName}] ${details.content}`,
            summary: `[Mock Translation to ${languageName}] ${details.summary}`,
            suggestion: `[Mock Translation to ${languageName}] ${details.suggestion}`,
        };
    }
    
    const languageName = TOP_LANGUAGES.find(l => l.code === languageCode)?.name || languageCode;
    
    const translationSchema = {
        type: Type.OBJECT,
        properties: {
            content: { type: Type.STRING, description: `The full translated content of the letter.` },
            summary: { type: Type.STRING, description: `The translated summary.` },
            suggestion: { type: Type.STRING, description: `The translated suggestion.` },
        },
        required: ['content', 'summary', 'suggestion']
    };

    const prompt = `Translate the following JSON values into ${languageName}. Return the response in the provided JSON schema. Do not translate the JSON keys.
    
    Original Text:
    ${JSON.stringify(details, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: translationSchema,
            },
        });
        return parseJsonFromGeminiResponse(response.text);
    } catch (error) {
        console.error("Error translating details with Gemini:", error);
        throw new Error("Failed to translate details.");
    }
};

export const startChat = (letter: Letter, history: ChatMessage[]): Chat | null => {
    if (!ai) {
        console.log("Using mock chat.");
        return null;
    }

    const systemInstruction = `You are a helpful AI assistant. You are having a conversation with a user about a specific letter.
    Here is the context of the letter:
    ---
    Title: ${letter.title}
    Summary: ${letter.ai_summary}
    Content: ${letter.content}
    ---
    Your previous suggestion was: ${letter.ai_suggestion}.
    Answer the user's questions based on this context and your previous conversation history. Be clear and helpful.`;
    
    const chatHistory = history
        .filter(msg => msg.role !== 'system') // Filter out system messages from history
        .map(msg => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: msg.message }]
        }));

    const chatInstance = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        history: chatHistory,
    });
    return chatInstance;
};

export const sendChatMessage = async (chatInstance: Chat | null, message: string): Promise<string> => {
    if (!chatInstance) {
        await new Promise(res => setTimeout(res, 1000));
        return "This is a mock AI response. Since the Gemini API key is not configured, I'm providing this placeholder answer. In a real scenario, I would answer your question based on the letter's content.";
    }
    
    // FIX: The sendMessage method expects an object with a 'message' property.
    const response = await chatInstance.sendMessage({ message });
    return response.text;
};