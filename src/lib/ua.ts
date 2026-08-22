export type AgentFamily =
  | "gptbot"
  | "chatgpt-user"
  | "oai-search"
  | "claudebot"
  | "claude-user"
  | "googlebot"
  | "google-extended"
  | "gemini"
  | "perplexitybot"
  | "perplexity-user"
  | "amazonbot"
  | "bytespider"
  | "ccbot"
  | "applebot"
  | "meta-external"
  | "hf-space"
  | "curl"
  | "python"
  | "browser"
  | "unknown";

const RULES: Array<[RegExp, AgentFamily]> = [
  [/GPTBot/i, "gptbot"],
  [/ChatGPT-User/i, "chatgpt-user"],
  [/OAI-SearchBot/i, "oai-search"],
  [/ClaudeBot|anthropic-ai|Claude-Web/i, "claudebot"],
  [/Claude-User/i, "claude-user"],
  [/Google-Extended/i, "google-extended"],
  [/Googlebot|Google-CloudVertexBot/i, "googlebot"],
  [/Gemini-Deep-Research|Google-Agent|Gemini/i, "gemini"],
  [/Perplexity-User/i, "perplexity-user"],
  [/PerplexityBot/i, "perplexitybot"],
  [/Amazonbot/i, "amazonbot"],
  [/Bytespider/i, "bytespider"],
  [/CCBot/i, "ccbot"],
  [/Applebot/i, "applebot"],
  [/meta-externalagent|facebookexternalhit/i, "meta-external"],
  [/AgentsCommons-HF-Space/i, "hf-space"],
  [/curl|wget|httpie/i, "curl"],
  [/python-requests|aiohttp|httpx|Go-http-client/i, "python"],
  [/Mozilla|Chrome|Safari|Firefox|Edg\//i, "browser"],
];

export function classifyUserAgent(ua: string | null | undefined): AgentFamily {
  if (!ua) return "unknown";
  for (const [re, family] of RULES) {
    if (re.test(ua)) return family;
  }
  return "unknown";
}

export function looksLikeBrowser(ua: string | null | undefined, accept: string | null | undefined) {
  const family = classifyUserAgent(ua);
  return family === "browser" && (accept || "").includes("text/html");
}
