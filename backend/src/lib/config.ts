export interface AppConfig {
  opencodeZenApiKey: string;
  opencodeZenBaseUrl: string;
  textModel: string;
  visionModel: string;
  tokenLimit: number;
  agnesApiKey: string;
  agnesEndpoint: string;
  hfApiKey: string;
}

export function getConfig(): AppConfig {
  return {
    opencodeZenApiKey: process.env.OPENCODE_ZEN_API_KEY ?? '',
    opencodeZenBaseUrl: process.env.OPENCODE_ZEN_BASE_URL ?? 'https://opencode.ai/zen/v1',
    textModel: process.env.TEXT_MODEL ?? 'nemotron-3-ultra-free',
    visionModel: process.env.VISION_MODEL ?? 'mimo-v2.5-free',
    tokenLimit: Number(process.env.TOKEN_LIMIT) || 100000,
    agnesApiKey: process.env.AGNES_API_KEY ?? '',
    agnesEndpoint: process.env.AGNES_ENDPOINT ?? 'https://apihub.agnes-ai.com/v1',
    hfApiKey: process.env.HF_API_KEY ?? '',
  };
}

  // Mistral
  mistralApiKey: process.env.MISTRAL_API_KEY ?? '',
  mistralModel: process.env.MISTRAL_MODEL ?? 'mistral-large-latest',
  mistralEndpoint: process.env.MISTRAL_ENDPOINT ?? 'https://api.mistral.ai/v1',
}
