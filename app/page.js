"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const model = "gpt-image-2";

const promptPresets = [
  {
    name: "Product hero",
    prompt:
      "A premium studio product photograph of a modular desk lamp made from recycled aluminum, warm side lighting, soft shadows, clean background, realistic materials, editorial composition.",
  },
  {
    name: "App concept",
    prompt:
      "A polished mobile app launch poster for a calm AI scheduling assistant, crisp typography, abstract time-grid motif, modern SaaS visual language, high contrast, no logos.",
  },
  {
    name: "Interior mood",
    prompt:
      "A sunlit reading nook in a compact apartment, walnut shelves, linen chair, plants, ceramic mug, natural daylight, realistic architectural photography.",
  },
  {
    name: "Character sheet",
    prompt:
      "A friendly robot studio assistant character sheet, front view, side view, expressive poses, clean neutral background, production design annotations.",
  },
];

const sizes = [
  { value: "1024x1024", label: "Square", helper: "1024 x 1024" },
  { value: "1536x1024", label: "Landscape", helper: "1536 x 1024" },
  { value: "1024x1536", label: "Portrait", helper: "1024 x 1536" },
  { value: "2048x1152", label: "2K Wide", helper: "2048 x 1152" },
];

const qualities = [
  { value: "low", label: "Draft" },
  { value: "medium", label: "Balanced" },
  { value: "high", label: "Final" },
  { value: "auto", label: "Auto" },
];

const formats = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
];

function imageMime(format) {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  return "image/png";
}

function createDownloadName(format) {
  const extension = format === "jpeg" ? "jpg" : format;
  return `openai-image-${Date.now()}.${extension}`;
}

export default function Home() {
  const [prompt, setPrompt] = useState(promptPresets[0].prompt);
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("medium");
  const [format, setFormat] = useState("png");
  const [compression, setCompression] = useState(85);
  const [moderation, setModeration] = useState("auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);

  const selectedSize = useMemo(
    () => sizes.find((item) => item.value === size) ?? sizes[0],
    [size],
  );

  const activeImage = images[0];
  const charCount = prompt.trim().length;
  const canGenerate = charCount >= 8 && !isGenerating;

  async function generateImage(event) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError("Add a prompt before generating.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          size,
          quality,
          format,
          compression,
          moderation,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Image generation failed.");
      }

      const mime = imageMime(data.format || format);
      const image = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        src: `data:${mime};base64,${data.image}`,
        prompt: data.prompt || trimmedPrompt,
        revisedPrompt: data.revisedPrompt || "",
        size: data.size || size,
        quality: data.quality || quality,
        format: data.format || format,
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setImages((current) => [image, ...current].slice(0, 8));
    } catch (generationError) {
      setError(generationError.message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#141412]">
      <section className="grid min-h-screen w-full gap-3 p-3 sm:gap-4 sm:p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <aside className="border border-[#d9d3c8] bg-[#fffdfa] p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7d7469]">
                OpenAI Image API
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight">
                Image Generation Starter
              </h1>
            </div>
            <span className="border border-[#cfd8cf] bg-[#edf7ee] px-3 py-1 text-xs font-black text-[#25613c]">
              {model}
            </span>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={generateImage}>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#6f675f]">
                Prompt
              </span>
              <textarea
                className="min-h-44 resize-none border border-[#d9d3c8] bg-white p-3 text-sm font-medium leading-6 outline-none"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the image, style, subject, camera, lighting, composition, and constraints."
              />
              <span className="text-xs font-bold text-[#7d7469]">
                {charCount} characters
              </span>
            </label>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6f675f]">
                Presets
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {promptPresets.map((preset) => (
                  <button
                    className="border border-[#d9d3c8] bg-[#fbf7f0] px-3 py-2 text-left text-xs font-black text-[#403a34] transition hover:bg-white"
                    key={preset.name}
                    onClick={() => setPrompt(preset.prompt)}
                    type="button"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#6f675f]">
                  Size
                </span>
                <select
                  className="h-11 border border-[#d9d3c8] bg-white px-3 text-sm font-bold outline-none"
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                >
                  {sizes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label} / {item.helper}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#6f675f]">
                  Quality
                </span>
                <select
                  className="h-11 border border-[#d9d3c8] bg-white px-3 text-sm font-bold outline-none"
                  value={quality}
                  onChange={(event) => setQuality(event.target.value)}
                >
                  {qualities.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#6f675f]">
                  Format
                </span>
                <select
                  className="h-11 border border-[#d9d3c8] bg-white px-3 text-sm font-bold outline-none"
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                >
                  {formats.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#6f675f]">
                  Moderation
                </span>
                <select
                  className="h-11 border border-[#d9d3c8] bg-white px-3 text-sm font-bold outline-none"
                  value={moderation}
                  onChange={(event) => setModeration(event.target.value)}
                >
                  <option value="auto">Standard</option>
                  <option value="low">Less restrictive</option>
                </select>
              </label>
            </div>

            {format !== "png" ? (
              <label className="grid gap-2">
                <span className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.14em] text-[#6f675f]">
                  Compression
                  <span>{compression}%</span>
                </span>
                <input
                  className="accent-[#25613c]"
                  max="100"
                  min="0"
                  onChange={(event) => setCompression(Number(event.target.value))}
                  type="range"
                  value={compression}
                />
              </label>
            ) : null}

            {error ? (
              <p className="border border-[#e8b4a6] bg-[#fff2ed] p-3 text-sm font-bold leading-6 text-[#9c2b1c]">
                {error}
              </p>
            ) : null}

            <button
              className="h-12 bg-[#25613c] px-4 text-sm font-black text-white transition hover:bg-[#1e4f31] disabled:cursor-not-allowed disabled:bg-[#a9afa7]"
              disabled={!canGenerate}
              type="submit"
            >
              {isGenerating ? "Generating..." : "Generate image"}
            </button>
          </form>
        </aside>

        <section className="grid min-h-[70vh] gap-3 xl:grid-rows-[minmax(0,1fr)_auto]">
          <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="flex min-h-[28rem] flex-col overflow-hidden border border-[#d9d3c8] bg-[#fffdfa] shadow-sm">
              <header className="border-b border-[#e3ddd3] px-4 py-3 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7d7469]">
                      Preview
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">
                      {activeImage ? "Generated asset" : "Ready to generate"}
                    </h2>
                  </div>
                  <p className="text-sm font-bold text-[#6f675f]">
                    {selectedSize.helper} / {quality}
                  </p>
                </div>
              </header>

              <div className="grid min-h-0 flex-1 place-items-center bg-[#ebe7df] p-3 sm:p-5">
                {activeImage ? (
                  <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="grid place-items-center overflow-hidden border border-[#d9d3c8] bg-white p-2">
                      <Image
                        alt={activeImage.prompt}
                        className="h-auto max-h-[68vh] w-full object-contain"
                        height={1200}
                        src={activeImage.src}
                        unoptimized
                        width={1200}
                      />
                    </div>
                    <aside className="border border-[#d9d3c8] bg-[#fffdfa] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d7469]">
                        Output
                      </p>
                      <dl className="mt-3 grid gap-3 text-sm">
                        <div>
                          <dt className="font-black">Size</dt>
                          <dd className="text-[#6f675f]">{activeImage.size}</dd>
                        </div>
                        <div>
                          <dt className="font-black">Quality</dt>
                          <dd className="text-[#6f675f]">{activeImage.quality}</dd>
                        </div>
                        <div>
                          <dt className="font-black">Format</dt>
                          <dd className="text-[#6f675f]">{activeImage.format}</dd>
                        </div>
                      </dl>
                      <a
                        className="mt-5 flex h-11 items-center justify-center bg-[#141412] px-4 text-sm font-black text-white"
                        download={createDownloadName(activeImage.format)}
                        href={activeImage.src}
                      >
                        Download
                      </a>
                    </aside>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl border border-dashed border-[#c9c0b3] bg-[#fffdfa] p-6 text-center sm:p-10">
                    <p className="text-2xl font-black">Your image appears here</p>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6f675f]">
                      Use this starter to generate product shots, campaign visuals,
                      concept art, UI assets, character sheets, and moodboards from a
                      secure Next.js API route.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <aside className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              <div className="border border-[#d9d3c8] bg-[#fffdfa] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d7469]">
                  API route
                </p>
                <p className="mt-2 text-lg font-black">/api/generate-image</p>
                <p className="mt-2 text-sm leading-6 text-[#6f675f]">
                  Keeps your API key on the server and returns base64 image data to
                  the browser.
                </p>
              </div>
              <div className="border border-[#d9d3c8] bg-[#fffdfa] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d7469]">
                  Model
                </p>
                <p className="mt-2 text-lg font-black">{model}</p>
                <p className="mt-2 text-sm leading-6 text-[#6f675f]">
                  Supports configurable size, quality, output format, compression,
                  and moderation.
                </p>
              </div>
              <div className="border border-[#d9d3c8] bg-[#fffdfa] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d7469]">
                  Prompt craft
                </p>
                <p className="mt-2 text-lg font-black">Be specific</p>
                <p className="mt-2 text-sm leading-6 text-[#6f675f]">
                  Include subject, setting, style, camera, lighting, palette, and
                  constraints for stronger results.
                </p>
              </div>
            </aside>
          </div>

          <section className="border border-[#d9d3c8] bg-[#fffdfa] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d7469]">
                  Gallery
                </p>
                <h2 className="mt-1 text-xl font-black">Recent generations</h2>
              </div>
              <span className="text-sm font-black text-[#6f675f]">{images.length}/8</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {images.length === 0 ? (
                <div className="border border-dashed border-[#c9c0b3] p-4 text-sm font-bold text-[#6f675f] sm:col-span-2 lg:col-span-4">
                  Generated images will collect here for quick comparison.
                </div>
              ) : (
                images.map((image) => (
                  <button
                    className="group border border-[#d9d3c8] bg-[#fbf7f0] p-2 text-left transition hover:bg-white"
                    key={image.id}
                    onClick={() =>
                      setImages((current) => [
                        image,
                        ...current.filter((item) => item.id !== image.id),
                      ])
                    }
                    type="button"
                  >
                    <Image
                      alt={image.prompt}
                      className="aspect-square w-full bg-white object-cover"
                      height={512}
                      src={image.src}
                      unoptimized
                      width={512}
                    />
                    <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-[#403a34]">
                      {image.prompt}
                    </p>
                    <p className="mt-1 text-xs font-black text-[#7d7469]">
                      {image.createdAt}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
