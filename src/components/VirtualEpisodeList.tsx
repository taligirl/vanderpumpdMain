import React, { useEffect, useMemo, useRef, useState } from 'react';

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
  const [rowHeight, setRowHeight] = useState(estimateHeight);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(Math.min(4, items.length));
  }, [items.length]);

  useEffect(() => {
    const el = containerRef.current;
    const firstItem = el?.querySelector('li');
    if (!el || !firstItem) return;

    const measure = () => {
      const rect = firstItem.getBoundingClientRect();
      if (rect.height > 0) {
        setRowHeight(rect.height);
      }
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(firstItem);

    return () => resizeObserver.disconnect();
  }, [visibleCount, items.length]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const canScroll = el.scrollHeight - el.clientHeight > 8;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;

    if (canScroll && nearBottom && visibleCount < items.length) {
      setVisibleCount((prev) => Math.min(items.length, prev + 4));
    }
  };

  const visible = items.slice(0, visibleCount);
  const maxRows = 4;
  const padding = 8;
  const border = 1;
  const gap = 12;
  const chromeHeight = padding * 2 + border * 2;

  const viewportHeight = useMemo(() => {
    const rows = Math.min(items.length, maxRows);
    const measured = rows > 0 ? rowHeight * rows + gap * Math.max(0, rows - 1) + chromeHeight : 0;
    const capped = rowHeight * maxRows + gap * (maxRows - 1) + chromeHeight;

    return rows < maxRows ? measured : capped;
  }, [items.length, maxRows, rowHeight, gap, chromeHeight]);

  return (
    <div
      onScroll={onScroll}
      className="browse-episode-list"
      style={{
        position: 'relative',
        maxHeight: viewportHeight,
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
