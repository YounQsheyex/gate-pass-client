"use client";

import { useEffect, useRef, useState } from "react";
import { PUBLIC_API_URL, imageSrc } from "@/lib/config";
import { Alert, Button, Input } from "@/components/ui";

/**
 * Cover image picker: upload from the computer (preferred), or paste a direct image link.
 * Shows a live preview and says plainly when a link can't be displayed.
 */
export function CoverImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [showLink, setShowLink] = useState(Boolean(value) && !value.startsWith("/uploads/"));

  useEffect(() => setBroken(false), [value]);

  async function upload(file: File) {
    setError(null);
    if (file.size > 4 * 1024 * 1024) return setError("That image is over 4 MB. Choose a smaller one, or compress it first.");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${PUBLIC_API_URL}/api/admin/uploads`, { method: "POST", body, credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
      onChange(json.url);
      setShowLink(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const preview = imageSrc(value);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold">Cover image (optional)</span>

      {preview && (
        <div className="overflow-hidden rounded-xl border border-line bg-lilac">
          {broken ? (
            <p className="p-4 text-sm text-bad">
              This link doesn&rsquo;t open as an image, so buyers won&rsquo;t see it. Share links from Google Drive,
              Instagram or WhatsApp open a web page rather than the picture. Upload the image instead.
            </p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Cover preview" onError={() => setBroken(true)} className="aspect-[16/9] w-full object-cover" />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          id="cover-upload"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <Button type="button" variant="secondary" className="px-4 py-2 text-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? "Uploading…" : preview ? "Replace image" : "Upload image"}
        </Button>
        {!showLink && (
          <Button type="button" variant="ghost" className="px-4 py-2 text-sm" onClick={() => setShowLink(true)}>
            Use a link instead
          </Button>
        )}
        {preview && (
          <Button type="button" variant="ghost" className="px-4 py-2 text-sm text-bad" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
      </div>
      <span className="text-sm text-muted">JPG, PNG, WebP or GIF, up to 4 MB. A wide image (16:9) looks best.</span>

      {showLink && (
        <Input
          type="url"
          value={value.startsWith("/uploads/") ? "" : value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder="https://… (a direct link to the image file)"
          aria-label="Cover image link"
        />
      )}
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
