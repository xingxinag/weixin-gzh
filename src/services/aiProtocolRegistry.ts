import type {
  AICapability,
  AIProtocolDefinition,
  AIProtocolId,
  ProtocolChatInput,
  ProtocolMediaRecognitionInput,
} from './aiProtocolTypes'
import {
  buildChatCompletionBody,
  toNumber,
} from './aiClient'

const openAIChatProtocol: AIProtocolDefinition = {
  id: `openai-chat-completions`,
  label: `OpenAI ChatCompletions`,
  supportedCapabilities: [`chat`, `embedding`, `rerank`, `moderation`, `image`, `speech`, `transcription`, `video`, `realtime`],
  buildEndpoint: (capability) => {
    switch (capability) {
      case `chat`: return `/v1/chat/completions`
      case `embedding`: return `/v1/embeddings`
      case `rerank`: return `/v1/rerank`
      case `moderation`: return `/v1/moderations`
      case `image`: return `/v1/images/generations`
      case `speech`: return `/v1/audio/speech`
      case `transcription`: return `/v1/audio/transcriptions`
      case `video`: return `/v1/videos`
      case `realtime`: return `/v1/realtime/sessions`
      default: throw new Error(`协议 ${openAIChatProtocol.id} 不支持能力 ${capability}`)
    }
  },
  buildRequest: (capability, input) => {
    if (capability === `chat`) {
      return buildChatCompletionBody(input as ProtocolChatInput)
    }
    return input
  },
}

const openAIResponsesProtocol: AIProtocolDefinition = {
  id: `openai-responses`,
  label: `OpenAI Responses`,
  supportedCapabilities: [`chat`],
  buildEndpoint: () => `/v1/responses`,
  buildRequest: (_capability, input) => {
    const chatInput = input as ProtocolChatInput
    return {
      model: chatInput.model,
      input: chatInput.messages.map(message => ({
        role: message.role,
        content: [{ type: `input_text`, text: message.content }],
      })),
      temperature: toNumber(chatInput.parameters?.temperature, 0.7),
      top_p: toNumber(chatInput.parameters?.topP, 1),
      max_output_tokens: toNumber(chatInput.parameters?.maxTokens, 2048),
      stream: Boolean(chatInput.stream),
    }
  },
}

const claudeProtocol: AIProtocolDefinition = {
  id: `anthropic-native`,
  label: `Claude 原生`,
  supportedCapabilities: [`chat`],
  buildEndpoint: () => `/v1/messages`,
  buildRequest: (_capability, input) => {
    const chatInput = input as ProtocolChatInput
    return {
      model: chatInput.model,
      messages: chatInput.messages,
      max_tokens: toNumber(chatInput.parameters?.maxTokens, 2048),
      temperature: toNumber(chatInput.parameters?.temperature, 0.7),
      stream: Boolean(chatInput.stream),
    }
  },
}

const geminiProtocol: AIProtocolDefinition = {
  id: `gemini-native`,
  label: `Gemini 原生`,
  supportedCapabilities: [`chat`, `mediaRecognition`],
  buildEndpoint: capability => capability === `mediaRecognition`
    ? `/v1beta/models:generateContent`
    : `/v1beta/models:generateContent`,
  buildRequest: (capability, input) => {
    if (capability === `mediaRecognition`) {
      const mediaInput = input as ProtocolMediaRecognitionInput
      return {
        model: mediaInput.model,
        contents: [{
          role: `user`,
          parts: [
            { text: mediaInput.inputText },
            ...mediaInput.media.map(item => ({
              inline_data: {
                mime_type: item.mimeType,
                data: item.data,
              },
            })),
          ],
        }],
      }
    }

    const chatInput = input as ProtocolChatInput
    return {
      model: chatInput.model,
      contents: chatInput.messages.map(message => ({
        role: message.role === `assistant` ? `model` : `user`,
        parts: [{ text: message.content }],
      })),
      generationConfig: {
        temperature: toNumber(chatInput.parameters?.temperature, 0.7),
        topP: toNumber(chatInput.parameters?.topP, 1),
        maxOutputTokens: toNumber(chatInput.parameters?.maxTokens, 2048),
      },
    }
  },
}

export const protocolRegistry: Record<AIProtocolId, AIProtocolDefinition> = {
  'openai-chat-completions': openAIChatProtocol,
  'openai-responses': openAIResponsesProtocol,
  'anthropic-native': claudeProtocol,
  'gemini-native': geminiProtocol,
}

export function listProtocols() {
  return Object.values(protocolRegistry)
}

export function getProtocolDefinition(id: AIProtocolId) {
  return protocolRegistry[id]
}

export function getProtocolEndpoint(id: AIProtocolId, capability: AICapability) {
  return getProtocolDefinition(id).buildEndpoint(capability)
}

export function buildProtocolRequest(id: AIProtocolId, capability: AICapability, input: unknown) {
  return getProtocolDefinition(id).buildRequest(capability, input)
}
