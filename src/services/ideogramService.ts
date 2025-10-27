import type { GeneratedImage, ImageRatio } from '../types';

const IDEOGRAM_ENDPOINT = 'https://api.ideogram.ai/images';

interface IdeogramResponse {
  data?: Array<{
    image_base64?: string;
    url?: string;
  }>;
  error?: { message: string };
}

const ratioToSize: Record<ImageRatio, { width: number; height: number }> = {
  '4:3': { width: 1600, height: 1200 },
  '1:1': { width: 1400, height: 1400 },
  '3:4': { width: 1350, height: 1800 },
};

export async function generateIdeogramImage(prompt: string, ratio: ImageRatio, apiKey: string): Promise<GeneratedImage> {
  if (!apiKey) {
    throw new Error('Ideogram API key missing. Add it in Settings to generate images.');
  }

  const size = ratioToSize[ratio];

  const response = await fetch(IDEOGRAM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'V_2',
      prompt,
      aspect_ratio: ratio,
      negative_prompt: 'humans, people, person, human figure, human faces, human silhouettes',
      width: size.width,
      height: size.height,
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ideogram API request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as IdeogramResponse;

  if (data.error) {
    throw new Error(`Ideogram error: ${data.error.message}`);
  }

  const base64 = data.data?.[0]?.image_base64;

  if (!base64) {
    throw new Error('Ideogram returned no image data.');
  }

  return {
    prompt,
    ratio,
    url: `data:image/jpeg;base64,${base64}`,
  };
}
