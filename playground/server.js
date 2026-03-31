import jsonServer from 'json-server'
import multer from 'multer'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

// Multer for file uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})
const upload = multer({ storage })

app.use(cors())
app.use(jsonServer.bodyParser)

// --- File upload endpoint ---
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }
  console.log(`[UPLOAD] ${req.file.originalname} → ${req.file.filename} (${req.file.size} bytes)`)
  res.json({
    id: Date.now(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    path: `/uploads/${req.file.filename}`,
    mimetype: req.file.mimetype,
  })
})

// --- Serve uploaded files ---
app.use('/uploads', jsonServer.defaults({ static: path.join(__dirname, 'uploads') }))

// --- Validation test endpoint (always returns 422) ---
app.post('/test-validation', (req, res) => {
  const body = req.body || {}
  const errors = {}

  if (!body.name || body.name.trim() === '') {
    errors.name = ['Name is required']
  }
  if (!body.email || !body.email.includes('@')) {
    errors.email = ['Valid email is required']
  }
  if (body.age !== undefined && (body.age < 0 || body.age > 120)) {
    errors.age = ['Age must be between 0 and 120']
  }

  if (Object.keys(errors).length > 0) {
    console.log(`[VALIDATION] 422:`, errors)
    return res.status(422).json(errors)
  }

  console.log(`[VALIDATION] 200: OK`)
  res.json({ success: true, data: body })
})

// --- Bulk save endpoint ---
app.patch('/users/bulk', (req, res) => {
  const items = req.body
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Expected array of objects' })
  }

  const db = router.db
  const results = []
  for (const item of items) {
    if (item.id) {
      db.get('users').find({ id: item.id }).assign(item).write()
      results.push(db.get('users').find({ id: item.id }).value())
    }
  }

  console.log(`[BULK SAVE] Updated ${results.length} users`)
  res.json(results)
})

// --- Bulk delete endpoint ---
app.delete('/users/bulk', (req, res) => {
  const ids = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Expected array of IDs' })
  }

  const db = router.db
  for (const id of ids) {
    db.get('users').remove({ id }).write()
  }

  console.log(`[BULK DELETE] Removed IDs: ${ids.join(', ')}`)
  res.status(204).end()
})

// --- JSON Server default routes ---
app.use(middlewares)
app.use(router)

app.listen(3001, () => {
  console.log(`\n  API Server running on http://localhost:3001`)
  console.log(`  - REST:       http://localhost:3001/users`)
  console.log(`  - Upload:     POST http://localhost:3001/upload`)
  console.log(`  - Validation: POST http://localhost:3001/test-validation`)
  console.log(`  - Bulk delete: DELETE http://localhost:3001/users/bulk\n`)
})
