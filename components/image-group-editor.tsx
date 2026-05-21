'use client';
import { useState } from 'react';
import { X, Upload, PlusCircle, RefreshCw, Link2 } from 'lucide-react';

export type ImageGroup = { label: string; urls: string[] };

type Props = {
  groups: ImageGroup[];
  uploading: boolean;
  uploadingGroup: number | null;
  onLabelChange: (groupIdx: number, label: string) => void;
  onAddImage: (groupIdx: number, url: string) => void;
  onRemoveImage: (groupIdx: number, imgIdx: number) => void;
  onAddGroup: () => void;
  onRemoveGroup: (groupIdx: number) => void;
  onTriggerUpload: (groupIdx: number) => void;
};

export function ImageGroupEditor({
  groups,
  uploading,
  uploadingGroup,
  onLabelChange,
  onAddImage,
  onRemoveImage,
  onAddGroup,
  onRemoveGroup,
  onTriggerUpload,
}: Props) {
  // active thumbnail index per group
  const [activeMap, setActiveMap] = useState<Record<number, number>>({});
  // "paste url" input value per group
  const [urlInputs, setUrlInputs] = useState<Record<number, string>>({});
  // whether the url paste row is visible per group
  const [showUrl, setShowUrl] = useState<Record<number, boolean>>({});

  function getActive(gi: number) {
    const len = groups[gi]?.urls.length ?? 0;
    return len === 0 ? 0 : Math.min(activeMap[gi] ?? 0, len - 1);
  }

  function setActive(gi: number, ii: number) {
    setActiveMap((prev) => ({ ...prev, [gi]: ii }));
  }

  function handleRemoveImage(gi: number, ii: number) {
    const cur = getActive(gi);
    if (cur >= ii && cur > 0) setActive(gi, cur - 1);
    onRemoveImage(gi, ii);
  }

  function handlePasteUrl(gi: number) {
    const url = urlInputs[gi]?.trim();
    if (!url) return;
    onAddImage(gi, url);
    setUrlInputs((p) => ({ ...p, [gi]: '' }));
    setShowUrl((p) => ({ ...p, [gi]: false }));
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group, gi) => {
        const images = group.urls;
        const active = getActive(gi);
        const isUploading = uploading && uploadingGroup === gi;

        return (
          <div key={gi} className="border border-gray-100 bg-white overflow-hidden">

            {/* ── Label row ── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
              <input
                value={group.label}
                onChange={(e) => onLabelChange(gi, e.target.value)}
                placeholder="Kit label — e.g. Home Kit, Away Kit, Red Colorway"
                className="flex-1 text-[13px] outline-none bg-transparent placeholder:text-[#aaa]"
              />
              {groups.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveGroup(gi)}
                  className="text-[#aaa] hover:text-black transition-colors shrink-0"
                  title="Remove this image group"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* ── Gallery ── */}
            <div className="p-4">
              {images.length > 0 ? (
                <div className="flex gap-3">

                  {/* Thumbnail strip — same layout as the storefront product page */}
                  <div className="flex flex-col gap-2 shrink-0 w-[60px]">
                    {images.map((url, ii) => (
                      <div key={ii} className="relative group/thumb">
                        <button
                          type="button"
                          onClick={() => setActive(gi, ii)}
                          className={`w-full block overflow-hidden border-[2px] transition-colors ${
                            active === ii
                              ? 'border-black'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          style={{ aspectRatio: '1 / 1' }}
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                        {/* Remove overlay */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(gi, ii)}
                          className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 bg-black text-white rounded-full
                                     flex items-center justify-center
                                     opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}

                    {/* Upload-another slot */}
                    <button
                      type="button"
                      onClick={() => onTriggerUpload(gi)}
                      disabled={isUploading}
                      title="Upload another image"
                      className="w-full border border-dashed border-gray-200 hover:border-black flex items-center
                                 justify-center transition-colors disabled:opacity-40 text-[#696969]"
                      style={{ aspectRatio: '1 / 1' }}
                    >
                      {isUploading ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-xl leading-none font-light">+</span>
                      )}
                    </button>
                  </div>

                  {/* Main image preview — 4:5 like the storefront */}
                  <div
                    className="flex-1 bg-gray-100 overflow-hidden"
                    style={{ aspectRatio: '4 / 5' }}
                  >
                    <img
                      src={images[active]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                /* Empty — upload CTA */
                <button
                  type="button"
                  onClick={() => onTriggerUpload(gi)}
                  disabled={isUploading}
                  className="w-full flex flex-col items-center justify-center gap-2 py-10
                             border border-dashed border-gray-200 bg-gray-50
                             hover:border-black hover:bg-white transition-colors disabled:opacity-40"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-5 w-5 text-[#696969] animate-spin" />
                      <span className="text-[12px] text-[#696969]">Uploading…</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-[#696969]" />
                      <span className="text-[13px] font-medium">Upload image</span>
                      <span className="text-[11px] text-[#aaa]">Click to select a file from your device</span>
                    </>
                  )}
                </button>
              )}

              {/* ── Action bar (below gallery) ── */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => onTriggerUpload(gi)}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 text-[12px] text-[#696969] hover:text-black transition-colors disabled:opacity-40"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {isUploading ? 'Uploading…' : images.length > 0 ? 'Upload another' : 'Upload from device'}
                </button>

                <span className="text-[#ddd]">|</span>

                <button
                  type="button"
                  onClick={() => setShowUrl((p) => ({ ...p, [gi]: !p[gi] }))}
                  className="flex items-center gap-1.5 text-[12px] text-[#696969] hover:text-black transition-colors"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Paste URL
                </button>
              </div>

              {/* URL paste input — shown when toggled */}
              {showUrl[gi] && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    value={urlInputs[gi] ?? ''}
                    onChange={(e) => setUrlInputs((p) => ({ ...p, [gi]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePasteUrl(gi))}
                    placeholder="https://res.cloudinary.com/..."
                    className="flex-1 border-b border-gray-200 py-1.5 text-[11px] font-mono outline-none
                               focus:border-black bg-transparent placeholder:text-[#aaa]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handlePasteUrl(gi)}
                    className="text-[12px] font-medium px-3 py-1.5 bg-black text-white hover:bg-black/80 transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add image group */}
      <button
        type="button"
        onClick={onAddGroup}
        className="flex items-center gap-1.5 text-[13px] text-[#696969] hover:text-black transition-colors"
      >
        <PlusCircle className="h-4 w-4" /> Add image group
      </button>
    </div>
  );
}
