import { useAIStore } from '@/stores/ai'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateWithAI } from '../ai'

describe(`ai service`, () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it(`extracts continuation text when an OpenAI-compatible endpoint returns JSON`, async () => {
    vi.spyOn(globalThis, `fetch`).mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: `续写内容` } }],
    }), {
      status: 200,
      headers: { 'Content-Type': `application/json` },
    }))
    const store = useAIStore()
    store.connection.apiKey = `sk-test`
    store.connection.baseUrl = `https://api.example.com`
    store.connection.protocol = `openai-chat-completions`

    await expect(generateWithAI(`请继续编写以下内容：测试`)).resolves.toBe(`续写内容`)
  })
})
