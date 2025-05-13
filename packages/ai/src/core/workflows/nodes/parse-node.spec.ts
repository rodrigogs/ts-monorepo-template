import { AIMessage } from '@langchain/core/messages'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { createParseNode } from './parse-node.js'

// Mock the logger to avoid console output in tests
vi.mock('@repo/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('createParseNode', () => {
  const mockSchema = z.object({
    name: z.string(),
    value: z.number(),
  })

  it('should parse valid JSON successfully', async () => {
    const parseNode = createParseNode(mockSchema)
    const state = {
      messages: [
        new AIMessage('irrelevant'),
        new AIMessage('{"name":"test","value":123}'),
      ],
    }

    // @ts-expect-error - ignore
    const result = await parseNode(state)
    expect(result).toEqual({
      result: { name: 'test', value: 123 },
    })
  })

  it('should extract JSON from code blocks', async () => {
    const parseNode = createParseNode(mockSchema)
    const state = {
      messages: [new AIMessage('```json\n{"name":"test","value":123}\n```')],
    }

    // @ts-expect-error - ignore
    const result = await parseNode(state)
    expect(result).toEqual({
      result: { name: 'test', value: 123 },
    })
  })

  it('should extract JSON from code blocks without language specifier', async () => {
    const parseNode = createParseNode(mockSchema)
    const state = {
      messages: [new AIMessage('```\n{"name":"test","value":123}\n```')],
    }

    // @ts-expect-error - ignore
    const result = await parseNode(state)
    expect(result).toEqual({
      result: { name: 'test', value: 123 },
    })
  })

  it('should throw error when parsing invalid JSON', async () => {
    const parseNode = createParseNode(mockSchema)
    const state = {
      messages: [new AIMessage('not json')],
    }

    // @ts-expect-error - ignore
    await expect(parseNode(state)).rejects.toThrow('Failed to parse JSON')
  })

  it('should throw error when JSON does not match schema', async () => {
    const parseNode = createParseNode(mockSchema)
    const state = {
      messages: [new AIMessage('{"wrong":"field"}')],
    }

    // @ts-expect-error - ignore
    await expect(parseNode(state)).rejects.toThrow('Output validation failed')
  })

  it('should throw error when JSON has wrong types', async () => {
    const parseNode = createParseNode(mockSchema)
    const state = {
      messages: [new AIMessage('{"name":123,"value":"wrong type"}')],
    }

    // @ts-expect-error - ignore
    await expect(parseNode(state)).rejects.toThrow('Output validation failed')
  })

  it('should handle empty output', async () => {
    const parseNode = createParseNode(mockSchema)
    const state = {
      messages: [new AIMessage('')],
    }

    // @ts-expect-error - ignore
    await expect(parseNode(state)).rejects.toThrow('Failed to parse JSON')
  })

  it('should handle code block with no content', async () => {
    const parseNode = createParseNode(mockSchema)
    const state = {
      messages: [new AIMessage('```\n\n```')],
    }

    // @ts-expect-error - ignore
    await expect(parseNode(state)).rejects.toThrow('Failed to parse JSON')
  })

  it('should throw error if JSON.parse throws a non-Error value', async () => {
    // Mock JSON.parse to throw a string instead of an Error
    const originalJSONParse = JSON.parse
    JSON.parse = vi.fn().mockImplementation(() => {
      throw 'Not a real error'
    })

    try {
      const parseNode = createParseNode(mockSchema)
      const state = {
        messages: [new AIMessage('{"invalid": json}')],
      }

      // @ts-expect-error - ignore
      await expect(parseNode(state)).rejects.toThrow('Failed to parse JSON')
    } finally {
      // Restore original implementation
      JSON.parse = originalJSONParse
    }
  })

  it('should throw error if schema.parse throws a non-Error value', async () => {
    // Create a schema that throws a non-Error value
    const badSchema = {
      parse: vi.fn().mockImplementation(() => {
        throw 'Schema validation failed'
      }),
    }

    const parseNode = createParseNode(badSchema as any)
    const state = {
      messages: [new AIMessage('{"any":"json"}')],
    }

    // @ts-expect-error - ignore
    await expect(parseNode(state)).rejects.toThrow('Output validation failed')
  })

  it('should throw error when last message is not an AIMessage', async () => {
    const parseNode = createParseNode(mockSchema)
    const state = {
      messages: [{ content: '{"name":"test","value":123}' }],
    }

    // @ts-expect-error - ignore
    await expect(parseNode(state)).rejects.toThrow(
      'Expected the last message to be an AIMessage',
    )
  })

  // New test to cover non-string content handling in AIMessage
  it('should handle AIMessage with non-string content object', async () => {
    const parseNode = createParseNode(mockSchema)

    // Create an AIMessage with an object as content
    const complexContent = JSON.stringify({ name: 'test', value: 123 })
    const aiMessage = new AIMessage({ content: complexContent })

    const state = {
      messages: [aiMessage],
    }

    // @ts-expect-error - ignore
    const result = await parseNode(state)
    expect(result).toEqual({
      result: { name: 'test', value: 123 },
    })
  })
})
