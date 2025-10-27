import { useMemo, useState } from 'react';
import type { AppSettings, WebsiteCredentials } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (value: AppSettings) => void;
}

const emptyWebsite: WebsiteCredentials = {
  id: '',
  name: '',
  url: '',
  username: '',
  applicationPassword: '',
};

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [draftWebsite, setDraftWebsite] = useState<WebsiteCredentials>(emptyWebsite);

  const canAddWebsite = useMemo(() => {
    return (
      draftWebsite.name.trim().length > 1 &&
      draftWebsite.url.trim().length > 5 &&
      draftWebsite.username.trim().length > 1 &&
      draftWebsite.applicationPassword.trim().length > 5
    );
  }, [draftWebsite]);

  const updateSettings = (changes: Partial<AppSettings>) => {
    onChange({ ...settings, ...changes });
  };

  const updateDraft = (changes: Partial<WebsiteCredentials>) => {
    setDraftWebsite((current) => ({ ...current, ...changes }));
  };

  const handleAddWebsite = () => {
    if (!canAddWebsite) {
      return;
    }

    const newWebsite: WebsiteCredentials = {
      ...draftWebsite,
      id: crypto.randomUUID(),
    };

    updateSettings({ websites: [...settings.websites, newWebsite] });
    setDraftWebsite(emptyWebsite);
  };

  const handleRemoveWebsite = (id: string) => {
    updateSettings({ websites: settings.websites.filter((website) => website.id !== id) });
  };

  return (
    <div className="card">
      <div className="section-title">Integrations &amp; API Keys</div>
      <div className="grid gap-4">
        <div className="form-group">
          <label htmlFor="gemini-key">Gemini API Key</label>
          <input
            id="gemini-key"
            type="password"
            placeholder="Paste your Gemini API key"
            value={settings.geminiApiKey}
            onChange={(event) => updateSettings({ geminiApiKey: event.target.value })}
          />
          <p className="notice">Stored locally in your browser. Required for article generation.</p>
        </div>
        <div className="form-group">
          <label htmlFor="ideogram-key">Ideogram API Key</label>
          <input
            id="ideogram-key"
            type="password"
            placeholder="Paste your Ideogram API key"
            value={settings.ideogramApiKey}
            onChange={(event) => updateSettings({ ideogramApiKey: event.target.value })}
          />
          <p className="notice">Stored locally in your browser. Required for image generation.</p>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: '2rem' }}>
        Connected WordPress Websites
      </div>
      <div className="grid-2 grid">
        {settings.websites.map((website) => (
          <div className="listicle-item" key={website.id}>
            <div>
              <div className="badge">{website.name}</div>
              <p className="muted" style={{ marginTop: '0.35rem' }}>
                {website.url}
              </p>
            </div>
            <div className="notice">
              Username: <strong>{website.username}</strong>
            </div>
            <button
              className="danger-button"
              type="button"
              onClick={() => handleRemoveWebsite(website.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: '2rem' }}>
        Add a new website
      </div>
      <div className="grid gap-4">
        <div className="form-group">
          <label htmlFor="site-name">Website name</label>
          <input
            id="site-name"
            placeholder="e.g. Cozy Loft Blog"
            value={draftWebsite.name}
            onChange={(event) => updateDraft({ name: event.target.value })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="site-url">Website URL</label>
          <input
            id="site-url"
            placeholder="https://your-site.com"
            value={draftWebsite.url}
            onChange={(event) => updateDraft({ url: event.target.value })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="site-username">WordPress Username</label>
          <input
            id="site-username"
            placeholder="Author username"
            value={draftWebsite.username}
            onChange={(event) => updateDraft({ username: event.target.value })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="site-app-password">Application Password</label>
          <input
            id="site-app-password"
            placeholder="xxxx xxxx xxxx xxxx"
            value={draftWebsite.applicationPassword}
            onChange={(event) => updateDraft({ applicationPassword: event.target.value })}
          />
        </div>
        <div>
          <button className="primary-button" type="button" onClick={handleAddWebsite} disabled={!canAddWebsite}>
            Add website
          </button>
        </div>
      </div>
    </div>
  );
}
