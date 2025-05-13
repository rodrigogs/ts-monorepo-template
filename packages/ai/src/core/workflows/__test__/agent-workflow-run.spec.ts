import { HumanMessage } from '@langchain/core/messages'
import { describe, expect, it, vi } from 'vitest'

import { AgentWorkflow } from '../agent-workflow.js'
import { createMockClient, mockFormatPromptFn, testSchema } from './utils.js'

describe('AgentWorkflow - Run Method', () => {
  it('should return result on successful run', async () => {
    const mockClient = createMockClient()
    const workflow = new AgentWorkflow(mockClient as any, mockFormatPromptFn, {
      tools: [],
      responseFormat: testSchema,
    })

    // Mock run to simulate a successful run with a result
    vi.spyOn(workflow as any, 'run').mockResolvedValue({
      testKey: 'testValue',
    })

    const result = await workflow.runWithRetries({
      initialState: {
        userInput: new HumanMessage('Test input'),
        messages: [],
      },
    })
    expect(result).toEqual({ testKey: 'testValue' })
  })

  it('should throw error when run completes without result', async () => {
    const mockClient = createMockClient()
    const workflow = new AgentWorkflow(mockClient as any, mockFormatPromptFn, {
      tools: [],
      responseFormat: testSchema,
    })

    // Mock run to simulate a run that doesn't produce a result
    vi.spyOn(workflow as any, 'run').mockRejectedValue(
      new Error('Workflow completed but no result was produced'),
    )

    await expect(
      workflow.runWithRetries({
        initialState: {
          userInput: new HumanMessage('Test input'),
          messages: [],
        },
      }),
    ).rejects.toThrow('Workflow completed but no result was produced')
  })
}, 10000)
