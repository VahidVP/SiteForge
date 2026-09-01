import type { Blueprint, Catalog } from '@siteforge/shared'

export async function fetchCatalog(): Promise<Catalog> {
  let res: Response
  try {
    res = await fetch('/api/catalog')
  } catch (err) {
    // fetch() rejects on connection errors (ECONNRESET / refused) — give a
    // clear, actionable message instead of the raw "socket closed unexpectedly".
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(`Cannot connect to the generator API (${detail}). Start it with: npm run dev:api`)
  }
  if (!res.ok) {
    throw new Error(`The generator API is not responding (status ${res.status}). Start it with: npm run dev:api`)
  }
  return res.json() as Promise<Catalog>
}

export async function generateSite(bp: Blueprint): Promise<void> {
  let res: Response
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bp)
    })
  } catch (err) {
    // Same treatment as above: connection resets during a long generate are
    // common when the API restarts — surface a clear message.
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(`Cannot connect to the generator API (${detail}). Start it with: npm run dev:api`)
  }

  if (!res.ok) {
    let message = 'Generation failed.'
    try {
      const data = (await res.json()) as { error?: string }
      if (typeof data.error === 'string') message = data.error
    } catch {
      // no JSON body
    }
    throw new Error(message)
  }

  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = /filename="?([^";]+)"?/.exec(disposition)
  downloadBlob(blob, match?.[1] ?? `${bp.projectName}.zip`)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 5000)
}
