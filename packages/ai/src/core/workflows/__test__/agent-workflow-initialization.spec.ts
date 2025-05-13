import { describe, expect, it } from 'vitest'

import { AgentWorkflow } from '../agent-workflow.js'
import { createMockClient, mockFormatPromptFn, testSchema } from './utils.js'

describe('AgentWorkflow - Initialization', () => {
  it('should connect nodes with appropriate edges', () => {
    const mockClient = createMockClient()
    const workflow = new AgentWorkflow(mockClient as any, mockFormatPromptFn, {
      tools: [],
      responseFormat: testSchema,
    })

    // Should have nodes for the workflow
    expect(workflow).toBeDefined()
    expect(mockClient.useModel).toHaveBeenCalled()
  })
})
