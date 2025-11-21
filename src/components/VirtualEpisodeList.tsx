import React, { useRef, useState } from 'react';

export function VirtualEpisodeList<T>({
  items,
  estimateHeight = 180,
  overscan = 6,
  render,
}: {
  items: T[];
  estimateHeight?: number;
  overscan?: number;
  render: (item: T, index: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  };

  const total = items.length;
  const height = estimateHeight * total;
  const viewport = ref.current?.clientHeight || 600;
  const startIndex = Math.max(0, Math.floor(scrollTop / estimateHeight) - overscan);
  const endIndex = Math.min(
    total,
    Math.ceil((scrollTop + viewport) / estimateHeight) + overscan
  );

  const top = startIndex * estimateHeight;
  const visible = items.slice(startIndex, endIndex);

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      style={{
        position: 'relative',
        height: 420,
        overflow: 'auto',
        border: '1px solid #333',
        borderRadius: 12,
        padding: 8,
        background: '#121212',
      }}
      aria-label="Episode results"
    >
      <div style={{ position: 'relative', height }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            transform: `translateY(${top}px)`,
          }}
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
            {visible.map((item, i) => render(item, startIndex + i))}
          </ul>
        </div>
      </div>
    </div>
  );
}
