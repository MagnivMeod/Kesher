import Anthropic from "@anthropic-ai/sdk";
import { type AgentConfig, loadAgentConfig } from "../config";
import { OrderAccess } from "../safety/access";
import type { StoreData } from "../store/StoreData";
import type { TrackingProvider } from "../tracking/TrackingProvider";
import type { Conversation, StoreSettings } from "../types";
import { buildSystemPrompt, buildUserTurn } from "./prompt";
import { type Decision, FINISHING_TOOLS, TOOL_DEFINITIONS, runTool } from "./tools";

/** One logged step, so the owner can see why Kesher answered the way it did. */
export type TraceStep =
  | { type: "tool"; name: string; input: unknown; output: unknown; isError?: boolean; ms: number }
  | { type: "note"; text: string };

export type Usage = { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; modelCalls: number };

export type AgentResult = {
  decision: Decision;
  /** The decision was made by code (safety net), not by the AI. */
  forced?: "refusal" | "too_many_steps" | "no_decision";
  trace: TraceStep[];
  verifiedOrders: string[];
  usage: Usage;
  model: string;
  ms: number;
};

export type AgentInput = {
  conversation: Conversation;
  settings: StoreSettings;
  store: StoreData;
  tracking: TrackingProvider;
  /** The current time (ISO). Passed in so tests are repeatable. */
  now?: string;
};

/** The part of the Anthropic client Kesher uses; replaceable in tests. */
export type ModelClient = {
  create(params: Anthropic.Beta.MessageCreateParamsNonStreaming): Promise<Anthropic.Beta.BetaMessage>;
};

export function anthropicClient(client = new Anthropic()): ModelClient {
  return { create: (params) => client.beta.messages.create(params) };
}

const FINISH_NUDGE = "Finish now by calling exactly one of reply_to_customer, escalate_to_human or no_reply_needed.";

/**
 * Handles one new customer message: Claude reads it, looks things up with the
 * tools, and finishes with a decision (reply, escalate, or no reply).
 */
export async function runAgent(input: AgentInput, client: ModelClient = anthropicClient(), config: AgentConfig = loadAgentConfig()): Promise<AgentResult> {
  const started = Date.now();
  const { conversation, settings } = input;
  const access = new OrderAccess(input.store, conversation.sender);
  const ctx = { access, tracking: input.tracking, settings };
  const trace: TraceStep[] = [];
  const usage: Usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, modelCalls: 0 };

  const system: Anthropic.Beta.BetaTextBlockParam[] = [{ type: "text", text: buildSystemPrompt(settings), cache_control: { type: "ephemeral" } }];
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: buildUserTurn(conversation, input.now ?? new Date().toISOString()) }];
  let nudged = false;
  let decided: Decision | undefined;

  const finish = (decision: Decision, forced?: AgentResult["forced"]): AgentResult => ({
    decision,
    forced,
    trace,
    verifiedOrders: access.verifiedOrderNumbers,
    usage,
    model: config.model,
    ms: Date.now() - started,
  });

  while (usage.modelCalls < config.maxModelCalls) {
    const response = await client.create({
      model: config.model,
      max_tokens: 16000,
      system,
      tools: TOOL_DEFINITIONS,
      messages,
      output_config: { effort: config.effort },
      ...(config.useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    usage.modelCalls++;
    usage.inputTokens += response.usage.input_tokens;
    usage.outputTokens += response.usage.output_tokens;
    usage.cacheReadTokens += response.usage.cache_read_input_tokens ?? 0;
    usage.cacheWriteTokens += response.usage.cache_creation_input_tokens ?? 0;

    if (response.stop_reason === "refusal") {
      trace.push({ type: "note", text: `The AI model declined this message (${response.stop_details?.category ?? "no category"}).` });
      return finish(safetyNetEscalation(conversation.message.text, settings, "The AI could not handle this message"), "refusal");
    }

    // Keep the full response (including thinking) in the history, unchanged.
    messages.push({ role: "assistant", content: response.content });

    const calls = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (calls.length === 0) {
      if (nudged) break;
      nudged = true;
      trace.push({ type: "note", text: "The AI ended without a decision; asked it to finish." });
      messages.push({ role: "user", content: FINISH_NUDGE });
      continue;
    }
    if (response.stop_reason === "max_tokens") {
      trace.push({ type: "note", text: "The AI's answer was cut off (too long)." });
      break;
    }

    const finishing = calls.filter((c) => FINISHING_TOOLS.has(c.name));
    const results = await Promise.all(
      calls.map(async (call): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
        const t0 = Date.now();
        let outcome;
        if (FINISHING_TOOLS.has(call.name) && (finishing.length > 1 || calls.length > 1)) {
          outcome = { output: "Call exactly one finishing tool, on its own, after you have the lookup results.", isError: true };
        } else {
          outcome = await runTool(call.name, call.input, ctx);
        }
        trace.push({ type: "tool", name: call.name, input: call.input, output: outcome.output, isError: outcome.isError, ms: Date.now() - t0 });
        if ("decision" in outcome && outcome.decision) decided = outcome.decision;
        return { type: "tool_result", tool_use_id: call.id, content: JSON.stringify(outcome.output), ...(outcome.isError ? { is_error: true } : {}) };
      }),
    );
    if (decided) return finish(decided);
    messages.push({ role: "user", content: results });
  }

  if (usage.modelCalls >= config.maxModelCalls) {
    trace.push({ type: "note", text: `Stopped after ${config.maxModelCalls} AI steps.` });
    return finish(safetyNetEscalation(conversation.message.text, settings, "Kesher needed too many steps"), "too_many_steps");
  }
  return finish(safetyNetEscalation(conversation.message.text, settings, "Kesher didn't reach a decision"), "no_decision");
}

/** When the AI can't decide, a person takes over. The holding message matches the customer's script. */
function safetyNetEscalation(customerText: string, settings: StoreSettings, reasonEn: string): Decision {
  const hebrew = /[֐-׿]/.test(customerText);
  const reasonHe: Record<string, string> = {
    "The AI could not handle this message": "ה-AI לא הצליח לטפל בהודעה הזו",
    "Kesher needed too many steps": "קשר נזקק ליותר מדי צעדים",
    "Kesher didn't reach a decision": "קשר לא הגיע להחלטה",
  };
  const reason = settings.ownerLanguage === "he" ? (reasonHe[reasonEn] ?? reasonEn) : reasonEn;
  return {
    action: "escalate",
    category: "unclear_or_unsupported",
    reason,
    customerMessage: hebrew
      ? "היי, קיבלנו את ההודעה שלך. מישהו מהצוות שלנו יחזור אליך בהקדם."
      : "Hi, thanks for your message. Someone from our team will get back to you soon.",
    suggestedReply: "",
    language: hebrew ? "he" : "en",
    summary: reason,
  };
}
