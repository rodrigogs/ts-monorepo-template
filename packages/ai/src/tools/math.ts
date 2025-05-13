import { tool } from '@langchain/core/tools'
import { z } from 'zod'

const MathSchema = z
  .object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    number1: z.number(),
    number2: z.number(),
  })
  .strict()

export const MathTool = tool(
  async (input: z.infer<typeof MathSchema>) => {
    const { operation, number1, number2 } = input

    switch (operation) {
      case 'add':
        return (number1 + number2).toString()
      case 'subtract':
        return (number1 - number2).toString()
      case 'multiply':
        return (number1 * number2).toString()
      case 'divide':
        if (number2 === 0) {
          return 'Error: cannot divide by zero!'
        }
        return (number1 / number2).toString()
    }
  },
  {
    name: 'math-tool',
    description:
      'Performs basic arithmetic operations: add, subtract, multiply and divide',
    schema: MathSchema,
  },
)
