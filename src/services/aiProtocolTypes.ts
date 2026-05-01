import type {
  AIParameters,
  ChatMessage,
} from './aiClient'

export type AIProtocolId =
  | `openai-chat-completions`
  | `openai-responses`
  | `anthropic-native`
  | `gemini-native`

export type AICapability =
  | `chat`
  | `mediaRecognition`
  | `embedding`
  | `rerank`
  | `moderation`
  | `image`
  | `speech`
  | `transcription`
  | `video`
  | `realtime`

export interface ProtocolChatInput {
  model: string
  messages: ChatMessage[]
  parameters?: AIParameters
  stream?: boolean
}

export interface ProtocolMediaRecognitionInput {
  model: string
  inputText: string
  media: Array<{ mimeType: string, data: string }>
}

export interface AIProtocolDefinition {
  id: AIProtocolId
  label: string
  supportedCapabilities: AICapability[]
  buildEndpoint: (capability: AICapability) => string
  buildRequest: (capability: AICapability, input: any) => Record<string, unknown>
}
