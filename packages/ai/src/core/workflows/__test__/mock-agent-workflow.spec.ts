import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('MockAgentWorkflow', () => {
  class MockAgentWorkflow {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async run(params?: any) {
      return { result: { test: 'value' } }
    }

    async runWithRetries(params: any, maxRetries = 2, retryDelayMs = 1000) {
      let lastError: Error | undefined
      let remainingRetries = maxRetries

      // First attempt
      try {
        return await this.run(params)
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.log(`Initial attempt failed: ${lastError.message}. Retrying...`)
      }

      // Retry loop
      while (remainingRetries > 0) {
        try {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
          return await this.run(params)
        } catch (err) {
          remainingRetries--
          lastError = err instanceof Error ? err : new Error(String(err))
          console.log(
            `Retry failed (${maxRetries - remainingRetries}/${maxRetries}): ${
              lastError.message
            }${
              remainingRetries > 0 ? '. Retrying...' : '. No more retries left.'
            }`,
          )
        }
      }

      if (lastError) {
        throw lastError
      }

      return { result: { test: 'value' } }
    }
  }

  let workflow: MockAgentWorkflow
  let runSpy: any

  beforeEach(() => {
    workflow = new MockAgentWorkflow()
    runSpy = vi.spyOn(workflow, 'run')
  })

  it('should succeed on first attempt if no errors', async () => {
    runSpy.mockResolvedValueOnce({ result: { test: 'success' } })

    const result = await workflow.runWithRetries({ test: 'params' }, 3, 10)

    expect(runSpy).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ result: { test: 'success' } })
  })

  it('should retry on failure and succeed on later attempt', async () => {
    // First call fails, second succeeds
    runSpy
      .mockRejectedValueOnce(new Error('First try failed'))
      .mockResolvedValueOnce({ result: { test: 'success-after-retry' } })

    vi.useFakeTimers()

    const resultPromise = workflow.runWithRetries({ test: 'params' }, 2, 50)

    // Fast-forward through timeouts
    await vi.runAllTimersAsync()

    const result = await resultPromise

    expect(runSpy).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ result: { test: 'success-after-retry' } })

    vi.useRealTimers()
  })

  it('should fail after maximum retry attempts', async () => {
    const testError = new Error('Always fails')
    runSpy.mockRejectedValue(testError)

    vi.useFakeTimers()

    const promise = workflow.runWithRetries({ test: 'params' }, 2, 50)

    promise.catch(() => {
      /* Explicit empty catch to handle rejection */
    })

    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('Always fails')
    expect(runSpy).toHaveBeenCalledTimes(3) // Initial attempt + 2 retries

    vi.useRealTimers()
  })

  it('should handle non-Error rejection values', async () => {
    // Simulate a non-Error rejection
    runSpy.mockRejectedValue('String error')

    vi.useFakeTimers()

    const promise = workflow.runWithRetries({ test: 'params' }, 1, 50)

    promise.catch(() => {
      /* Explicit empty catch to handle rejection */
    })

    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('String error')
    expect(runSpy).toHaveBeenCalledTimes(2) // Initial + 1 retry

    vi.useRealTimers()
  })
})
