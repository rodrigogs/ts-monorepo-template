import { HumanMessage } from '@langchain/core/messages'
import { describe, expect, it, vi } from 'vitest'

import { AgentWorkflow } from '../agent-workflow.js'
import { createMockClient, mockFormatPromptFn, testSchema } from './utils.js'

describe('AgentWorkflow - RunWithRetries Method', () => {
  it('should succeed on first attempt', async () => {
    const mockClient = createMockClient()
    const workflow = new AgentWorkflow(mockClient as any, mockFormatPromptFn, {
      tools: [],
      responseFormat: testSchema,
    })

    const runSpy = vi
      .spyOn(workflow as any, 'run')
      .mockResolvedValue({ testKey: 'Success' })

    const result = await workflow.runWithRetries(
      {
        initialState: {
          userInput: new HumanMessage('Test input'),
          messages: [],
        },
      },
      2,
      10,
    )

    expect(runSpy).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ testKey: 'Success' })
  })

  it('should retry on failure and succeed on later attempt', async () => {
    const mockClient = createMockClient()
    const workflow = new AgentWorkflow(mockClient as any, mockFormatPromptFn, {
      tools: [],
      responseFormat: testSchema,
    })

    const runSpy = vi
      .spyOn(workflow as any, 'run')
      .mockRejectedValueOnce(new Error('First try failed'))
      .mockResolvedValue({ testKey: 'Success' })

    const result = await workflow.runWithRetries(
      {
        initialState: {
          userInput: new HumanMessage('Test input'),
          messages: [],
        },
      },
      2,
      10,
    )

    expect(runSpy).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ testKey: 'Success' })
  })

  it('should fail after maximum retry attempts', async () => {
    const mockClient = createMockClient()
    const workflow = new AgentWorkflow(mockClient as any, mockFormatPromptFn, {
      tools: [],
      responseFormat: testSchema,
    })

    const runSpy = vi
      .spyOn(workflow as any, 'run')
      .mockRejectedValue(new Error('Always fails'))

    await expect(
      workflow.runWithRetries(
        {
          initialState: {
            userInput: new HumanMessage('Test input'),
            messages: [],
          },
        },
        2,
        10,
      ),
    ).rejects.toThrow('Always fails')

    expect(runSpy).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })
})
