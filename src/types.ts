export type ImageRatio = '4:3' | '1:1' | '3:4';

export interface GeneratedImage {
  prompt: string;
  ratio: ImageRatio;
  url: string;
  id?: number;
  wordpressUrl?: string;
}

export interface ListicleItem {
  title: string;
  description: string;
  image_prompt: string;
}

export interface ListicleItemWithImage extends ListicleItem {
  image: GeneratedImage | null;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ArticleResponse {
  introduction: string;
  featured_image_prompt: string;
  listicle: ListicleItem[];
  faq: FaqItem[];
  conclusion: string;
  slug: string;
  focus_keyphrase: string;
  meta_description: string;
}

export interface WebsiteCredentials {
  id: string;
  name: string;
  url: string;
  username: string;
  applicationPassword: string;
}

export interface AppSettings {
  geminiApiKey: string;
  ideogramApiKey: string;
  websites: WebsiteCredentials[];
}

export interface GeneratedArticleState {
  response: ArticleResponse | null;
  featuredImage: GeneratedImage | null;
  listicleImages: Record<number, GeneratedImage | null>;
}
