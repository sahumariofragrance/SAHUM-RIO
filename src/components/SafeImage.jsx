// src/components/SafeImage.jsx
import React from "react";

export default function SafeImage({ src, alt, className, ...rest }) {
  const [err, setErr] = React.useState(false);
  const fallback = "/products/placeholder.jpg"; // keep a placeholder in public/products
  return (
    <img
      src={err ? fallback : src}
      alt={alt}
      onError={() => setErr(true)}
      loading="lazy"
      className={className}
      {...rest}
    />
  );
}