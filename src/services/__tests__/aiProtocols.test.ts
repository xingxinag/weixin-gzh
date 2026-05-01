import { describe, expect, it } from 'vitest'
import {
  buildProtocolRequest,
  getProtocolDefinition,
  getProtocolEndpoint,
} from '../aiProtocolRegistry'

describe(`protocol registry`, () => {
  it(`supports responses, claude, and gemini protocols`, () => {
    expect(getProtocolDefinition(`openai-responses`).id).toBe(`openai-responses`)
    expect(getProtocolDefinition(`anthropic-native`).id).toBe(`anthropic-native`)
    expect(getProtocolDefinition(`gemini-native`).id).toBe(`gemini-native`)
  })

  it(`uses the responses endpoint for openai-responses chat`, () => {
    expect(getProtocolEndpoint(`openai-responses`, `chat`)).toBe(`/v1/responses`)
  })

  it(`builds a Claude native chat payload`, () => {
    const body = buildProtocolRequest(`anthropic-native`, `chat`, {
      model: `claude-3-5-sonnet`,
      messages: [{ role: `user`, content: `hello` }],
      parameters: {
        maxTokens: 2048,
      },
    }) as Record<string, unknown>

    expect(body.model).toBe(`claude-3-5-sonnet`)
    expect(body.messages).toEqual([{ role: `user`, content: `hello` }])
    expect(body.max_tokens).toBe(2048)
  })

  it(`builds a Gemini native text chat payload`, () => {
    const body = buildProtocolRequest(`gemini-native`, `chat`, {
      model: `gemini-1.5-pro`,
      messages: [{ role: `user`, content: `hello` }],
      parameters: {
        temperature: 0.7,
      },
    }) as Record<string, unknown>

    expect(body.contents).toBeTruthy()
    expect(body.generationConfig).toBeTruthy()
  })

  it(`builds a Gemini media recognition request`, () => {
    const body = buildProtocolRequest(`gemini-native`, `mediaRecognition`, {
      model: `gemini-1.5-pro`,
      inputText: `Describe this image`,
      media: [{ mimeType: `image/png`, data: `base64data` }],
    }) as Record<string, unknown>

    expect(body.contents).toBeTruthy()
  })
})
