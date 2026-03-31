import { useState, useMemo, useCallback, useEffect } from 'react'
import { isEmpty } from 'lodash-es'
import { Model, Collection } from '@risklight/models'
import { useModelState } from '@risklight/models/react'
import { User } from '../mc/models/User'
import { Users } from '../mc/collections/Users'

const API = 'http://localhost:3001'

const formatError = (err: any) => Array.isArray(err) ? err.join(', ') : String(err || '')

// ============================================
// TEST 1: UPLOAD
// ============================================

function UploadTest({ addLog }: { addLog: (msg: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [uploading, setUploading] = useState(false)

  class UploadModel extends Model {
    defaults() { return { id: null, filename: '', path: '' } }
    routes() { return { save: `${API}/upload` } }
    options() { return { identifier: 'id' } }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    const model = new UploadModel()
    try {
      await model.upload({ data: { file, field: 'avatar' } })
      setResult(model.toJSON())
      addLog(`Upload OK: ${file.name}`)
    } catch (e: any) {
      addLog(`Upload FAIL: ${e.message}`)
    }
    setUploading(false)
  }

  return (
    <fieldset style={{ marginBottom: 20, padding: 15, border: '2px solid #2196F3', borderRadius: 8 }}>
      <legend style={{ fontWeight: 700, color: '#2196F3', fontSize: 16 }}>1. File Upload (FormData)</legend>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button onClick={handleUpload} disabled={!file || uploading}
          style={{ padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {result && <div style={{ padding: 10, background: '#e8f5e9', borderRadius: 4, fontSize: 13 }}>Result: {JSON.stringify(result)}</div>}
    </fieldset>
  )
}

// ============================================
// TEST 2: BACKEND VALIDATION (422)
// ============================================

function ValidationTest({ addLog }: { addLog: (msg: string) => void }) {
  class ValidatedModel extends Model {
    defaults() { return { id: null, name: '', email: '', age: 0 } }
    routes() { return { save: `${API}/test-validation` } }
    options() { return { identifier: 'id', saveUnchanged: true } }
    getSaveMethod() { return 'POST' }
    getSaveURL() { return `${API}/test-validation` }
  }

  const [model] = useState(() => new ValidatedModel())
  const state = useModelState(model)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  const handleSend = async () => {
    setSaving(true)
    setErrors({})
    try {
      await model.save()
      addLog('Backend validation: OK')
      setErrors({})
    } catch (e: any) {
      addLog('Backend validation: 422 errors received')
      if (!isEmpty(model.errors)) {
        setErrors({ ...model.errors })
        addLog(`Errors: ${JSON.stringify(model.errors)}`)
      }
    }
    setSaving(false)
  }

  const handleReset = () => {
    const m = new ValidatedModel()
    model.assign(m.toJSON())
    setErrors({})
  }

  return (
    <fieldset style={{ marginBottom: 20, padding: 15, border: '2px solid #f44336', borderRadius: 8 }}>
      <legend style={{ fontWeight: 700, color: '#f44336', fontSize: 16 }}>2. Backend Validation (422 errors)</legend>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#666' }}>
        Send empty/invalid data → server returns 422 → model.errors populated
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 12 }}>Name</label>
          <input value={state.name} onChange={e => model.name = e.target.value}
            style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
          {errors.name && <span style={{ color: 'red', fontSize: 11 }}>{formatError(errors.name)}</span>}
        </div>
        <div>
          <label style={{ fontSize: 12 }}>Email</label>
          <input value={state.email} onChange={e => model.email = e.target.value}
            style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
          {errors.email && <span style={{ color: 'red', fontSize: 11 }}>{formatError(errors.email)}</span>}
        </div>
        <div>
          <label style={{ fontSize: 12 }}>Age</label>
          <input value={state.age} onChange={e => model.age = Number(e.target.value)} type="number"
            style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
          {errors.age && <span style={{ color: 'red', fontSize: 11 }}>{formatError(errors.age)}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSend} disabled={saving}
          style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Send (trigger 422)'}
        </button>
        <button onClick={handleReset}
          style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Reset</button>
      </div>
      {!isEmpty(errors) && (
        <div style={{ marginTop: 10, padding: 10, background: '#ffebee', borderRadius: 4, fontSize: 12 }}>
          model.errors: {JSON.stringify(errors)}
        </div>
      )}
    </fieldset>
  )
}

// ============================================
// TEST 3: BULK OPERATIONS
// ============================================

function BulkTest({ addLog }: { addLog: (msg: string) => void }) {
  const collection = useMemo(() => new Users(), [])
  const [, setTick] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [editMode, setEditMode] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await collection.fetch()
    setLoading(false)
    setTick(t => t + 1)
    addLog(`Bulk: fetched ${collection.size()} users`)
  }, [collection, addLog])

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleBulkDelete = async () => {
    if (selected.length === 0) return
    for (const m of collection.models) {
      if (selected.includes(m.id as number)) m.deleting = true
    }
    try {
      await collection.delete()
      addLog(`Bulk delete: ${selected.length} items`)
      setSelected([])
      await fetchAll()
    } catch (e: any) {
      addLog(`Bulk delete error: ${e.message}`)
    }
  }

  const handleBulkSave = async () => {
    const changed = collection.models.filter(m => m.changed())
    if (changed.length === 0) { addLog('Bulk save: nothing changed'); return }
    try {
      await collection.save()
      addLog(`Bulk save: ${changed.length} models`)
      setEditMode(false)
      await fetchAll()
    } catch (e: any) {
      addLog(`Bulk save error: ${e.message}`)
    }
  }

  return (
    <fieldset style={{ marginBottom: 20, padding: 15, border: '2px solid #ff9800', borderRadius: 8 }}>
      <legend style={{ fontWeight: 700, color: '#ff9800', fontSize: 16 }}>3. Bulk Operations</legend>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button onClick={fetchAll} style={{ padding: '8px 16px', background: '#ff9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Fetch Users</button>
        <button onClick={() => setEditMode(!editMode)} style={{ padding: '8px 16px', background: '#9c27b0', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {editMode ? 'Cancel Edit' : 'Edit Mode'}
        </button>
        {editMode && <button onClick={handleBulkSave} style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save All Changed</button>}
        <button onClick={handleBulkDelete} disabled={selected.length === 0} style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Delete Selected ({selected.length})
        </button>
      </div>
      {loading ? <div style={{ color: '#999' }}>Loading...</div> : collection.size() > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fff3e0' }}>
              <th style={{ padding: 6, width: 30 }}></th>
              <th style={{ padding: 6, textAlign: 'left' }}>ID</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Name</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Email</th>
              {editMode && <th style={{ padding: 6, textAlign: 'left' }}>Changed?</th>}
            </tr>
          </thead>
          <tbody>
            {collection.models.map((user: any) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee', background: user.changed() ? '#fff8e1' : 'transparent' }}>
                <td style={{ padding: 6 }}>
                  <input type="checkbox" checked={selected.includes(user.id)} onChange={() => toggleSelect(user.id)} />
                </td>
                <td style={{ padding: 6 }}>{user.id}</td>
                <td style={{ padding: 6 }}>
                  {editMode ? <input value={user.name} onChange={e => { user.name = e.target.value; setTick(t => t + 1) }}
                    style={{ width: '100%', padding: 4, border: '1px solid #ddd', borderRadius: 3, boxSizing: 'border-box' }} /> : user.name}
                </td>
                <td style={{ padding: 6 }}>
                  {editMode ? <input value={user.email} onChange={e => { user.email = e.target.value; setTick(t => t + 1) }}
                    style={{ width: '100%', padding: 4, border: '1px solid #ddd', borderRadius: 3, boxSizing: 'border-box' }} /> : user.email}
                </td>
                {editMode && <td style={{ padding: 6, fontSize: 12 }}>
                  {user.changed() ? <span style={{ color: '#ff9800' }}>{(user.changed() as string[]).join(', ')}</span> : <span style={{ color: '#ccc' }}>—</span>}
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </fieldset>
  )
}

// ============================================
// TEST 4: EVENTS
// ============================================

function EventsTest({ addLog }: { addLog: (msg: string) => void }) {
  const [eventLog, setEventLog] = useState<string[]>([])

  const testChangeEvents = () => {
    const events: string[] = []
    const user = new User({ id: 1, name: 'John', email: 'john@test.com' })
    user.sync()

    user.on('change', (ctx: any) => events.push(`change: ${ctx.attribute} = "${ctx.value}" (was "${ctx.previous}")`))
    user.on('change:name', (ctx: any) => events.push(`change:name: "${ctx.value}"`))
    user.on('sync', () => events.push('sync'))
    user.on('reset', () => events.push('reset'))

    user.name = 'Jane'
    user.email = 'jane@t.com'
    user.sync()
    user.name = 'Bob'
    user.reset()

    setEventLog(events)
    addLog(`Events: ${events.length} events fired`)
  }

  const testSaveEvents = async () => {
    const events: string[] = []
    const user = new User({ name: 'Test', email: 'test@test.com', age: 25, tags: ['test'] })

    user.on('save', () => events.push('save'))
    user.on('save.success', () => events.push('save.success'))
    user.on('save.failure', () => events.push('save.failure'))
    user.on('create', () => events.push('create (new model)'))
    user.on('update', () => events.push('update (existing model)'))

    try {
      await user.save()
    } catch {}

    setEventLog(events)
    addLog(`Save events: ${events.join(' → ')}`)
  }

  return (
    <fieldset style={{ marginBottom: 20, padding: 15, border: '2px solid #4CAF50', borderRadius: 8 }}>
      <legend style={{ fontWeight: 700, color: '#4CAF50', fontSize: 16 }}>4. Events (on/emit)</legend>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button onClick={testChangeEvents} style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Test: change / sync / reset
        </button>
        <button onClick={testSaveEvents} style={{ padding: '8px 16px', background: '#009688', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Test: save / create events
        </button>
      </div>
      {eventLog.length > 0 && (
        <div style={{ background: '#e8f5e9', padding: 10, borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>
          {eventLog.map((entry, i) => <div key={i}>{i + 1}. {entry}</div>)}
        </div>
      )}
    </fieldset>
  )
}

// ============================================
// MAIN
// ============================================

export default function TestsPage() {
  const [log, setLog] = useState<string[]>([])
  const addLog = useCallback((msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)])
  }, [])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: '-apple-system, sans-serif' }}>
      <h1>@risklight/models — Рыгакт Advanced Tests</h1>
      <p style={{ color: '#666' }}>Upload, Backend Validation (422), Bulk Operations, Events</p>

      <UploadTest addLog={addLog} />
      <ValidationTest addLog={addLog} />
      <BulkTest addLog={addLog} />
      <EventsTest addLog={addLog} />

      <details open>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Activity Log</summary>
        <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto', fontFamily: 'monospace', fontSize: 12, marginTop: 8 }}>
          {log.map((entry, i) => <div key={i}>{entry}</div>)}
          {log.length === 0 && <div style={{ color: '#666' }}>No activity yet</div>}
        </div>
      </details>
    </div>
  )
}
