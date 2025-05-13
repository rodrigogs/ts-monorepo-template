import type { BaseMessage } from '@langchain/core/messages'
import { AIMessage } from '@langchain/core/messages'
import { vi } from 'vitest'
import { z } from 'zod'

// Mock model to use in tests
export const createMockModel = () => ({
  invoke: vi.fn().mockResolvedValue(new AIMessage('Test response')),
  _modelType: () => 'chat_model',
  lc_serializable: true,
  lc_namespace: ['test'],
  bindTools: vi.fn().mockReturnThis(),
})

// Create a mock client
export const createMockClient = () => ({
  useModel: vi.fn().mockReturnValue(createMockModel()),
})

// Create a mock format prompt function
export const mockFormatPromptFn = (
  input: BaseMessage,
  messages: BaseMessage[],
) => {
  return [input, ...messages]
}

// Test schema
export const testSchema = z.object({
  testKey: z.string(),
})
