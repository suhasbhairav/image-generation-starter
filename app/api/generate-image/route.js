import { parseJsonRequest, validateRequestBody } from "@/lib/production-guardrails";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 120;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-image-2";
const allowedSizes = new Set([
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "2048x1152",
]);
const allowedQualities = new Set(["low", "medium", "high", "auto"]);
const allowedFormats = new Set(["png", "jpeg", "webp"]);
const allowedModeration = new Set(["auto", "low"]);

function stringValue(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function numberValue(value, fallback) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function getUserFacingError(error) {
  if (error?.code === "moderation_blocked") {
    return "This prompt was blocked by safety checks. Revise the prompt and focus on neutral visual details.";
  }

  if (error?.status === 401) {
    return "OpenAI authentication failed. Check OPENAI_API_KEY in your environment.";
  }

  if (error?.status === 429) {
    return "Rate limit or quota reached. Wait briefly, lower quality, or check your OpenAI usage limits.";
  }

  return error?.message || "Image generation failed.";
}

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Missing OPENAI_API_KEY in the environment." },
      { status: 500 },
    );
  }

  const body = await parseJsonRequest(request);
  const guardrail = validateRequestBody(body);
  if (!guardrail.ok) {
    return Response.json({ error: guardrail.error }, { status: guardrail.status });
  }

  const prompt = stringValue(body.prompt, "");

  if (prompt.length < 8) {
    return Response.json(
      { error: "Prompt must be at least 8 characters." },
      { status: 400 },
    );
  }

  const size = allowedSizes.has(body.size) ? body.size : "1024x1024";
  const quality = allowedQualities.has(body.quality) ? body.quality : "medium";
  const output_format = allowedFormats.has(body.format) ? body.format : "png";
  const moderation = allowedModeration.has(body.moderation)
    ? body.moderation
    : "auto";
  const output_compression = numberValue(body.compression, 85);

  const requestPayload = {
    model: MODEL,
    prompt,
    size,
    quality,
    output_format,
    moderation,
  };

  if (output_format !== "png") {
    requestPayload.output_compression = output_compression;
  }

  try {
    const result = await client.images.generate(requestPayload);
    const firstImage = result.data?.[0];

    if (!firstImage?.b64_json) {
      return Response.json(
        { error: "OpenAI did not return image data." },
        { status: 502 },
      );
    }

    return Response.json(
      {
        image: firstImage.b64_json,
        revisedPrompt: firstImage.revised_prompt || "",
        prompt,
        model: MODEL,
        size,
        quality,
        format: output_format,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Image generation failed", {
      requestId: error?.request_id,
      status: error?.status,
      code: error?.code,
      message: error?.message,
      moderationDetails: error?.moderation_details,
    });

    return Response.json(
      {
        error: getUserFacingError(error),
        code: error?.code || null,
        requestId: error?.request_id || null,
      },
      { status: error?.status || 500 },
    );
  }
}
