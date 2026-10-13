import type { PlanDocument } from '../document/types'
import {
  DOCUMENT_FILE_EXTENSION,
  DOCUMENT_FILE_NAME,
  parseDocument,
  serializeDocument,
} from './documentFile'
import { downloadBlob } from './download'

type WritableLike = {
  write: (data: string) => Promise<void>
  close: () => Promise<void>
}

type FileHandleLike = {
  getFile: () => Promise<File>
  createWritable: () => Promise<WritableLike>
}

type PickerType = {
  description: string
  accept: Record<string, string[]>
}

type FilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string
    types: PickerType[]
  }) => Promise<FileHandleLike>
  showOpenFilePicker?: (options: {
    types: PickerType[]
    multiple: false
  }) => Promise<FileHandleLike[]>
}

const PLAN_PICKER_TYPES: PickerType[] = [
  {
    description: 'HouseDraw plan',
    accept: { 'application/json': [DOCUMENT_FILE_EXTENSION] },
  },
]

/** Handle of the file the plan was opened from or last saved to. Only set when the File System Access API is used. */
let linkedHandle: FileHandleLike | null = null

export type SaveResult = 'saved' | 'cancelled'

export type OpenResult =
  | { status: 'opened'; document: PlanDocument }
  | { status: 'cancelled' }
  | { status: 'invalid'; error: string }

export async function savePlanFile(plan: PlanDocument): Promise<SaveResult> {
  const text = serializeDocument(plan)
  const picker = (window as FilePickerWindow).showSaveFilePicker

  if (!picker) {
    downloadBlob(
      new Blob([text], { type: 'application/json' }),
      DOCUMENT_FILE_NAME,
    )
    return 'saved'
  }

  try {
    const handle =
      linkedHandle ??
      (await picker({
        suggestedName: DOCUMENT_FILE_NAME,
        types: PLAN_PICKER_TYPES,
      }))
    const writable = await handle.createWritable()
    await writable.write(text)
    await writable.close()
    linkedHandle = handle
    return 'saved'
  } catch (error) {
    if (isAbortError(error)) {
      return 'cancelled'
    }
    throw error
  }
}

export async function openPlanFile(): Promise<OpenResult> {
  const picker = (window as FilePickerWindow).showOpenFilePicker
  let file: File
  let handle: FileHandleLike | null = null

  if (picker) {
    try {
      const [picked] = await picker({
        types: PLAN_PICKER_TYPES,
        multiple: false,
      })
      if (!picked) {
        return { status: 'cancelled' }
      }
      handle = picked
      file = await picked.getFile()
    } catch (error) {
      if (isAbortError(error)) {
        return { status: 'cancelled' }
      }
      throw error
    }
  } else {
    const picked = await pickFileWithInput()
    if (!picked) {
      return { status: 'cancelled' }
    }
    file = picked
  }

  const result = parseDocument(await file.text())
  if (!result.ok) {
    return { status: 'invalid', error: result.error }
  }
  linkedHandle = handle
  return { status: 'opened', document: result.document }
}

function pickFileWithInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = `${DOCUMENT_FILE_EXTENSION},application/json`
    input.addEventListener('change', () => {
      resolve(input.files?.[0] ?? null)
    })
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
