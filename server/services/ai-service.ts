import OpenAI from "openai";
import { logger } from '../utils/logger';

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key",
    });
  }

  async generateResponse(prompt: string, userName: string = 'Usuario'): Promise<string> {
    try {
      const systemPrompt = `Eres MoJiTo-MD, un bot de WhatsApp divertido y útil creado por mojitopro. 
      Tu personalidad es alegre, usar emojis frecuentemente, y tienes el lema "Bailalo Rocky 🎶".
      Siempre eres servicial y respondes en español de manera amigable.
      El usuario se llama ${userName}.`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0].message.content || "Lo siento, no pude procesar tu mensaje.";
    } catch (error) {
      logger.error('Error generating AI response:', error);
      return "🤖 Lo siento, hay un problema temporal con la IA. Intenta de nuevo más tarde.";
    }
  }

  async analyzeImage(base64Image: string): Promise<string> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analiza esta imagen y describe lo que ves de manera divertida y con emojis, como si fueras MoJiTo-MD bot."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        max_tokens: 300,
      });

      return response.choices[0].message.content || "No pude analizar la imagen 😅";
    } catch (error) {
      logger.error('Error analyzing image:', error);
      return "🖼️ Lo siento, no pude analizar la imagen en este momento.";
    }
  }

  async generateMeme(topic: string): Promise<string> {
    try {
      const prompt = `Genera un meme divertido sobre ${topic}. Solo devuelve el texto del meme con emojis.`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.9,
      });

      return response.choices[0].message.content || "😂 Error generando meme";
    } catch (error) {
      logger.error('Error generating meme:', error);
      return "😅 No pude generar un meme ahora, pero aquí tienes un chiste: ¿Por qué los bots nunca se ríen? ¡Porque no tienen sentido del humor!";
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const prompt = `Traduce el siguiente texto a ${targetLanguage}: "${text}"`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
      });

      return response.choices[0].message.content || "No pude traducir el texto";
    } catch (error) {
      logger.error('Error translating text:', error);
      return "🌐 Error al traducir el texto. Intenta de nuevo más tarde.";
    }
  }

  async generateTriviaQuestion(): Promise<{ question: string; options: string[]; answer: string }> {
    try {
      const prompt = `Genera una pregunta de trivia divertida con 4 opciones (A, B, C, D) y la respuesta correcta. 
      Formato JSON: {"question": "pregunta", "options": ["A) opción1", "B) opción2", "C) opción3", "D) opción4"], "answer": "A) respuesta correcta"}`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result;
    } catch (error) {
      logger.error('Error generating trivia question:', error);
      return {
        question: "¿Cuál es el lema de MoJiTo-MD?",
        options: ["A) Bailalo Rocky", "B) Vamos bot", "C) Hola mundo", "D) WhatsApp rules"],
        answer: "A) Bailalo Rocky"
      };
    }
  }
}
