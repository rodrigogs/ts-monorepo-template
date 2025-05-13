import { describe, expect, it } from 'vitest'

import { MathTool } from './math.js'

describe('MathTool', () => {
  it('should have the correct metadata', () => {
    expect(MathTool.name).toBe('math-tool')
    expect(MathTool.description).toBe(
      'Performs basic arithmetic operations: add, subtract, multiply and divide',
    )
    expect(MathTool.schema).toBeDefined()
  })

  it('should perform addition correctly', async () => {
    const result = await MathTool.invoke({
      operation: 'add',
      number1: 5,
      number2: 3,
    })

    expect(result).toBe('8')
  })

  it('should perform subtraction correctly', async () => {
    const result = await MathTool.invoke({
      operation: 'subtract',
      number1: 10,
      number2: 4,
    })

    expect(result).toBe('6')
  })

  it('should perform multiplication correctly', async () => {
    const result = await MathTool.invoke({
      operation: 'multiply',
      number1: 6,
      number2: 7,
    })

    expect(result).toBe('42')
  })

  it('should perform division correctly', async () => {
    const result = await MathTool.invoke({
      operation: 'divide',
      number1: 20,
      number2: 5,
    })

    expect(result).toBe('4')
  })

  it('should handle division by zero', async () => {
    const result = await MathTool.invoke({
      operation: 'divide',
      number1: 10,
      number2: 0,
    })

    expect(result).toBe('Error: cannot divide by zero!')
  })

  it('should work with negative numbers', async () => {
    const result = await MathTool.invoke({
      operation: 'add',
      number1: -5,
      number2: 3,
    })

    expect(result).toBe('-2')
  })

  it('should work with decimal numbers', async () => {
    const result = await MathTool.invoke({
      operation: 'multiply',
      number1: 2.5,
      number2: 2,
    })

    expect(result).toBe('5')
  })
})
