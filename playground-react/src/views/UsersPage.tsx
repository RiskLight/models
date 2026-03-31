import { useState, useMemo, useCallback, useEffect } from 'react'
import { isEmpty } from 'lodash-es'
import { useModelState } from '@risklight/models/react'
import { Users } from '../mc/collections/Users'
import { Positions } from '../mc/collections/Positions'
import { User } from '../mc/models/User'
import { Position } from '../mc/models/Position'
import { Address } from '../mc/models/Address'

// ============ COLLECTION HOOK ============

function useCollection<T extends { fetch: () => Promise<any>; models: any[]; size: () => number }>(collection: T) {
  const [, setTick] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await collection.fetch()
    } catch (e: any) {
      console.error('Fetch error:', e)
    }
    setLoading(false)
    setTick(t => t + 1)
  }, [collection])

  useEffect(() => { refresh() }, [refresh])

  return { loading, refresh, models: collection.models, size: collection.size() }
}

// ============ EDIT FORM ============

function EditForm({ model, positions, onSave, onClose }: {
  model: User
  positions: Position[]
  onSave: () => void
  onClose: () => void
}) {
  const state = useModelState(model)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev])

  const formatError = (err: any) => Array.isArray(err) ? err.join(', ') : String(err || '')

  const handleSave = async () => {
    setSaving(true)
    setErrors({})

    const validationErrors = await model.validate()
    if (!isEmpty(validationErrors)) {
      setErrors(validationErrors)
      setSaving(false)
      addLog(`Validation failed: ${Object.keys(validationErrors).join(', ')}`)
      return
    }

    try {
      await model.save()
      addLog(`Saved "${model.name}"`)
      onSave()
    } catch (e: any) {
      addLog(`Save error: ${e.message}`)
      if (e.getValidationErrors) setErrors(e.getValidationErrors())
    }
    setSaving(false)
  }

  const handleReset = () => {
    model.reset()
    setErrors({})
    addLog('Reset to saved state')
  }

  const setPosition = (posId: number | null) => {
    if (!posId) { model.set('position', null); return }
    const pos = positions.find(p => p.id === posId)
    if (pos) model.set('position', pos.clone())
  }

  const address = state.address as any

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40 }}>
      <div style={{ background: 'white', padding: 25, borderRadius: 8, width: 600, maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>{model.isNew() ? 'Create User' : `Edit User #${state.id}`}</h2>

        {/* Name */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Name *</label>
          <input value={state.name} onChange={e => model.name = e.target.value}
            style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
          {errors.name && <span style={{ color: 'red', fontSize: 12 }}>{formatError(errors.name)}</span>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Email *</label>
          <input value={state.email} onChange={e => model.email = e.target.value} type="email"
            style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
          {errors.email && <span style={{ color: 'red', fontSize: 12 }}>{formatError(errors.email)}</span>}
        </div>

        {/* Age */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Age *</label>
          <input value={state.age} onChange={e => model.age = Number(e.target.value)} type="number"
            style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
          {errors.age && <span style={{ color: 'red', fontSize: 12 }}>{formatError(errors.age)}</span>}
        </div>

        {/* Active */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={state.active} onChange={e => model.active = e.target.checked} />
            <span style={{ fontWeight: 600 }}>Active</span>
          </label>
        </div>

        {/* Position */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Position * (nested model)</label>
          <select value={state.position?.id || ''} onChange={e => setPosition(Number(e.target.value) || null)}
            style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}>
            <option value="">— Select —</option>
            {positions.map(pos => (
              <option key={pos.id} value={pos.id as number}>{pos.title} ({pos.level}) — {pos.department}</option>
            ))}
          </select>
          {errors.position && <span style={{ color: 'red', fontSize: 12 }}>{formatError(errors.position)}</span>}
        </div>

        {/* Address (nested model) */}
        <fieldset style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
          <legend style={{ fontWeight: 600 }}>Address (nested Model)</legend>
          {address ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 12 }}>Street *</label>
                <input value={address.street || ''} onChange={e => { model.address.street = e.target.value }}
                  style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12 }}>City *</label>
                <input value={address.city || ''} onChange={e => { model.address.city = e.target.value }}
                  style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12 }}>ZIP *</label>
                <input value={address.zip || ''} onChange={e => { model.address.zip = e.target.value }}
                  style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12 }}>Country * (2-letter)</label>
                <input value={address.country || ''} onChange={e => { model.address.country = e.target.value }}
                  style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
              </div>
            </div>
          ) : <p style={{ color: '#999' }}>No address</p>}
        </fieldset>

        {/* Tags */}
        <fieldset style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
          <legend style={{ fontWeight: 600 }}>Tags (array)</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {(state.tags || []).map((tag: string, idx: number) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#e3f2fd', borderRadius: 12, fontSize: 13 }}>
                {tag}
                <button onClick={() => { const t = [...model.tags]; t.splice(idx, 1); model.set('tags', t) }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red', fontSize: 14 }}>×</button>
              </span>
            ))}
          </div>
          <input placeholder="Add tag + Enter" onKeyDown={e => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              model.set('tags', [...(model.tags || []), e.currentTarget.value.trim()])
              e.currentTarget.value = ''
            }
          }} style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
        </fieldset>

        {/* Debug */}
        <details style={{ marginBottom: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#666' }}>Debug</summary>
          <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, fontSize: 11, overflow: 'auto', maxHeight: 200 }}>
            {JSON.stringify({ isNew: model.isNew(), identifier: model.identifier(), changed: model.changed() || [], state }, null, 2)}
          </pre>
        </details>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 24px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {saving ? 'Saving...' : model.isNew() ? 'Create' : 'Save'}
          </button>
          {!model.isNew() && (
            <button onClick={handleReset}
              style={{ padding: '10px 24px', background: '#ff9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Reset
            </button>
          )}
          <button onClick={onClose}
            style={{ padding: '10px 24px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>

        {/* Form log */}
        {log.length > 0 && (
          <div style={{ marginTop: 10, background: '#1e1e1e', color: '#d4d4d4', padding: 8, borderRadius: 4, fontFamily: 'monospace', fontSize: 11, maxHeight: 100, overflow: 'auto' }}>
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ MAIN PAGE ============

export default function UsersPage() {
  const users = useMemo(() => new Users(), [])
  const positions = useMemo(() => new Positions(), [])

  const { loading, refresh, models, size } = useCollection(users)
  const posData = useCollection(positions)

  const [editModel, setEditModel] = useState<User | null>(null)
  const [log, setLog] = useState<string[]>([])
  const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)])

  const openCreate = () => {
    setEditModel(new User())
    addLog('Opened create form')
  }

  const openEdit = async (user: User) => {
    const model = new User({ id: user.id })
    await model.fetch()
    model.sync()
    setEditModel(model)
    addLog(`Opened edit for "${model.name}" (id: ${model.id})`)
  }

  const cloneUser = (user: User) => {
    const cloned = user.clone()
    cloned.name = cloned.name + ' (clone)'
    cloned.set('id', null)
    setEditModel(cloned)
    addLog(`Cloned "${user.name}"`)
  }

  const deleteUser = async (user: User) => {
    if (!confirm(`Delete "${user.name}"?`)) return
    const model = new User({ id: user.id })
    try {
      await model.delete()
      addLog(`Deleted user id: ${user.id}`)
      refresh()
    } catch (e: any) {
      addLog(`Delete error: ${e.message}`)
    }
  }

  const onSave = () => {
    setEditModel(null)
    refresh()
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: '-apple-system, sans-serif' }}>
      <h1>@risklight/models — Рыгакт Playground</h1>
      <p style={{ color: '#666' }}>Testing: CRUD, reactivity via useSyncExternalStore, nested models, validation</p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
        <button onClick={openCreate} style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          + New User
        </button>
        <button onClick={refresh} style={{ padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              {['ID', 'Name', 'Email', 'Age', 'Position', 'City', 'Tags', 'Active', 'Actions'].map(h => (
                <th key={h} style={{ padding: 10, textAlign: 'left', borderBottom: '2px solid #ddd' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((user: any) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{user.id}</td>
                <td style={{ padding: 8, fontWeight: 500 }}>{user.name}</td>
                <td style={{ padding: 8 }}>{user.email}</td>
                <td style={{ padding: 8 }}>{user.age}</td>
                <td style={{ padding: 8 }}>{user.position?.title ? `${user.position.title} (${user.position.level})` : '—'}</td>
                <td style={{ padding: 8 }}>{user.address?.city || '—'}</td>
                <td style={{ padding: 8 }}>
                  {(user.tags || []).map((tag: string) => (
                    <span key={tag} style={{ display: 'inline-block', padding: '2px 8px', margin: 2, background: '#e3f2fd', borderRadius: 12, fontSize: 12 }}>{tag}</span>
                  ))}
                </td>
                <td style={{ padding: 8 }}>
                  <span style={{ color: user.active ? 'green' : 'red' }}>{user.active ? '✓' : '✗'}</span>
                </td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => openEdit(user)} style={{ marginRight: 4, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => cloneUser(user)} style={{ marginRight: 4, cursor: 'pointer' }}>Clone</button>
                  <button onClick={() => deleteUser(user)} style={{ color: 'red', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ color: '#666' }}>{size} users | {posData.size} positions</p>

      {/* Edit Form */}
      {editModel && (
        <EditForm model={editModel} positions={posData.models} onSave={onSave} onClose={() => setEditModel(null)} />
      )}

      {/* Log */}
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
