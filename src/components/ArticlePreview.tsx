import { extractIntroParagraphs, formatParagraphs } from '../lib/format';
import type { ArticleResponse, GeneratedImage } from '../types';

interface ArticlePreviewProps {
  title: string;
  article: ArticleResponse;
  featuredImage: GeneratedImage | null;
  listicleImages: Record<number, GeneratedImage | null>;
  onRegenerateImage: (index: number, ratio?: GeneratedImage['ratio']) => void;
  onChangeRatio: (index: number, ratio: GeneratedImage['ratio']) => void;
  ratios: Record<number, GeneratedImage['ratio']>;
  regeneratingIndex: number | null;
}

export function ArticlePreview({
  title,
  article,
  featuredImage,
  listicleImages,
  onRegenerateImage,
  onChangeRatio,
  ratios,
  regeneratingIndex,
}: ArticlePreviewProps) {
  const introParagraphs = extractIntroParagraphs(article.introduction);

  return (
    <div className="card article-preview">
      <div className="badge">Generated Draft</div>
      <h1>{title}</h1>
      {featuredImage ? (
        <div className="image-wrapper">
          <img src={featuredImage.url} alt={title} />
          <div className="image-overlay" />
        </div>
      ) : null}

      {introParagraphs.map((paragraph, index) => (
        <p key={`intro-${index}`}>{paragraph}</p>
      ))}

      <div className="listicle-grid">
        {article.listicle.map((item, index) => {
          const image = listicleImages[index];
          const ratio = ratios[index] ?? '1:1';
          const paragraphs = formatParagraphs(item.description);
          const isRegenerating = regeneratingIndex === index;

          return (
            <div className="listicle-item" key={item.title}>
              <h2>
                #{index + 1} {item.title}
              </h2>
              {image ? (
                <div className="image-wrapper">
                  <img src={image.url} alt={item.title} />
                </div>
              ) : (
                <div className="notice">Image pending...</div>
              )}
              <div className="flex gap-4" style={{ alignItems: 'center' }}>
                <label htmlFor={`ratio-${index}`} style={{ margin: 0 }}>
                  Ratio
                </label>
                <select
                  id={`ratio-${index}`}
                  value={ratio}
                  onChange={(event) => onChangeRatio(index, event.target.value as GeneratedImage['ratio'])}
                >
                  <option value="1:1">1:1</option>
                  <option value="3:4">3:4</option>
                </select>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => onRegenerateImage(index)}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? 'Regenerating…' : 'Regenerate image'}
                </button>
              </div>
              {paragraphs.map((paragraph, idx) => (
                <p key={`${item.title}-${idx}`}>{paragraph}</p>
              ))}
              <div>
                <div className="badge notice">Prompt</div>
                <p className="notice">{item.image_prompt}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ background: 'rgba(15,23,42,0.6)' }}>
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          {article.faq.map((faq) => (
            <div className="faq-item" key={faq.question}>
              <h3>{faq.question}</h3>
              {formatParagraphs(faq.answer).map((paragraph, index) => (
                <p key={`${faq.question}-${index}`}>{paragraph}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2>Conclusion</h2>
        {formatParagraphs(article.conclusion).map((paragraph, index) => (
          <p key={`conclusion-${index}`}>{paragraph}</p>
        ))}
      </div>

      <div className="card" style={{ background: 'rgba(15,23,42,0.6)' }}>
        <div className="grid gap-4">
          <div>
            <div className="badge">Slug</div>
            <p className="notice">{article.slug}</p>
          </div>
          <div>
            <div className="badge">Focus Keyphrase</div>
            <p className="notice">{article.focus_keyphrase}</p>
          </div>
          <div>
            <div className="badge">Meta Description</div>
            <p className="notice">{article.meta_description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
