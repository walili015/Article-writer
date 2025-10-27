import { useMemo, useState } from 'react';
import { ArticlePreview } from './components/ArticlePreview';
import { SettingsPanel } from './components/SettingsPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateArticleFromGemini } from './services/geminiService';
import { generateIdeogramImage } from './services/ideogramService';
import { pushArticleToWordPress } from './services/wordpressService';
import type {
  AppSettings,
  GeneratedArticleState,
  GeneratedImage,
  ImageRatio,
  WebsiteCredentials,
} from './types';

const defaultSettings: AppSettings = {
  geminiApiKey: '',
  ideogramApiKey: '',
  websites: [],
};

const defaultGeneratedArticle: GeneratedArticleState = {
  response: null,
  featuredImage: null,
  listicleImages: {},
};

type ActiveTab = 'generator' | 'settings';

type StatusState = {
  tone: 'neutral' | 'success' | 'error';
  message: string;
} | null;

const initialRatios: ImageRatio[] = ['1:1', '3:4'];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generator');
  const [settings, setSettings] = useLocalStorage('article-writer-settings', defaultSettings);
  const [title, setTitle] = useState('');
  const [articleState, setArticleState] = useState<GeneratedArticleState>(defaultGeneratedArticle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const [imageRatios, setImageRatios] = useState<Record<number, ImageRatio>>({});
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const websites = settings.websites;
  const selectedWebsite = useMemo(
    () => websites.find((website) => website.id === selectedWebsiteId) ?? null,
    [selectedWebsiteId, websites]
  );

  const canGenerate = title.trim().length > 4 && !isGenerating;

  const canPush =
    !isPushing &&
    !!articleState.response &&
    !!articleState.featuredImage &&
    Object.keys(articleState.listicleImages).length === articleState.response.listicle.length &&
    Object.values(articleState.listicleImages).every(Boolean) &&
    !!selectedWebsite;

  const handleGenerate = async () => {
    if (!canGenerate) {
      return;
    }

    setIsGenerating(true);
    setStatus({ tone: 'neutral', message: 'Generating article with Gemini…' });

    try {
      const article = await generateArticleFromGemini(title.trim(), settings.geminiApiKey);
      const featured = await generateIdeogramImage(article.featured_image_prompt, '4:3', settings.ideogramApiKey);

      const listRatios: Record<number, ImageRatio> = {};
      const imagePromises = article.listicle.map((item, index) => {
        const ratio = initialRatios[index % initialRatios.length];
        listRatios[index] = ratio;
        return generateIdeogramImage(item.image_prompt, ratio, settings.ideogramApiKey);
      });

      const listicleImages = await Promise.all(imagePromises);

      setImageRatios(listRatios);
      setArticleState({
        response: article,
        featuredImage: featured,
        listicleImages: listicleImages.reduce<Record<number, GeneratedImage | null>>((accumulator, image, index) => {
          accumulator[index] = image;
          return accumulator;
        }, {}),
      });
      setStatus({ tone: 'success', message: 'Draft generated successfully. Review the content before pushing live.' });
    } catch (error) {
      console.error(error);
      setStatus({ tone: 'error', message: error instanceof Error ? error.message : 'Failed to generate article.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateImage = async (index: number) => {
    if (!articleState.response) {
      return;
    }

    setRegeneratingIndex(index);
    setStatus({ tone: 'neutral', message: `Regenerating image #${index + 1}…` });

    try {
      const ratio = imageRatios[index] ?? '1:1';
      const newImage = await generateIdeogramImage(articleState.response.listicle[index].image_prompt, ratio, settings.ideogramApiKey);
      setArticleState((current) => ({
        ...current,
        listicleImages: { ...current.listicleImages, [index]: newImage },
      }));
      setStatus({ tone: 'success', message: `Image #${index + 1} regenerated.` });
    } catch (error) {
      console.error(error);
      setStatus({ tone: 'error', message: error instanceof Error ? error.message : 'Failed to regenerate image.' });
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleChangeRatio = (index: number, ratio: ImageRatio) => {
    setImageRatios((current) => ({ ...current, [index]: ratio }));
  };

  const handlePushToWordPress = async () => {
    if (!articleState.response || !articleState.featuredImage || !selectedWebsite) {
      return;
    }

    setIsPushing(true);
    setStatus({ tone: 'neutral', message: 'Uploading images to WordPress…' });

    try {
      const listicleImages = Object.values(articleState.listicleImages).map((image) => image!) as GeneratedImage[];
      const result = await pushArticleToWordPress(
        title.trim(),
        articleState.response,
        articleState.featuredImage,
        listicleImages,
        selectedWebsite as WebsiteCredentials
      );

      setStatus({ tone: 'success', message: `Draft created on ${selectedWebsite.name}. Status: ${result.status}.` });
    } catch (error) {
      console.error(error);
      setStatus({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to push the article to WordPress. Check console for details.',
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleReset = () => {
    setArticleState(defaultGeneratedArticle);
    setImageRatios({});
    setStatus(null);
    setSelectedWebsiteId('');
  };

  return (
    <div className="container">
      <header className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <div className="badge">Home Decor AI Studio</div>
          <h1 style={{ marginTop: '0.65rem' }}>Listicle Article Generator</h1>
          <p className="notice" style={{ maxWidth: '620px' }}>
            Generate structured listicle articles with Gemini, produce photorealistic imagery via Ideogram, and push polished
            drafts directly into WordPress as Gutenberg blocks.
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={handleReset}>
          Reset workspace
        </button>
      </header>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'generator' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('generator')}
        >
          Generator
        </button>
        <button className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('settings')}>
          Settings
        </button>
      </div>

      {status ? (
        <div className={`status-banner ${status.tone}`} style={{ marginBottom: '1.5rem' }}>
          <span>{status.message}</span>
          <button className="secondary-button" type="button" onClick={() => setStatus(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {activeTab === 'settings' ? (
        <SettingsPanel settings={settings} onChange={setSettings} />
      ) : (
        <div className="grid gap-4">
          <div className="card">
            <div className="section-title">Article Brief</div>
            <div className="grid gap-4">
              <div className="form-group">
                <label htmlFor="title">Article title</label>
                <input
                  id="title"
                  placeholder="e.g. 12 Serene Bedroom Styling Tricks for Calm Evenings"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="notice">
                The request sent to Gemini enforces a JSON-only response that includes introduction, listicle items, FAQs, and SEO metadata.
                All imagery prompts instruct the model to avoid people and keep content relevant to the home decor topic.
              </div>
              <div className="flex" style={{ gap: '1rem' }}>
                <button className="primary-button" type="button" onClick={handleGenerate} disabled={!canGenerate}>
                  {isGenerating ? 'Generating…' : 'Generate article'}
                </button>
                <button className="secondary-button" type="button" onClick={handleReset}>
                  Clear
                </button>
              </div>
            </div>
          </div>

          {articleState.response ? (
            <>
              <ArticlePreview
                title={title}
                article={articleState.response}
                featuredImage={articleState.featuredImage}
                listicleImages={articleState.listicleImages}
                onRegenerateImage={handleRegenerateImage}
                onChangeRatio={handleChangeRatio}
                ratios={imageRatios}
                regeneratingIndex={regeneratingIndex}
              />

              <div className="card">
                <div className="section-title">Push to Website</div>
                <div className="grid gap-4">
                  <div className="form-group">
                    <label htmlFor="website">Select WordPress website</label>
                    <select
                      id="website"
                      value={selectedWebsiteId}
                      onChange={(event) => setSelectedWebsiteId(event.target.value)}
                    >
                      <option value="">Choose destination…</option>
                      {websites.map((website) => (
                        <option key={website.id} value={website.id}>
                          {website.name}
                        </option>
                      ))}
                    </select>
                    <p className="notice">
                      Ensure the site allows cross-origin requests from this app. Drafts require the Yoast SEO plugin to capture the SEO
                      metadata.
                    </p>
                  </div>
                  <button className="primary-button" type="button" onClick={handlePushToWordPress} disabled={!canPush}>
                    {isPushing ? 'Pushing…' : 'Push article to WordPress'}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
