import { AIClient } from './aiClient'

export interface Model {
  id: string
  name: string
  maxTokens: number
  available: boolean
}

export function normalizeModelList(payload: any): Model[] {
  const rawModels = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.models)
        ? payload.models
        : Array.isArray(payload?.items)
          ? payload.items
          : []

  return rawModels
    .map((model: any) => {
      const id = model?.id || model?.model_id || model?.name || ``
      return {
        id,
        name: id,
        maxTokens: Number(model?.max_tokens || model?.maxTokens || 0),
        available: Boolean(id),
      }
    })
    .filter((model: Model) => model.id)
}

export class AIModelsService {
  private static instance: AIModelsService
  private baseUrl: string = `YOUR_API_BASE_URL`
  private apiKey: string = ``
  private models: Model[] = []

  private constructor() {}

  public static getInstance(): AIModelsService {
    if (!AIModelsService.instance) {
      AIModelsService.instance = new AIModelsService()
    }
    return AIModelsService.instance
  }

  public async fetchAvailableModels(options?: { fallbackToDefaults?: boolean }): Promise<Model[]> {
    try {
      if (!this.apiKey || !this.baseUrl || this.baseUrl === `YOUR_API_BASE_URL`) {
        if (options?.fallbackToDefaults === false) {
          throw new Error(`请先设置有效的 API 地址和 API Key`)
        }
        this.models = this.getDefaultModels()
        return this.models
      }

      const client = new AIClient(this.baseUrl, this.apiKey)
      const payload = await client.listModels()
      const normalized = normalizeModelList(payload)
      this.models = normalized.length > 0 ? normalized : this.getDefaultModels()
      return this.models
    }
    catch (error) {
      console.error(`获取模型列表失败:`, error)
      if (options?.fallbackToDefaults === false) {
        throw error
      }
      this.models = this.getDefaultModels()
      return this.models
    }
  }

  private getDefaultModels(): Model[] {
    return [
      {
        id: `gpt-4o-mini`,
        name: `gpt-4o-mini`,
        maxTokens: 16384,
        available: true,
      },
      {
        id: `text-embedding-3-small`,
        name: `text-embedding-3-small`,
        maxTokens: 0,
        available: true,
      },
      {
        id: `dall-e-3`,
        name: `dall-e-3`,
        maxTokens: 0,
        available: true,
      },
      {
        id: `tts-1`,
        name: `tts-1`,
        maxTokens: 0,
        available: true,
      },
    ]
  }

  public getModels(): Model[] {
    return this.models
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.trim()
  }

  public setApiKey(key: string): void {
    this.apiKey = key.trim()
  }
}

export const aiModelsService = AIModelsService.getInstance()
