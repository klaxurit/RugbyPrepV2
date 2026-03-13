import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const matrixPath = path.join(rootDir, 'docs/testing/ec-traceability-matrix.md')

const fail = (message) => {
  console.error(`[ec-matrix] ${message}`)
  process.exit(1)
}

if (!fs.existsSync(matrixPath)) {
  fail(`Missing matrix file: ${matrixPath}`)
}

const matrixContent = fs.readFileSync(matrixPath, 'utf8')
const lines = matrixContent.split('\n')
const edgeRows = lines.filter((line) => /^\|\s*EC-\d{2}\s*\|/.test(line))

const requiredIds = Array.from({ length: 12 }, (_, index) =>
  `EC-${String(index + 1).padStart(2, '0')}`
)

const foundIds = new Set()
const errors = []

for (const row of edgeRows) {
  const cells = row.split('|').map((cell) => cell.trim())
  const edgeId = cells[1]
  const testsCell = cells[4] ?? ''
  foundIds.add(edgeId)

  const referencedFiles = testsCell
    .split(',')
    .map((value) => value.trim().replace(/^`|`$/g, ''))
    .filter((value) => value.length > 0)

  if (referencedFiles.length === 0) {
    errors.push(`${edgeId}: no referenced test files`)
    continue
  }

  for (const filePath of referencedFiles) {
    const absolutePath = path.join(rootDir, filePath)
    if (!fs.existsSync(absolutePath)) {
      errors.push(`${edgeId}: missing test file '${filePath}'`)
    }
  }
}

for (const edgeId of requiredIds) {
  if (!foundIds.has(edgeId)) {
    errors.push(`missing row for ${edgeId}`)
  }
}

if (errors.length > 0) {
  console.error('[ec-matrix] Traceability check failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(`[ec-matrix] OK — ${requiredIds.length} edge cases mapped to existing tests.`)

