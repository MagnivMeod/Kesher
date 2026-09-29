/**
 * Settings read from environment variables, so they can change without code changes.
 */
export type AgentConfig = {
  /** Claude model name. Default: claude-opus-5-5. */
  model: string;
  /** How hard the model thinks: low | medium | high | xhigh | max. */
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  /** Max model calls per customer message, so one message can't run up costs. */
  maxModelCalls: number;
  /** If Claude's safety filter declines a request, retry on Anthropic's recommended fallback model. */
  useFallbacks: boolean;
};

export function loadAgentConfig(env: Record<string, string | undefined> = process.env): AgentConfig {
  const effort = env.KESHER_AI_EFFORT ?? "medium";
  if (!["low", "medium", "high", "xhigh", "max"].includes(effort)) throw new Error(`KESHER_AI_EFFORT must be low, medium, high, xhigh or max (got "${effort}")`);
  return {
    model: env.KESHER_AI_MODEL || "claude-opus-5-5",
    effort: effort as AgentConfig["effort"],
    maxModelCalls: Number(env.KESHER_AI_MAX_CALLS || 8),
    useFallbacks: (env.KESHER_AI_FALLBACKS ?? "on") !== "off",
  };
}
