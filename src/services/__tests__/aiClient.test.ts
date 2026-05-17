import { describe, expect, it } from 'vitest'
import {
  buildApiUrl,
  buildChatCompletionBody,
  buildEmbeddingBody,
  getCapabilityEndpoint,
  normalizeReasoningEffort,
  toNumber,
  toOptionalNumber,
} from '../aiClient'

describe(`aiClient helpers`, () => {
  it(`serializes max_tokens as a number`, () => {
    const body = buildChatCompletionBody({
      model: `gpt-4o-mini`,
      messages: [{ role: `user`, content: `hello` }],
      parameters: {
        temperature: `0.7`,
        topP: `1`,
        maxTokens: `2048`,
        presencePenalty: `0`,
        frequencyPenalty: `0`,
      },
    })

    expect(body.max_tokens).toBe(2048)
    expect(typeof body.max_tokens).toBe(`number`)
  })

  it(`keeps chat parameters numeric when building the request body`, () => {
    const body = buildChatCompletionBody({
      model: `gpt-4o-mini`,
      messages: [{ role: `user`, content: `hello` }],
      parameters: {
        temperature: `0.7`,
        topP: `1`,
        maxTokens: `2048`,
        presencePenalty: `-0.5`,
        frequencyPenalty: `0.5`,
      },
    })

    expect(body.temperature).toBe(0.7)
    expect(body.top_p).toBe(1)
    expect(body.presence_penalty).toBe(-0.5)
    expect(body.frequency_penalty).toBe(0.5)
  })

  it(`builds endpoint URLs without double slashes`, () => {
    expect(buildApiUrl(`https://example.com/`, `/v1/models`)).toBe(`https://example.com/v1/models`)
  })

  it(`builds capability endpoints for worker proxy paths`, () => {
    expect(getCapabilityEndpoint(`https://editor.example.com/api`, `/v1/models`)).toBe(`https://editor.example.com/api/v1/models`)
  })

  it(`omits undefined optional fields from chat payloads`, () => {
    const body = buildChatCompletionBody({
      model: `gpt-4o-mini`,
      messages: [{ role: `user`, content: `hello` }],
      parameters: { maxTokens: 256 },
    })

    expect(body).not.toHaveProperty(`reasoning_effort`)
    expect(body).toHaveProperty(`max_tokens`, 256)
  })

  it(`does not send reasoning_effort by default`, () => {
    const body = buildChatCompletionBody({
      model: `gpt-4o-mini`,
      messages: [{ role: `user`, content: `hello` }],
      parameters: { maxTokens: 256, reasoningEffort: `` },
    })

    expect(body).not.toHaveProperty(`reasoning_effort`)
  })

  it(`builds an embeddings payload with the selected embedding model`, () => {
    const body = buildEmbeddingBody({
      model: `text-embedding-3-small`,
      input: `hello`,
    })

    expect(body).toEqual({
      model: `text-embedding-3-small`,
      input: `hello`,
    })
  })

  it(`normalizes numeric helpers safely`, () => {
    expect(toNumber(`12`, 1)).toBe(12)
    expect(toNumber(`bad`, 5)).toBe(5)
    expect(toOptionalNumber(`42`)).toBe(42)
    expect(toOptionalNumber(``)).toBeUndefined()
    expect(normalizeReasoningEffort(`high`)).toBe(`high`)
    expect(normalizeReasoningEffort(`x`)).toBeUndefined()
  })
})
