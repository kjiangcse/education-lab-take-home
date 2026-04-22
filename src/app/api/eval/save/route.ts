import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// This route runs on Node, not edge — needs filesystem access
// export const runtime = 'nodejs' // default

export async function POST(req: Request) {
  const data = await req.json()

  const dir = join(process.cwd(), 'eval-results')
  await mkdir(dir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `sim-${timestamp}.json`
  const filepath = join(dir, filename)

  await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8')

  return Response.json({ saved: true, filename, path: filepath })
}
