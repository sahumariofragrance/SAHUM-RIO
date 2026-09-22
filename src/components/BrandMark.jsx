import React from "react";

export default function BrandMark({ className = "", registeredClassName = "" }) {
  return (
    <span className={className}>
      SAHUMäRIO
      <sup
        className={"ml-[0.08em] inline-block align-super text-[0.34em] font-medium leading-none tracking-normal " + registeredClassName}
        aria-label="registered trademark"
      >
        ®
      </sup>
    </span>
  );
}
