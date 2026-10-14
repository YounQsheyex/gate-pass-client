"use client";

import { useState } from "react";
import { imageSrc } from "@/lib/config";

/** Event cover image that quietly disappears if the link is broken, instead of showing a broken-image icon. */
export function EventImage({ src, className = "" }: { src: string | null | undefined; className?: string }) {
  const [failed, setFailed] = useState(false);
  const url = imageSrc(src);
  if (!url || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className={className} />
  );
}
