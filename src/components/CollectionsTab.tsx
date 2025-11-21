import React from 'react';
import type { Episode } from '../types';
import { NewCollectionForm } from './NewCollectionForm';

type CustomCollection = {
  id: string;
  name: string;
  keywords: string[];
  episodeIds: string[];
  description?: string;
};

type CollectionsTabProps = {
  collections: CustomCollection[];
  setCollections: React.Dispatch<React.SetStateAction<CustomCollection[]>>;
  episodes: Episode[];
  setTab: (tab: string) => void;
  setQuery: (q: string) => void;
  setFunny: React.Dispatch<React.SetStateAction<any>>;
  setCollectionFilterId: (id: string) => void;
  updateCollection: (collectionId: string, patch: Partial<CustomCollection>) => void;
  addActivity: (item: any) => void;
  episodeTags: (ep: Episode) => any;
};

export function CollectionsTab({
  collections,
  setCollections,
  episodes,
  setTab,
  setQuery,
  setFunny,
  setCollectionFilterId,
  updateCollection,
  addActivity,
  episodeTags,
}: CollectionsTabProps) {
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Your Collections</h3>

      <NewCollectionForm
        onAdd={(c) =>
          setCollections((arr) => [
            { ...c, episodeIds: c.episodeIds || [] },
            ...arr,
          ])
        }
      />

      {collections.length === 0 && (
        <p style={{ color: '#bbb' }}>
          You don&apos;t have any custom collections yet.
        </p>
      )}

      {collections.length > 0 && (
        <ul className="episode-list">
          {collections.map((c) => {
            const manualCount = (c.episodeIds || []).length;
            return (
              <li key={c.id} className="episode-card">
                <div
                  className="episode-header"
                  style={{ alignItems: 'flex-start' }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>{c.name}</h3>
                    <p style={{ marginTop: 6 }}>
                      {(c.keywords || []).join(', ') || '(no keywords)'} ·{' '}
                      {manualCount} manual ep
                      {manualCount === 1 ? '' : 's'}
                    </p>
                    {c.description ? (
                      <p style={{ marginTop: 6, color: '#cdbbf3' }}>
                        {c.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="episode-actions" style={{ gap: 6 }}>
                    <button
                      type="button"
                      className="clear-btn"
                      onClick={() => {
                        const newName =
                          prompt('Rename collection', c.name) ?? c.name;
                        const kw =
                          prompt(
                            'Keywords (comma separated)',
                            (c.keywords || []).join(', ')
                          ) ?? (c.keywords || []).join(', ');
                        const desc =
                          prompt(
                            'Short description (optional)',
                            c.description || ''
                          ) ?? (c.description || '');

                        const cleanName = newName.trim();
                        const keywords = kw
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const cleanDesc = desc.trim() || '';

                        updateCollection(c.id, {
                          name: cleanName,
                          keywords,
                          description: cleanDesc,
                        });
                        addActivity({
                          type: 'collection_update',
                          detail: cleanName,
                        });
                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="clear-btn"
                      onClick={() => {
                        setCollections((arr) => arr.filter((x) => x.id !== c.id));
                      }}
                    >
                      Delete
                    </button>

                    <button
                      type="button"
                      className="clear-btn"
                      onClick={() => {
                        setTab('browse');
                        setQuery('');
                        setFunny({
                          costumes: false,
                          jaxShirtOff: false,
                          tequilaKatie: false,
                          vegas: false,
                          reunion: false,
                        } as any);
                        setCollectionFilterId(c.id);
                      }}
                    >
                      View in Browse
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Auto Collections */}
      <h3 style={{ marginTop: 18, marginBottom: 8 }}>Auto Collections</h3>
      <ul className="episode-list">
        {[
          { key: 'costumes', label: 'Costumes & Burlesque' },
          { key: 'jaxShirtOff', label: 'Jax Takes His Shirt Off' },
          { key: 'tequilaKatie', label: 'Tequila Katie Moments' },
          { key: 'vegas', label: 'Vegas Trips' },
          { key: 'reunion', label: 'Reunion Episodes' },
        ].map(({ key, label }) => {
          const items = episodes.filter((ep) => (episodeTags(ep) as any)[key]);
          return (
            <li key={key} className="episode-card">
              <div className="episode-header">
                <div>
                  <h3>{label}</h3>
                  <p>
                    {items.length} episode
                    {items.length === 1 ? '' : 's'} matched
                  </p>
                </div>
                <div className="episode-actions">
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => {
                      setTab('browse');
                      setQuery('');
                      setFunny({
                        costumes: false,
                        jaxShirtOff: false,
                        tequilaKatie: false,
                        vegas: false,
                        reunion: false,
                      } as any);
                      setTimeout(() => {
                        setFunny((f: any) => ({ ...f, [key]: true }));
                      }, 0);
                    }}
                  >
                    View in Browse
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
