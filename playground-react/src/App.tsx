import { useState } from 'react'
import UsersPage from './views/UsersPage'
import TestsPage from './views/TestsPage'

export default function App() {
  const [tab, setTab] = useState<'users' | 'tests'>('users')

  return (
    <>
      <div style={{ background: '#333', padding: '8px 20px', display: 'flex', gap: 10 }}>
        <button onClick={() => setTab('users')}
          style={{ padding: '6px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', background: tab === 'users' ? '#2196F3' : '#555', color: 'white' }}>
          Users (CRUD)
        </button>
        <button onClick={() => setTab('tests')}
          style={{ padding: '6px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', background: tab === 'tests' ? '#2196F3' : '#555', color: 'white' }}>
          Advanced Tests
        </button>
      </div>

      {tab === 'users' && <UsersPage />}
      {tab === 'tests' && <TestsPage />}
    </>
  )
}
