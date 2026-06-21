import { executeCommand } from '../executor/commandExecutor.js'
import { checkTool } from '../executor/toolChecker.js'
import { installTool } from '../executor/packageInstaller.js'
import { createTempDir, cleanupTempDir } from '../platform/pathResolver.js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export interface FuzzResult {
  success: boolean
  crashes: CrashInfo[]
  coverage: string
  raw: string
  duration: number
}

export interface CrashInfo {
  file: string
  input: string
  signal?: string
}

export async function runLibFuzzer(
  code: string,
  language: string,
  durationSeconds: number = 30
): Promise<FuzzResult> {
  // Check for clang
  let clangAvailable = await checkTool('clang++')
  if (!clangAvailable) {
    clangAvailable = await checkTool('clang')
  }
  if (!clangAvailable) {
    const installed = await installTool('clang')
    if (!installed) {
      return {
        success: false,
        crashes: [],
        coverage: '',
        raw: '',
        duration: 0,
      }
    }
  }

  const compiler = await checkTool('clang++') ? 'clang++' : 'clang'
  const tempDir = createTempDir('libfuzzer')
  const corpusDir = join(tempDir, 'corpus')
  const outputBinary = join(tempDir, 'fuzz')

  await mkdir(corpusDir, { recursive: true })

  // Generate harness if needed
  const harnessCode = generateHarness(code, language)
  const harnessFile = join(tempDir, 'fuzz.cpp')
  await writeFile(harnessFile, harnessCode)

  try {
    // Compile with libFuzzer
    const compileResult = await executeCommand({
      type: 'build',
      command: `${compiler} -fsanitize=fuzzer,address,undefined -g ${harnessFile} -o ${outputBinary}`,
    }, { timeout: 60000 })

    if (!compileResult.success) {
      return {
        success: false,
        crashes: [],
        coverage: '',
        raw: compileResult.stderr,
        duration: compileResult.duration,
      }
    }

    // Run fuzzer
    const fuzzResult = await executeCommand({
      type: 'shell',
      command: `${outputBinary} -max_total_time=${durationSeconds} ${corpusDir}`,
    }, { timeout: (durationSeconds + 10) * 1000 })

    // Collect crashes
    const crashes = await collectCrashes(tempDir)

    return {
      success: true,
      crashes,
      coverage: extractCoverage(fuzzResult.stdout),
      raw: fuzzResult.stdout + fuzzResult.stderr,
      duration: fuzzResult.duration,
    }
  } finally {
    cleanupTempDir(tempDir)
  }
}

function generateHarness(code: string, language: string): string {
  // Create a basic fuzzing harness
  return `#include <stdint.h>
#include <stdlib.h>
#include <string.h>

// User code
${code}

// Fuzzing entry point
extern "C" int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    if (size == 0) return 0;

    // Convert data to string and call main function
    char *input = (char *)malloc(size + 1);
    memcpy(input, data, size);
    input[size] = '\\0';

    // Try to call the main function
    // Users should customize this part
    free(input);
    return 0;
}
`
}

async function collectCrashes(dir: string): Promise<CrashInfo[]> {
  const crashes: CrashInfo[] = []
  const { readdirSync } = await import('fs')

  try {
    const files = readdirSync(dir)
    for (const file of files) {
      if (file.startsWith('crash-') || file.startsWith('oom-') || file.startsWith('leak-')) {
        crashes.push({
          file,
          input: `./${file}`,
        })
      }
    }
  } catch {
    // Ignore errors
  }

  return crashes
}

function extractCoverage(output: string): string {
  const lines = output.split('\n')
  for (const line of lines) {
    if (line.includes('cov:')) {
      return line.trim()
    }
  }
  return ''
}
