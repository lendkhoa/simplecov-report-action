import path from 'path'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {report} from './report'

interface Result {
  result: {
    covered_percent?: number // NOTE: simplecov < 0.21.0
    line?: number
  }
}

async function run(): Promise<void> {
  try {
    if (!github.context.issue.number) {
      core.warning('Cannot find the PR id.')
      return
    }

    const failedThreshold: number = Number.parseFloat(core.getInput('failedThreshold'))
    core.debug(`failedThreshold ${failedThreshold}`)

    const resultPath: string = core.getInput('resultPath')
    core.debug(`resultPath ${resultPath}`)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const json = require(path.resolve(process.env.GITHUB_WORKSPACE!, resultPath)) as Result
    const coveredPercent = json.result.covered_percent ?? json.result.line

    if (coveredPercent === undefined) {
      throw new Error('Coverage is undefined!')
    }

    await report(coveredPercent, failedThreshold)

    if (coveredPercent < failedThreshold) {
      throw new Error(`Coverage is less than ${failedThreshold}%. (${coveredPercent}%)`)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
