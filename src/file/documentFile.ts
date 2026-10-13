import { isTheme } from '../app/theme'
import {
  DOCUMENT_VERSION,
  type DocumentSettings,
  type Item,
  type Label,
  type Opening,
  type OpeningKind,
  type PlanDocument,
  type PointMm,
  type Wall,
} from '../document/types'

export const DOCUMENT_FILE_EXTENSION = '.housedraw.json'
export const DOCUMENT_FILE_NAME = `plan${DOCUMENT_FILE_EXTENSION}`

export type ParseDocumentResult =
  | { ok: true; document: PlanDocument }
  | { ok: false; error: string }

type RawPlan = Record<string, unknown>

/** Step `n` upgrades a plan from version `n` to `n + 1`. Empty while only version 1 exists. */
const MIGRATIONS: Record<number, (raw: RawPlan) => RawPlan> = {}

class InvalidFieldError extends Error {}

export function serializeDocument(plan: PlanDocument): string {
  return `${JSON.stringify(plan, null, 2)}\n`
}

export function parseDocument(text: string): ParseDocumentResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: 'The file does not contain a plan object.' }
  }
  const version = parsed.version
  if (
    typeof version !== 'number' ||
    !Number.isInteger(version) ||
    version < 1
  ) {
    return { ok: false, error: 'The file has no valid "version" field.' }
  }
  if (version > DOCUMENT_VERSION) {
    return {
      ok: false,
      error: `This plan uses format version ${version}, but this app reads up to version ${DOCUMENT_VERSION}. Update HouseDraw to open it.`,
    }
  }

  let current: RawPlan = parsed
  for (let from = version; from < DOCUMENT_VERSION; from += 1) {
    const migrate = MIGRATIONS[from]
    if (!migrate) {
      return {
        ok: false,
        error: `No migration exists from format version ${from}.`,
      }
    }
    current = migrate(current)
  }

  try {
    return { ok: true, document: readPlan(current) }
  } catch (error) {
    if (error instanceof InvalidFieldError) {
      return { ok: false, error: `Invalid plan file: ${error.message}.` }
    }
    throw error
  }
}

function readPlan(raw: RawPlan): PlanDocument {
  return {
    version: expectLiteral(raw.version, DOCUMENT_VERSION, 'version'),
    unit: expectLiteral(raw.unit, 'mm', 'unit'),
    settings: readSettings(raw.settings, 'settings'),
    walls: expectArray(raw.walls, 'walls').map((value, index) =>
      readWall(value, `walls[${index}]`),
    ),
    openings: expectArray(raw.openings, 'openings').map((value, index) =>
      readOpening(value, `openings[${index}]`),
    ),
    items: expectArray(raw.items, 'items').map((value, index) =>
      readItem(value, `items[${index}]`),
    ),
    labels: expectArray(raw.labels, 'labels').map((value, index) =>
      readLabel(value, `labels[${index}]`),
    ),
  }
}

function readSettings(value: unknown, path: string): DocumentSettings {
  const raw = expectRecord(value, path)
  const theme = raw.theme
  if (!isTheme(theme)) {
    throw invalid(`${path}.theme`, '"dark" or "light"')
  }
  return {
    gridMm: expectPositive(raw.gridMm, `${path}.gridMm`),
    wallThicknessMm: expectPositive(
      raw.wallThicknessMm,
      `${path}.wallThicknessMm`,
    ),
    theme,
  }
}

function readWall(value: unknown, path: string): Wall {
  const raw = expectRecord(value, path)
  return {
    id: expectString(raw.id, `${path}.id`),
    a: readPoint(raw.a, `${path}.a`),
    b: readPoint(raw.b, `${path}.b`),
    thicknessMm: expectPositive(raw.thicknessMm, `${path}.thicknessMm`),
  }
}

function readOpening(value: unknown, path: string): Opening {
  const raw = expectRecord(value, path)
  return {
    id: expectString(raw.id, `${path}.id`),
    type: expectOneOf<OpeningKind>(
      raw.type,
      ['door', 'window'],
      `${path}.type`,
    ),
    wallId: expectString(raw.wallId, `${path}.wallId`),
    offsetMm: expectNumber(raw.offsetMm, `${path}.offsetMm`),
    widthMm: expectPositive(raw.widthMm, `${path}.widthMm`),
  }
}

function readItem(value: unknown, path: string): Item {
  const raw = expectRecord(value, path)
  return {
    id: expectString(raw.id, `${path}.id`),
    catalogId: expectString(raw.catalogId, `${path}.catalogId`),
    x: expectNumber(raw.x, `${path}.x`),
    y: expectNumber(raw.y, `${path}.y`),
    widthMm: expectPositive(raw.widthMm, `${path}.widthMm`),
    heightMm: expectPositive(raw.heightMm, `${path}.heightMm`),
    rotationDeg: expectNumber(raw.rotationDeg, `${path}.rotationDeg`),
  }
}

function readLabel(value: unknown, path: string): Label {
  const raw = expectRecord(value, path)
  return {
    id: expectString(raw.id, `${path}.id`),
    text: expectString(raw.text, `${path}.text`),
    x: expectNumber(raw.x, `${path}.x`),
    y: expectNumber(raw.y, `${path}.y`),
  }
}

function readPoint(value: unknown, path: string): PointMm {
  const raw = expectRecord(value, path)
  return {
    x: expectNumber(raw.x, `${path}.x`),
    y: expectNumber(raw.y, `${path}.y`),
  }
}

function isRecord(value: unknown): value is RawPlan {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalid(path: string, expected: string): InvalidFieldError {
  return new InvalidFieldError(`${path} must be ${expected}`)
}

function expectRecord(value: unknown, path: string): RawPlan {
  if (!isRecord(value)) {
    throw invalid(path, 'an object')
  }
  return value
}

function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw invalid(path, 'an array')
  }
  return value
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw invalid(path, 'a string')
  }
  return value
}

function expectNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalid(path, 'a finite number')
  }
  return value
}

function expectPositive(value: unknown, path: string): number {
  const number = expectNumber(value, path)
  if (number <= 0) {
    throw invalid(path, 'greater than zero')
  }
  return number
}

function expectLiteral<T extends string | number>(
  value: unknown,
  expected: T,
  path: string,
): T {
  if (value !== expected) {
    throw invalid(path, JSON.stringify(expected))
  }
  return expected
}

function expectOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
  path: string,
): T {
  const found = options.find((option) => option === value)
  if (found === undefined) {
    throw invalid(path, options.map((option) => `"${option}"`).join(' or '))
  }
  return found
}
