import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { AIAgent } from './agent.js'

const TestSchema = z.object({ name: z.string(), text: z.string() })
// Enhanced mock client with proper model definition and bindTools method
const mockClient = {
  useModel: vi.fn().mockReturnValue({
    invoke: vi.fn(),
    _modelType: () => 'chat_model',
    model: 'test-model',
    modelName: 'test-model',
    lc_serializable: true,
    lc_namespace: ['test'],
    bindTools: vi.fn(function () {
      return this
    }), // Add bindTools method that returns itself
  }),
} as any
const baseOptions = {
  name: 'test-agent',
  client: mockClient,
  responseFormat: TestSchema,
  systemInstructions: [new SystemMessage('instr')],
  tools: [] as any[],
}

describe('AIAgent Unit Tests', () => {
  it('constructor sets properties and defaults', () => {
    const agent = new AIAgent(baseOptions)
    expect(agent['name']).toBe('test-agent')
    expect(agent['client']).toBe(mockClient)
    expect(agent['responseFormat']).toBe(TestSchema)
    expect(agent['systemInstructions']).toEqual([new SystemMessage('instr')])
    expect(agent['tools']).toEqual([])
    expect(agent['maxRetries']).toBe(3)
    expect(agent['baseDelay']).toBe(1000)
    expect(agent['agentWorkflow']).toBeDefined()
  })

  it('constructor accepts custom retry settings', () => {
    const agent = new AIAgent({
      ...baseOptions,
      maxRetries: 5,
      baseDelay: 2000,
    })
    expect(agent['maxRetries']).toBe(5)
    expect(agent['baseDelay']).toBe(2000)
  })

  it('constructor handles undefined optional values', () => {
    const minimalOptions = {
      name: 'minimal',
      client: mockClient,
      responseFormat: TestSchema,
    }
    const agent = new AIAgent(minimalOptions)
    expect(agent['systemInstructions']).toEqual([])
    expect(agent['tools']).toEqual([])
    expect(agent['maxRetries']).toBe(3) // default
    expect(agent['baseDelay']).toBe(1000) // default
  })

  it('formatPrompt wraps messages and includes instructions', () => {
    const agent = new AIAgent(baseOptions)
    const human = new HumanMessage('hello')
    const ctx = [new SystemMessage('ctx1')]
    const msgs = agent['formatPrompt'](human, ctx)

    // Updated expectations to match the actual implementation
    expect(msgs.length).toBeGreaterThanOrEqual(2)
    expect(msgs[0]).toBeInstanceOf(SystemMessage)

    // Check that the system instructions are included
    const systemMessage = msgs[0] as SystemMessage
    expect(typeof systemMessage.content).toBe('string')
    expect(systemMessage.content).toContain('=== SYSTEM INSTRUCTIONS ===')
    expect(systemMessage.content).toContain('instr')

    // Check that the context and input message are included
    expect(msgs).toContain(human)
  })

  it('formatPrompt includes tools descriptions when tools are provided', () => {
    const mockTools = [
      { name: 'tool1', description: 'Tool one description' },
      { name: 'tool2', description: 'Tool two description' },
    ] as any[]

    const agent = new AIAgent({
      ...baseOptions,
      tools: mockTools,
    })

    const human = new HumanMessage('hello with tools')
    const msgs = agent['formatPrompt'](human, [])

    // Find the message that contains tool descriptions
    const systemMessage = msgs[0] as SystemMessage
    expect(typeof systemMessage.content).toBe('string')
    expect(systemMessage.content).toContain('tool1')
    expect(systemMessage.content).toContain('Tool one description')
    expect(systemMessage.content).toContain('tool2')
    expect(systemMessage.content).toContain('Tool two description')
  })

  it('run invokes workflow with correct initial state and overrides', async () => {
    const agent = new AIAgent(baseOptions)
    const stub = vi.fn().mockResolvedValue({ name: 'X', text: 'Y' })
    Object.defineProperty(agent, 'agentWorkflow', {
      value: { runWithRetries: stub },
      writable: true,
    })
    const out = await agent.run(new HumanMessage('in'))

    // Updated expectations to match the current implementation
    expect(stub).toHaveBeenCalledWith(
      expect.objectContaining({
        initialState: expect.objectContaining({
          userInput: expect.any(HumanMessage),
          // The messages array now contains formatted messages
          messages: expect.any(Array),
        }),
      }),
      3,
      1000,
    )
    expect(out).toEqual({ name: 'X', text: 'Y' })

    const ctx2 = [new SystemMessage('o')]
    const config = { tags: ['a'] }
    await agent.run(new HumanMessage('in2'), ctx2, config)
    expect(stub).toHaveBeenCalledWith(
      expect.objectContaining({
        initialState: expect.objectContaining({
          userInput: expect.any(HumanMessage),
          // The messages array now includes the context
          messages: expect.any(Array),
        }),
        config,
      }),
      3,
      1000,
    )
  })

  it('run handles and propagates workflow errors', async () => {
    const agent = new AIAgent(baseOptions)
    const error = new Error('Workflow error')
    const stub = vi.fn().mockRejectedValue(error)
    Object.defineProperty(agent, 'agentWorkflow', {
      value: { runWithRetries: stub },
      writable: true,
    })

    await expect(agent.run(new HumanMessage('error test'))).rejects.toThrow(
      'Workflow error',
    )
    expect(stub).toHaveBeenCalledTimes(1)
  })

  it('creates a complete workflow for agent execution', () => {
    const agent = new AIAgent(baseOptions)
    expect(agent['agentWorkflow']).toBeDefined()
  })
})
