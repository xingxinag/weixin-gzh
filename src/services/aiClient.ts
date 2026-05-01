export type ReasoningEffort = `low` | `medium` | `high`

export interface AIParameters {
  temperature?: unknown
  topP?: unknown
  maxTokens?: unknown
  presencePenalty?: unknown
  frequencyPenalty?: unknown
  reasoningEffort?: unknown
}

export interface ChatMessage {
  role: string
  content: string
}

export interface ChatCompletionInput {
  model: string
  messages: ChatMessage[]
  parameters?: AIParameters
  stream?: boolean
}

export interface CompletionInput {
  model: string
  prompt: string
  maxTokens?: unknown
  temperature?: unknown
}

export interface EmbeddingInput {
  model: string
  input: string | string[]
  encodingFormat?: `float` | `base64`
  dimensions?: unknown
}

export interface RerankInput {
  model: string
  query: string
  documents: string[]
  topN?: unknown
}

export interface ModerationInput {
  model: string
  input: string | string[]
}

export interface ImageInput {
  model: string
  prompt: string
  n?: unknown
  size?: string
}

export interface SpeechInput {
  model: string
  input: string
  voice: string
  responseFormat?: string
  speed?: unknown
}

export interface VideoInput {
  model: string
  prompt: string
}

export interface RealtimeInput {
  model: string
  voice?: string
}

function isFilled(value: unknown) {
  return !(value === undefined || value === null || value === ``)
}

export function toNumber(value: unknown, fallback: number) {
  const parsed = typeof value === `number` ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function toOptionalNumber(value: unknown) {
  if (!isFilled(value)) {
    return undefined
  }

  const parsed = typeof value === `number` ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function normalizeReasoningEffort(value: unknown): ReasoningEffort | undefined {
  if (value === `low` || value === `medium` || value === `high`) {
    return value
  }
  return undefined
}

export function buildApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, ``)}/${path.replace(/^\/+/, ``)}`
}

export function getCapabilityEndpoint(baseUrl: string, path: string) {
  return buildApiUrl(baseUrl, path)
}

function withOptionalField(target: Record<string, unknown>, key: string, value: unknown) {
  if (isFilled(value)) {
    target[key] = value
  }
}

export function buildChatCompletionBody(input: ChatCompletionInput) {
  const body: Record<string, unknown> = {
    model: input.model,
    messages: input.messages,
    temperature: toNumber(input.parameters?.temperature, 0.7),
    top_p: toNumber(input.parameters?.topP, 1),
    max_tokens: toNumber(input.parameters?.maxTokens, 2048),
    presence_penalty: toNumber(input.parameters?.presencePenalty, 0),
    frequency_penalty: toNumber(input.parameters?.frequencyPenalty, 0),
  }

  withOptionalField(body, `reasoning_effort`, normalizeReasoningEffort(input.parameters?.reasoningEffort))
  withOptionalField(body, `stream`, input.stream)

  return body
}

export function buildCompletionBody(input: CompletionInput) {
  return {
    model: input.model,
    prompt: input.prompt,
    max_tokens: toNumber(input.maxTokens, 2048),
    temperature: toNumber(input.temperature, 0.7),
  }
}

export function buildEmbeddingBody(input: EmbeddingInput) {
  const body: Record<string, unknown> = {
    model: input.model,
    input: input.input,
  }

  withOptionalField(body, `encoding_format`, input.encodingFormat)
  withOptionalField(body, `dimensions`, toOptionalNumber(input.dimensions))
  return body
}

export function buildRerankBody(input: RerankInput) {
  const body: Record<string, unknown> = {
    model: input.model,
    query: input.query,
    documents: input.documents,
  }

  withOptionalField(body, `top_n`, toOptionalNumber(input.topN))
  return body
}

export function buildModerationBody(input: ModerationInput) {
  return {
    model: input.model,
    input: input.input,
  }
}

export function buildImageBody(input: ImageInput) {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
  }

  withOptionalField(body, `n`, toOptionalNumber(input.n))
  withOptionalField(body, `size`, input.size)
  return body
}

export function buildSpeechBody(input: SpeechInput) {
  const body: Record<string, unknown> = {
    model: input.model,
    input: input.input,
    voice: input.voice,
  }

  withOptionalField(body, `response_format`, input.responseFormat)
  withOptionalField(body, `speed`, toOptionalNumber(input.speed))
  return body
}

export function buildVideoBody(input: VideoInput) {
  return {
    model: input.model,
    prompt: input.prompt,
  }
}

export function buildRealtimeBody(input: RealtimeInput) {
  const body: Record<string, unknown> = {
    model: input.model,
  }

  withOptionalField(body, `voice`, input.voice)
  return body
}

async function readErrorMessage(response: Response) {
  try {
    const payload = await response.clone().json() as { error?: { message?: string } }
    return payload.error?.message || response.statusText
  }
  catch {
    return await response.text().catch(() => response.statusText)
  }
}

export class AIClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private headers(extra?: HeadersInit) {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: `application/json`,
      ...extra,
    }
  }

  private async request(path: string, init?: RequestInit) {
    const response = await fetch(buildApiUrl(this.baseUrl, path), init)
    if (!response.ok) {
      throw new Error(`API请求失败 (${response.status}): ${await readErrorMessage(response)}`)
    }
    return response
  }

  async listModels() {
    const response = await this.request(`/v1/models`, {
      headers: this.headers({ 'Content-Type': `application/json` }),
    })
    return response.json()
  }

  createChatCompletion(input: ChatCompletionInput) {
    return this.request(`/v1/chat/completions`, {
      method: `POST`,
      headers: this.headers({ 'Content-Type': `application/json` }),
      body: JSON.stringify(buildChatCompletionBody(input)),
    })
  }

  createCompletion(input: CompletionInput) {
    return this.request(`/v1/completions`, {
      method: `POST`,
      headers: this.headers({ 'Content-Type': `application/json` }),
      body: JSON.stringify(buildCompletionBody(input)),
    })
  }

  createEmbedding(input: EmbeddingInput) {
    return this.request(`/v1/embeddings`, {
      method: `POST`,
      headers: this.headers({ 'Content-Type': `application/json` }),
      body: JSON.stringify(buildEmbeddingBody(input)),
    })
  }

  createRerank(input: RerankInput) {
    return this.request(`/v1/rerank`, {
      method: `POST`,
      headers: this.headers({ 'Content-Type': `application/json` }),
      body: JSON.stringify(buildRerankBody(input)),
    })
  }

  createModeration(input: ModerationInput) {
    return this.request(`/v1/moderations`, {
      method: `POST`,
      headers: this.headers({ 'Content-Type': `application/json` }),
      body: JSON.stringify(buildModerationBody(input)),
    })
  }

  createImage(input: ImageInput) {
    return this.request(`/v1/images/generations`, {
      method: `POST`,
      headers: this.headers({ 'Content-Type': `application/json` }),
      body: JSON.stringify(buildImageBody(input)),
    })
  }

  createSpeech(input: SpeechInput) {
    return this.request(`/v1/audio/speech`, {
      method: `POST`,
      headers: this.headers({ 'Content-Type': `application/json` }),
      body: JSON.stringify(buildSpeechBody(input)),
    })
  }

  createTranscription(body: BodyInit) {
    return this.request(`/v1/audio/transcriptions`, {
      method: `POST`,
      headers: this.headers(),
      body,
    })
  }

  createVideo(input: VideoInput) {
    return this.request(`/v1/videos`, {
      method: `POST`,
      headers: this.headers({ 'Content-Type': `application/json` }),
      body: JSON.stringify(buildVideoBody(input)),
    })
  }

  createRealtimeSession(input: RealtimeInput) {
    return this.request(`/v1/realtime/sessions`, {
      method: `POST`,
      headers: this.headers({ 'Content-Type': `application/json` }),
      body: JSON.stringify(buildRealtimeBody(input)),
    })
  }
}
