import { useState, useRef, useCallback, type ReactNode } from 'react';

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

export function SplitPane({
  left,
  right,
  defaultLeftWidth = 320,
  minLeftWidth = 200,
  maxLeftWidth = 600,
}: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = moveEvent.clientX - containerRect.left;
        setLeftWidth(Math.min(maxLeftWidth, Math.max(minLeftWidth, newWidth)));
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [minLeftWidth, maxLeftWidth],
  );

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      {/* Left panel */}
      <div
        className="shrink-0 overflow-hidden"
        style={{ width: leftWidth }}
      >
        {left}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="relative z-10 w-1 shrink-0 cursor-col-resize bg-surface-700/50 transition-colors hover:bg-accent/50 active:bg-accent"
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      {/* Right panel */}
      <div className="min-w-0 flex-1 overflow-hidden">{right}</div>
    </div>
  );
}
