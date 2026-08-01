import { mergeStyleConfig } from './style'
import type { Script, SessionState, StyleConfig } from './types'

export const EXPORT_VERSION = 1

export interface ExportedSnapshot {
  version: number
  scriptLibrary: Script[]
  activeScriptId: string | null
  style: StyleConfig
}

export type ImportResult =
  | { ok: true; snapshot: ExportedSnapshot }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isScript(value: unknown): value is Script {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false
  if (!Array.isArray(value.cues)) return false
  return value.cues.every(
    (cue) =>
      isRecord(cue) &&
      typeof cue.id === 'string' &&
      typeof cue.text === 'string' &&
      typeof cue.kind === 'string',
  )
}

function validateSnapshot(value: unknown): ImportResult {
  if (!isRecord(value)) {
    return { ok: false, error: 'Import file is not a valid state object.' }
  }

  if (typeof value.version !== 'number') {
    return { ok: false, error: 'Import file is missing a version field.' }
  }

  if (value.version !== EXPORT_VERSION) {
    return {
      ok: false,
      error: `Unrecognised export version ${value.version}. This app supports version ${EXPORT_VERSION}.`,
    }
  }

  if (!Array.isArray(value.scriptLibrary) || !value.scriptLibrary.every(isScript)) {
    return { ok: false, error: 'Import file has an invalid script library.' }
  }

  if (
    value.activeScriptId !== null &&
    typeof value.activeScriptId !== 'string'
  ) {
    return { ok: false, error: 'Import file has an invalid active script id.' }
  }

  if (!isRecord(value.style)) {
    return { ok: false, error: 'Import file has an invalid style config.' }
  }

  const snapshot: ExportedSnapshot = {
    version: value.version,
    scriptLibrary: value.scriptLibrary,
    activeScriptId: value.activeScriptId as string | null,
    style: mergeStyleConfig(value.style as Partial<StyleConfig>),
  }

  if (
    snapshot.activeScriptId !== null &&
    !snapshot.scriptLibrary.some((script) => script.id === snapshot.activeScriptId)
  ) {
    return { ok: false, error: 'Import file references an active script that does not exist.' }
  }

  return { ok: true, snapshot }
}

export function exportState(state: SessionState): string {
  const snapshot: ExportedSnapshot = {
    version: EXPORT_VERSION,
    scriptLibrary: state.scriptLibrary,
    activeScriptId: state.activeScriptId,
    style: state.style,
  }
  return JSON.stringify(snapshot)
}

export function importState(json: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: 'Import file is not valid JSON.' }
  }

  return validateSnapshot(parsed)
}
