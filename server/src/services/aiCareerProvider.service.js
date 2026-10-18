/**
 * Optional AI Career Explanation Provider
 * 
 * The deterministic scoring engine remains the source of truth for all scores,
 * skill gaps, and calculations.
 * 
 * Default: DISABLED. No external API key required.
 * Falls back to structured, deterministic explanations.
 */

const AI_PROVIDER_ENABLED = process.env.ENABLE_AI_CAREER_PROVIDER === "true";

/**
 * Generates career explanations, either using deterministic templates (default)
 * or through an optional server-side LLM provider if configured.
 * 
 * @param {Object} input - Sanitized career recommendation input
 * @param {string} input.careerName - Name of career pathway
 * @param {number} input.score - Calculated readiness match score
 * @param {Array<string>} input.matchedSkills - User skills that matched
 * @param {Array<string>} input.missingSkills - Required skills currently missing
 * @param {Array<Object>} input.evidence - Real evidence items
 * @returns {Promise<{ explanation: string, source: "deterministic" | "ai" }>}
 */
export async function generateCareerExplanation(input) {
  const isEnabled = process.env.ENABLE_AI_CAREER_PROVIDER === "true";
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  // If AI provider is not enabled or no API key configured, use deterministic synthesis
  if (!isEnabled || (!geminiApiKey && !openAiApiKey)) {
    return {
      explanation: buildDeterministicSummary(input),
      source: "deterministic",
    };
  }

  // Attempt external AI generation safely
  try {
    if (geminiApiKey) {
      const promptText = `You are CareerCraft's AI career advisor. Briefly explain why a student has a ${input.score}% readiness match for ${input.careerName} based on verified competencies [${(input.matchedSkills || []).slice(0, 5).join(", ")}] and missing prerequisites [${(input.missingSkills || []).slice(0, 5).join(", ")}]. Keep it concise, motivational, and under 3 sentences.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: promptText }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 150,
              temperature: 0.3,
            },
          }),
          signal: AbortSignal.timeout(4000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiText && aiText.length > 10) {
          return {
            explanation: aiText,
            source: "ai",
          };
        }
      }
    }

    // Fallback if provider call did not succeed
    return {
      explanation: buildDeterministicSummary(input),
      source: "deterministic",
    };
  } catch (err) {
    console.warn("AI Career Provider call failed; falling back to deterministic explanation:", err.message);
    return {
      explanation: buildDeterministicSummary(input),
      source: "deterministic",
    };
  }
}

/**
 * Deterministic explanation builder based entirely on actual evidence.
 */
function buildDeterministicSummary({ careerName, score, matchedSkills, missingSkills }) {
  const matchedCount = (matchedSkills || []).length;
  const missingCount = (missingSkills || []).length;

  if (matchedCount > 0) {
    const skillList = matchedSkills.slice(0, 3).join(", ");
    return `Your demonstrated competencies in ${skillList} provide a solid foundation for ${careerName} with a ${score}% match. Addressing the ${missingCount} remaining skill gap${missingCount === 1 ? "" : "s"} will accelerate your readiness.`;
  }

  return `You are in the foundation-building phase for ${careerName}. Focusing on core prerequisites will systematically increase your match score.`;
}
