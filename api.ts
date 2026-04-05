import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
    }

    const { prompt, attachedFiles } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt가 필요합니다.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    let contents: any = prompt;

    if (attachedFiles?.length > 0) {
      contents = {
        parts: [
          { text: prompt },
          ...attachedFiles.map((f: any) => ({
            inlineData: {
              data: f.data,
              mimeType: f.mimeType,
            },
          })),
        ],
      };
    }

    const response = await ai.models.generateContentStream({
      model: 'gemini-3.1-pro-preview',
      contents,
    });

    // For simplicity in Express without SSE, we'll wait for the full text
    // If you need streaming, you'd use Server-Sent Events (SSE)
    let fullText = '';
    for await (const chunk of response) {
      if (chunk.text) fullText += chunk.text;
    }

    return res.json({ text: fullText });
  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err?.message || '기획안 생성 중 오류가 발생했습니다.' });
  }
});

export default router;
