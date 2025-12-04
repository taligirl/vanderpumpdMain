import React, { useEffect, useState } from 'react';

export function VirtualEpisodeList<T>({
  items,
  estimateHeight = 180,
  render,
}: {
  items: T[];
  estimateHeight?: number;
  render: (item: T, index: number) => React.ReactNode;
}) {
  const [visibleCount, setVisibleCount] = useState(Math.min(4, items.length));

  useEffect(() => {
    setVisibleCount(Math.min(4, items.length));
  }, [items.length]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.target as HTMLDivElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;

    if (nearBottom) {
      setVisibleCount((prev) => Math.min(items.length, prev + 4));
    }
  };

  const visible = items.slice(0, visibleCount);
  const viewportHeight = estimateHeight * 4 + 36 + 16;

  return (
    <div
      onScroll={onScroll}
      className="browse-episode-list"
      style={{
        position: 'relative',
        height: viewportHeight,
        overflow: 'auto',
        border: '1px solid #333',
        borderRadius: 12,
        padding: 8,
        background: '#121212',
      }}
      aria-label="Episode results"
    >
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gap: 12,
        }}
      >
        {visible.map((item, i) => render(item, i))}
      </ul>
    </div>
  );
}
