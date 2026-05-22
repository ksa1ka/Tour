/**
 * Runs before `npm run dev` via the `predev` hook.
 * Stops whatever is listening on the API port so restarts don't hit EADDRINUSE.
 *
 * Port: `process.env.PORT` → `backend/.env` → default 4000 (matches env.ts).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env')

function parseEnvFile(content) {
  /** @type {Record<string, string>} */
  const map = {}
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    map[m[1]] = v
  }
  return map
}

function resolvePort() {
  const fromShell = process.env.PORT
  if (fromShell && /^\d+$/.test(String(fromShell))) return Number(fromShell)
  if (existsSync(envPath)) {
    const map = parseEnvFile(readFileSync(envPath, 'utf8'))
    if (map.PORT && /^\d+$/.test(map.PORT)) return Number(map.PORT)
  }
  return 4000
}

/** @param {number} port */
function pidsListeningOnPortWin(port) {
  const out = execFileSync('netstat', ['-ano'], { encoding: 'utf8' })
  const pids = new Set()
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) continue
    const parts = line.trim().split(/\s+/)
    if (parts.length < 4) continue
    const proto = parts[0]
    if (proto !== 'TCP' && proto !== 'TCPv6') continue
    const local = parts[1]
    const colon = local.lastIndexOf(':')
    if (colon === -1) continue
    const portStr = local.slice(colon + 1)
    if (portStr !== String(port)) continue
    const pid = parts[parts.length - 1]
    if (/^\d+$/.test(pid)) pids.add(pid)
  }
  return [...pids]
}

/** @param {number} port */
function freePortWin(port) {
  for (const pid of pidsListeningOnPortWin(port)) {
    try {
      execFileSync('taskkill', ['/PID', pid, '/F'], { stdio: 'ignore' })
    } catch {
      // ignore — process may have exited
    }
  }
}

/** @param {number} port */
function freePortUnix(port) {
  try {
    const pids = execFileSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf8' })
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGKILL')
      } catch {
        // ignore
      }
    }
  } catch {
    // lsof exits 1 if nothing uses the port
  }
}

const port = resolvePort()
if (process.platform === 'win32') freePortWin(port)
else freePortUnix(port)
