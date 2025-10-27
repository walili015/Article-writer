import { extractIntroParagraphs, formatParagraphs } from '../lib/format';
import type {
  ArticleResponse,
  GeneratedImage,
  WebsiteCredentials,
} from '../types';

interface UploadedImageMeta {
  id: number;
  source_url: string;
}

interface WordPressPostResponse {
  id: number;
  link: string;
  status: string;
}

function normaliseUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function uploadImage(
  website: WebsiteCredentials,
  image: GeneratedImage,
  alt: string,
  index: number,
  slug: string
): Promise<UploadedImageMeta> {
  const blob = await dataUrlToBlob(image.url);
  const filename = `${slug}-${index}-${Date.now()}.jpg`;
  const uploadUrl = `${normaliseUrl(website.url)}/wp-json/wp/v2/media`;
  const headers = new Headers();
  headers.append('Authorization', `Basic ${btoa(`${website.username}:${website.applicationPassword}`)}`);
  headers.append('Content-Disposition', `attachment; filename="${filename}"`);
  headers.append('Content-Type', blob.type || 'image/jpeg');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: blob,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload image to WordPress: ${response.status} ${errorText}`);
  }

  return (await response.json()) as UploadedImageMeta;
}

function buildBlockParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map(
      (paragraph) =>
        `<!-- wp:paragraph -->\n<p>${paragraph}</p>\n<!-- /wp:paragraph -->`
    )
    .join('\n\n');
}

function buildListicleBlocks(
  items: ArticleResponse['listicle'],
  images: UploadedImageMeta[]
) {
  return items
    .map((item, index) => {
      const media = images[index];
      const paragraphs = buildBlockParagraphs(formatParagraphs(item.description));

      return `<!-- wp:group -->
<div class="wp-block-group">
<!-- wp:heading {"level":2} -->
<h2>${index + 1}. ${item.title}</h2>
<!-- /wp:heading -->

<!-- wp:image {"id":${media.id},"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="${media.source_url}" alt="${item.title}" /></figure>
<!-- /wp:image -->

${paragraphs}
</div>
<!-- /wp:group -->`;
    })
    .join('\n\n');
}

function buildFaqBlocks(faq: ArticleResponse['faq']) {
  return faq
    .map((item) => {
      const paragraphs = buildBlockParagraphs(formatParagraphs(item.answer));
      return `<!-- wp:group -->
<div class="wp-block-group">
<!-- wp:heading {"level":3} -->
<h3>${item.question}</h3>
<!-- /wp:heading -->
${paragraphs}
</div>
<!-- /wp:group -->`;
    })
    .join('\n\n');
}

function buildConclusionBlocks(conclusion: string) {
  return buildBlockParagraphs(formatParagraphs(conclusion));
}

export async function pushArticleToWordPress(
  title: string,
  article: ArticleResponse,
  featuredImage: GeneratedImage,
  listicleImages: GeneratedImage[],
  website: WebsiteCredentials
) {
  if (!website.username || !website.applicationPassword || !website.url) {
    throw new Error('Website credentials are incomplete.');
  }

  const slug = article.slug;

  const uploadedFeatured = await uploadImage(website, featuredImage, title, -1, slug);
  const uploadedListicle = await Promise.all(
    listicleImages.map((image, index) => uploadImage(website, image, article.listicle[index]?.title ?? title, index, slug))
  );

  const introParagraphs = extractIntroParagraphs(article.introduction);
  const introBlocks = buildBlockParagraphs(introParagraphs);
  const listicleBlocks = buildListicleBlocks(article.listicle, uploadedListicle);
  const faqBlocks = buildFaqBlocks(article.faq);
  const conclusionBlocks = buildConclusionBlocks(article.conclusion);

  const content = `<!-- wp:heading -->
<h2>Introduction</h2>
<!-- /wp:heading -->
${introBlocks}

<!-- wp:separator -->
<hr class="wp-block-separator" />
<!-- /wp:separator -->

${listicleBlocks}

<!-- wp:heading {"level":2} -->
<h2>Frequently Asked Questions</h2>
<!-- /wp:heading -->
${faqBlocks}

<!-- wp:separator -->
<hr class="wp-block-separator" />
<!-- /wp:separator -->

<!-- wp:heading {"level":2} -->
<h2>Conclusion</h2>
<!-- /wp:heading -->
${conclusionBlocks}`;

  const postBody = {
    title,
    content,
    slug: article.slug,
    status: 'draft',
    featured_media: uploadedFeatured.id,
    meta: {
      _yoast_wpseo_focuskw: article.focus_keyphrase,
      _yoast_wpseo_metadesc: article.meta_description,
    },
  };

  const response = await fetch(`${normaliseUrl(website.url)}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${website.username}:${website.applicationPassword}`)}`,
    },
    body: JSON.stringify(postBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create WordPress draft: ${response.status} ${errorText}`);
  }

  return (await response.json()) as WordPressPostResponse;
}
