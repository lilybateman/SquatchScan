import { OpenAI } from "openai";
import { generateSquatchReport, type AIAnalysis } from "@/lib/squatch";

export const runtime = "nodejs";
export const maxDuration = 30;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VISION_PROMPT = `Analyze this image for potential Bigfoot/Sasquatch detection. Respond with ONLY valid JSON (no markdown, no explanation). Use this exact structure:
{
  "environment": "forest|indoor|urban|outdoor|woods|etc",
  "blurry": 0-10,
  "humanoid": true|false,
  "humanoidSquatchLike": true|false,
  "wearingClothes": true|false,
  "hairyOrFurry": true|false,
  "animal": true|false,
  "animalType": "bear|deer|nothing|etc if animal detected",
  "lighting": "low|medium|bright|well-lit|dark",
  "objectsDetected": ["list", "of", "objects"],
  "creatureConfidence": 0-1,
  "description": "brief one-line description",
  "dadProfileMatch": true|false
}

IMPORTANT: humanoidSquatchLike = true ONLY if the figure looks ape-like, hairy, unclothed, or cryptid-like—NOT a normal clothed person. wearingClothes = true if the humanoid figure is wearing shirts, pants, jackets, hats, etc. A regular hiker in a forest should have wearingClothes=true and humanoidSquatchLike=false.

CRITICAL: dadProfileMatch = true ONLY if the image shows a man who appears to be in his early 60s (approximately 60-65 years old) with whitish-blonde or blonde hair and white/Caucasian ethnicity. This must match all these traits. Do NOT set true for other men, younger people, or different hair/ethnicity.`;

export async function GET() {
  return Response.json({
    ok: true,
    apiKeySet: !!process.env.OPENAI_API_KEY,
    env: process.env.NODE_ENV,
  });
}

export async function POST(request: Request) {
  console.log("[analyze] POST request received");

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[analyze] OPENAI_API_KEY not set");
      return Response.json(
        { error: "OPENAI_API_KEY not configured. Add it to .env.local" },
        { status: 500 }
      );
    }
    console.log("[analyze] API key present");

    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile || !imageFile.type.startsWith("image/")) {
      console.error("[analyze] No valid image in formData:", {
        hasFile: !!imageFile,
        type: imageFile?.type,
      });
      return Response.json(
        { error: "Please upload an image file (JPEG, PNG, etc.)" },
        { status: 400 }
      );
    }
    console.log("[analyze] Image received:", {
      name: imageFile.name,
      type: imageFile.type,
      size: imageFile.size,
    });

    const buffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mediaType = imageFile.type || "image/jpeg";
    console.log("[analyze] Image encoded, base64 length:", base64.length);

    console.log("[analyze] Calling OpenAI Vision API...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: VISION_PROMPT,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64}`,
              },
            },
          ],
        },
      ],
    });

    console.log("[analyze] OpenAI response received");
    const content = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = parseAIResponse(content);

    const report = generateSquatchReport(parsed);

    return Response.json({
      aiAnalysis: parsed,
      score: report.score,
      conclusion: report.conclusion,
      easterEgg: report.easterEgg,
      dadSquatch: report.dadSquatch,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const stack = err instanceof Error ? err.stack : undefined;
    const cause =
      err instanceof Error && err.cause ? String(err.cause) : undefined;
    console.error("[analyze] Error:", message);
    console.error("[analyze] Stack:", stack);
    if (cause) console.error("[analyze] Cause:", cause);
    if (err && typeof err === "object" && "status" in err) {
      console.error("[analyze] Status:", (err as { status?: number }).status);
    }

    const errorPayload = {
      error: message,
      hint:
        !process.env.OPENAI_API_KEY
          ? "Add OPENAI_API_KEY to .env.local and restart the dev server."
          : undefined,
      details:
        process.env.NODE_ENV === "development" ? { stack, cause } : undefined,
    };

    return new Response(JSON.stringify(errorPayload), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function parseAIResponse(content: string): AIAnalysis {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  try {
    return JSON.parse(cleaned) as AIAnalysis;
  } catch {
    return {};
  }
}
