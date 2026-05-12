import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const host = '127.0.0.1'
const port = '4173'
const baseUrl = `http://${host}:${port}`

function pipeOutput(child, prefix) {
  child.stdout?.on('data', (chunk) => {
    process.stdout.write(`[${prefix}] ${chunk}`)
  })
  child.stderr?.on('data', (chunk) => {
    process.stderr.write(`[${prefix}] ${chunk}`)
  })
}

async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)

      if (response.ok) {
        return
      }
    } catch {
      await delay(250)
    }
  }

  throw new Error(`Timed out waiting for ${url}`)
}

async function stopProcess(child) {
  if (!child.pid || child.exitCode !== null) {
    return
  }

  child.stdout?.destroy()
  child.stderr?.destroy()
  child.kill()

  await Promise.race([
    new Promise((resolve) => {
      child.once('exit', resolve)
      child.once('error', resolve)
    }),
    delay(1_000),
  ])

  if (child.exitCode === null && process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      detached: true,
      stdio: 'ignore',
    })
    killer.unref()
  }

  child.unref()
}

async function run() {
  const vite = spawn(
    process.execPath,
    ['./node_modules/vite/bin/vite.js', '--host', host, '--port', port],
    {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  pipeOutput(vite, 'vite')

  try {
    await waitForServer(baseUrl, 30_000)

    const playwright = spawn(
      process.execPath,
      ['./node_modules/playwright/cli.js', 'test', '--config=playwright.config.ts'],
      {
        env: {
          ...process.env,
          METROPICK_E2E_MANAGED: '1',
        },
        stdio: 'inherit',
      },
    )

    const exitCode = await new Promise((resolve) => {
      playwright.on('exit', (code) => resolve(code ?? 1))
      playwright.on('error', () => resolve(1))
    })

    process.exitCode = Number(exitCode)
  } finally {
    await stopProcess(vite)
  }
}

run().catch(async (error) => {
  console.error(error)
  process.exitCode = 1
})
