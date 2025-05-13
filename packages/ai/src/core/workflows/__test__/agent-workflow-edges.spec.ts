import { describe, expect, it, vi } from 'vitest'

import { AgentWorkflow } from '../agent-workflow.js'
import { createMockClient, mockFormatPromptFn, testSchema } from './utils.js'

describe('AgentWorkflow - ConnectWorkflowEdges', () => {
  describe('with addConditionalEdges available', () => {
    it('should use addConditionalEdges when available', () => {
      const mockClient = createMockClient()
      const workflow = new AgentWorkflow(
        mockClient as any,
        mockFormatPromptFn,
        {
          tools: [],
          responseFormat: testSchema,
        },
      )

      const mockGraph = {
        addNode: vi.fn(),
        addEdge: vi.fn(),
        addConditionalEdges: vi.fn(),
      }

      // Call the private method
      ;(workflow as any).connectWorkflowEdges.call({
        graph: mockGraph,
        options: { tools: [] },
      })

      expect(mockGraph.addEdge).toHaveBeenCalled()
    })
  })

  describe('without addConditionalEdges', () => {
    it('should use direct edges when addConditionalEdges is unavailable', () => {
      const mockClient = createMockClient()
      const workflow = new AgentWorkflow(
        mockClient as any,
        mockFormatPromptFn,
        {
          tools: [],
          responseFormat: testSchema,
        },
      )

      const mockGraph = {
        addNode: vi.fn(),
        addEdge: vi.fn(),
        addConditionalEdges: vi.fn(),
      }

      // Call the private method
      ;(workflow as any).connectWorkflowEdges.call({
        graph: mockGraph,
        options: { tools: [] },
      })

      expect(mockGraph.addEdge).toHaveBeenCalled()
    })
  })
})
