// src/components/SafeImage.jsx
import React, { useState, useCallback } from "react";
import { canOptimize, optimizedSrc, optimizedSrcSet } from "../utils/optimizedImage";

const FALLBACK_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23f4f4f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%233f3f46'%3ENo Image%3C/text%3E%3C/svg%3E";

/**
 * SafeImage — graceful image with:
 *   - resized WebP versions of product photos (srcset + `sizes`), so each
 *     screen downloads only the width it needs
 *   - lazy loading (default) or eager for above-the-fold images
 *   - async decoding
 *   - fetchpriority="high" for LCP images (pass priority={true})
 *   - graceful fallback on error: optimized → original → placeholder
 */
const SafeImage = React.memo(({ src, alt, className, priority = false, sizes = "100vw", maxWidth = 1600, ...rest }) => {
  // How far down the fallback chain this src has gone: 0 optimized copy,
  // 1 original file, 2 placeholder. Sources that cannot be optimized start at 1.
  const optimized = canOptimize(src);
  const firstStage = optimized ? 0 : 1;
  const [failure, setFailure] = useState({ src, stage: firstStage });
  const stage = failure.src === src ? failure.stage : firstStage;
  const handleError = useCallback(() => {
    setFailure((current) => {
      const from = current.src === src ? current.stage : firstStage;
      return { src, stage: Math.min(from + 1, 2) };
    });
  }, [src, firstStage]);

  const useOptimized = optimized && stage === 0;
  const fallbackWidth = Math.min(maxWidth, 960);

  return (
    <img
      src={stage === 2 ? FALLBACK_SRC : useOptimized ? optimizedSrc(src, fallbackWidth) : src}
      srcSet={useOptimized ? optimizedSrcSet(src, maxWidth) : undefined}
      sizes={useOptimized ? sizes : undefined}
      alt={alt}
      onError={handleError}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchpriority={priority ? "high" : "auto"}
      className={className}
      {...rest}
    />
  );
});

SafeImage.displayName = "SafeImage";
export default SafeImage;
