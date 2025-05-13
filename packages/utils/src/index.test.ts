import { tmpdir } from 'os'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

import { getDirname } from './file/get-dirname.js'
import * as utils from './index.js'

describe('integration tests for utils', () => {
  describe('FileUtils', async () => {
    const currentDirname = getDirname()

    describe('checkFileExists', () => {
      it('checkFileExists should return true when file exists', async () => {
        const result = await utils.FileUtils.checkFileExists(
          `${currentDirname}/index.ts`,
        )
        expect(result).toBe(true)
      })

      it('checkFileExists should return false when file does not exist', async () => {
        const result = await utils.FileUtils.checkFileExists('idontexist')
        expect(result).toBe(false)
      })
    })

    describe('findNearestPackageJson', () => {
      it('should find the nearest package.json', async () => {
        const result = utils.FileUtils.findNearestPackageJson(currentDirname)
        expect(result).toBe(resolve(currentDirname, '../package.json'))
      })

      it('should return null when no package.json is found', async () => {
        const tmpDir = tmpdir()
        const result = utils.FileUtils.findNearestPackageJson(tmpDir)
        expect(result).toBeNull()
      })
    })
  })

  describe('TimeUtils', () => {
    describe('#delay', () => {
      it('should resolve after 100ms', async () => {
        const start = Date.now()
        await utils.TimeUtils.delay(100)
        const end = Date.now()
        expect(end - start).toBeGreaterThanOrEqual(100)
      })
    })
  })
})
