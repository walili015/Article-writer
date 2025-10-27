# Article Writer

A dark-mode SaaS dashboard for generating AI-powered home decor listicle articles and publishing them to WordPress. The app orchestrates:

- Article drafting via the Gemini API (JSON-only responses)
- Photorealistic, people-free imagery via the Ideogram API
- Seamless push-to-WordPress workflow using the REST API and Gutenberg blocks

## Getting Started

```bash
npm install
npm run dev
```

The app stores API keys and WordPress credentials in local storage inside your browser. Nothing is persisted on the server.

## Configuration

Open the **Settings** tab to add:

- Gemini API key
- Ideogram API key
- One or more WordPress destinations (URL, username, application password)

Application passwords are recommended for secure Basic Authentication. Ensure your WordPress domain allows cross-origin requests from the host where this app is deployed.

## WordPress Integration

1. All images (featured + listicle) are uploaded to your WordPress media library first.
2. Gutenberg content is generated with headings, paragraphs, images, FAQs, and SEO metadata for Yoast.
3. Posts are saved as drafts so you can review them before publishing.

Yoast SEO must be installed to capture the focus keyphrase and meta description fields.

## Image Ratios

- Featured image: fixed at 4:3
- Listicle images: switch between 1:1 and 3:4 per item before or after regeneration

All prompts explicitly instruct the model to avoid people, keeping imagery focused on interiors and styling details.
