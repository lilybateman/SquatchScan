/**
 * Squatch Probability Engine
 * Converts neutral AI vision analysis into scientific-sounding Squatch scores.
 */

export interface AIAnalysis {
  environment?: string;
  blurry?: number;
  humanoid?: boolean;
  humanoidSquatchLike?: boolean;
  wearingClothes?: boolean;
  hairyOrFurry?: boolean;
  knownPrimate?: boolean;
  primateType?: string;
  animal?: boolean;
  animalType?: string;
  lighting?: string;
  objectsDetected?: string[];
  creatureConfidence?: number;
  description?: string;
  dadProfileMatch?: boolean;
}

export interface SquatchReport {
  score: number;
  conclusion: string;
  easterEgg?: string;
  dadSquatch?: boolean;
}

const PROGRESS_MESSAGES = [
  "Scanning for fur density…",
  "Enhancing blur…",
  "Measuring bipedal stride…",
  "Analyzing footprint depth…",
  "Cross-referencing Bigfoot databases…",
  "Calculating forest adjacency…",
  "Running blur-to-Squatch algorithm…",
  "Verifying eyewitness credibility…",
  "Finalizing scientific report…",
];

export function getProgressMessage(index: number): string {
  return PROGRESS_MESSAGES[index % PROGRESS_MESSAGES.length];
}

/**
 * Main squatch scoring algorithm
 * Key: Only squatch-like humanoids (hairy, unclothed) get high scores.
 * Normal clothed people in forests should NOT score high.
 * Known primates (orangutans, gorillas, etc.) should NOT score high.
 */
export function calculateSquatchScore(data: AIAnalysis): number {
  let score = 10;

  const env = (data.environment || "").toLowerCase();
  const blurry = data.blurry ?? 0;
  const lighting = (data.lighting || "").toLowerCase();
  const animalType = (data.animalType || "").toLowerCase();
  const primateType = (data.primateType || "").toLowerCase();

  // Known primate = NOT squatch (big penalty—these are zoo animals, not cryptids)
  if (data.knownPrimate) {
    // Clear, high-quality photo of known primate = very low score
    if (blurry < 4) score -= 70;
    // Blurry primate photo = still a penalty, but maybe uncertain
    else score -= 50;
  }
  // Also check primateType in case knownPrimate is missed
  const isKnownPrimateType =
    primateType.includes("orangutan") ||
    primateType.includes("gorilla") ||
    primateType.includes("chimpanzee") ||
    primateType.includes("chimp") ||
    primateType.includes("monkey") ||
    primateType.includes("gibbon") ||
    primateType.includes("baboon");
  if (isKnownPrimateType && !data.knownPrimate) {
    if (blurry < 4) score -= 65;
    else score -= 45;
  }

  // Environment
  if (env.includes("forest") || env.includes("woods")) score += 15;
  if (env.includes("indoor") || env.includes("inside")) score -= 40;

  // Clothed human = NOT squatch (big penalty)
  if (data.wearingClothes) score -= 50;

  // Squatch-like humanoid: hairy, ape-like, unclothed (key signal)
  // But not if it's a known primate
  if (!data.knownPrimate && !isKnownPrimateType) {
    if (data.humanoidSquatchLike) score += 45;
    if (data.hairyOrFurry && data.humanoid) score += 35;
    // Generic humanoid without squatch traits = much smaller bonus
    if (data.humanoid && !data.wearingClothes && !data.humanoidSquatchLike && !data.hairyOrFurry) score += 15;
  }

  // Classic blurry evidence
  if (blurry > 7) score += 20;
  if (blurry < 3 && lighting.includes("bright")) score -= 15;

  // Animal / creature
  if (data.animal) score += 10;
  if (animalType.includes("bear")) score += 8;

  // Lighting
  if (lighting.includes("bright") || lighting.includes("well-lit")) score -= 10;

  if (data.creatureConfidence !== undefined) {
    score += Math.round(data.creatureConfidence * 15);
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate a funny, scientific-sounding conclusion
 */
export function generateConclusion(score: number): string {
  if (score > 80) return "Highly probable Squatch encounter";
  if (score > 60) return "Suspiciously Squatchy";
  if (score > 40) return "Inconclusive – classic blurry evidence";
  if (score > 20) return "Probably not a Squatch";
  return "Definitely not a Squatch";
}

/**
 * Full report generator
 */
export function generateSquatchReport(aiAnalysis: AIAnalysis): SquatchReport {
  if (aiAnalysis.dadProfileMatch) {
    return {
      score: 100,
      conclusion: "Definitely a squatch, no explanation needed.",
      dadSquatch: true,
    };
  }
  const score = calculateSquatchScore(aiAnalysis);
  const conclusion = generateConclusion(score);
  return { score, conclusion };
}
