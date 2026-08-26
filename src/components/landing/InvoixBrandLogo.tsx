import React from 'react';

interface InvoixBrandLogoProps {
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showQuote?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * The Invoix brand mark — the real logo asset, not a redrawn approximation.
 *
 * Two variants exist because the source artwork is navy on white with no alpha,
 * which would render as a white rectangle on the dark theme:
 *   - invoix-logo-transparent.png  navy wordmark, transparent background (light UI)
 *   - invoix-logo-light.png        white wordmark, green tick preserved (dark UI)
 * Both are trimmed to the artwork bounds, so the mark fills its box.
 *
 * The wordmark is part of the image, so this renders no brand text of its own.
 * Adding a separate "Invoix" label alongside it duplicates the logotype.
 */

/** Trimmed artwork is 923×266. Width is derived so the browser reserves space. */
const LOGO_ASPECT = 923 / 266;

const HEIGHTS: Record<NonNullable<InvoixBrandLogoProps['size']>, number> = {
  sm: 26,
  md: 34,
  lg: 48,
};

export const InvoixBrandLogo: React.FC<InvoixBrandLogoProps> = ({
  theme = 'dark',
  size = 'md',
  showQuote = true,
  className = '',
  onClick,
}) => {
  const isDark = theme === 'dark';
  const height = HEIGHTS[size];
  const width = Math.round(height * LOGO_ASPECT);

  const mark = (
    <img
      src={isDark ? '/invoix-logo-light.png' : '/invoix-logo-transparent.png'}
      alt="Invoix"
      width={width}
      height={height}
      style={{ height, width }}
      className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
      /* Eager + high priority: this is above the fold and part of LCP. */
      loading="eager"
      decoding="async"
    />
  );

  const body = (
    <span className="inline-flex flex-col items-start">
      {mark}
      {showQuote && (
        <span
          className={`text-[10px] font-medium tracking-normal mt-1 whitespace-nowrap transition-colors ${
            isDark ? 'text-amber-300/90' : 'text-amber-700'
          }`}
        >
          Your Proposals. Their Applause<span className="text-amber-500">.</span>
        </span>
      )}
    </span>
  );

  // A clickable logo must be a real button: a div with onClick is invisible to
  // keyboard and screen-reader users.
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Invoix — go to home"
        className={`inline-flex items-center select-none cursor-pointer group bg-transparent border-0 p-0 ${className}`}
      >
        {body}
      </button>
    );
  }

  return (
    <span className={`inline-flex items-center select-none group ${className}`}>{body}</span>
  );
};
