import type { ArticleResponse } from '../types';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiCandidate {
  content: {
    parts: Array<{ text?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

function buildPrompt(title: string) {
  return `You are an expert home decor copywriter creating JSON only responses. Follow these rules strictly:\n\n- Output must be a single JSON object.\n- Obey the provided schema exactly.\n- Never include human beings in the imagery prompts.\n- The article theme is home decor.\n\nReturn creative yet practical content for the article title: "${title}".`;
}

export async function generateArticleFromGemini(title: string, apiKey: string): Promise<ArticleResponse> {
  if (!apiKey) {
    throw new Error('Gemini API key missing. Add it in Settings to generate content.');
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: buildPrompt(title),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content.parts?.map((part) => part.text ?? '').join('').trim();

  if (!text) {
    throw new Error('Gemini response was empty. Try again or adjust the prompt.');
  }

  try {
    const json = JSON.parse(text) as ArticleResponse;
    return json;
  } catch (error) {
    console.error('Gemini JSON parse error', error, text);
    throw new Error('Unable to parse Gemini response as JSON.');
  }
}
