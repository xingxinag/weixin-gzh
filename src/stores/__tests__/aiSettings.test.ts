import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAIStore } from '../ai'

describe(`useAIStore migration`, () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it(`migrates legacy md-ai keys into structured settings`, () => {
    localStorage.setItem(`md-ai-api-key`, `sk-test`)
    localStorage.setItem(`md-ai-api-domain`, `https://example.com`)
    localStorage.setItem(`md-ai-selected-model`, `gpt-4o-mini`)
    localStorage.setItem(`md-ai-max-length`, `2048`)

    const store = useAIStore()

    expect(store.connection.apiKey).toBe(`sk-test`)
    expect(store.connection.baseUrl).toBe(`https://example.com`)
    expect(store.defaults.chatModel).toBe(`gpt-4o-mini`)
    expect(store.parameters.maxTokens).toBe(2048)
  })

  it(`coerces legacy numeric values into numbers`, () => {
    localStorage.setItem(`md-ai-temperature`, `0.9`)
    localStorage.setItem(`md-ai-max-length`, `3200`)

    const store = useAIStore()

    expect(store.parameters.temperature).toBe(0.9)
    expect(store.parameters.maxTokens).toBe(3200)
  })

  it(`migrates legacy custom model into visible chat model without hidden override`, () => {
    localStorage.setItem(`md-ai-selected-model`, `gpt-4o-mini`)
    localStorage.setItem(`md-ai-custom-model`, `private-chat-model`)

    const store = useAIStore()

    expect(store.defaults.chatModel).toBe(`private-chat-model`)
    expect(store.customModels).toContain(`private-chat-model`)
    expect(store.customModel).toBe(``)
    expect(store.getCurrentModelId()).toBe(`private-chat-model`)
  })

  it(`allows worker proxy mode without browser api key`, () => {
    const store = useAIStore()

    store.connection.mode = `worker-proxy`
    store.connection.baseUrl = `https://editor.example.com/api`
    store.connection.apiKey = ``

    const client = store.getClient()

    expect(store.connection.mode).toBe(`worker-proxy`)
    expect(store.connection.apiKey).toBe(``)
    expect(client).toBeTruthy()
  })

  it(`switches supported capabilities when protocol changes`, () => {
    const store = useAIStore()
    store.connection.protocol = `anthropic-native`

    expect(store.supportedCapabilities).toContain(`chat`)
    expect(store.supportedCapabilities).not.toContain(`embedding`)
  })
})
