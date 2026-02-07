export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    apiKeySet: !!process.env.OPENAI_API_KEY,
    message: "API is reachable",
  });
}
