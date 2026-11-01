import React from "react";

/**
 * Tester bottles standing together, from their photos: each is cropped to its
 * bottle and the white studio background melts into the light panel.
 */
export default function SetBottles({ testers, className = "" }) {
  return (
    <div className={`flex items-end justify-center overflow-hidden rounded-xl bg-[#EDEEEE] px-3 pt-4 ${className}`} aria-hidden="true">
      {testers.map((tester) => (
        <img
          key={tester.id}
          src={tester.plainImage || tester.image}
          alt=""
          loading="lazy"
          className="-mx-[2.5%] aspect-[9/20] w-[23%] object-cover mix-blend-multiply [-webkit-mask-image:linear-gradient(90deg,transparent,#000_32%,#000_68%,transparent)] [mask-image:linear-gradient(90deg,transparent,#000_32%,#000_68%,transparent)]"
        />
      ))}
    </div>
  );
}
