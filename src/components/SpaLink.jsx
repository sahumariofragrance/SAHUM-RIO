import React from "react";

export function shouldUseClientNavigation(event) {
  return !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey;
}

export default function SpaLink({ href, onNavigate, children, ...props }) {
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (!shouldUseClientNavigation(event)) return;
        event.preventDefault();
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}
