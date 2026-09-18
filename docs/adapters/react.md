# React

Use the `useModelState` hook for reactive re-renders:

```tsx
import { useMemo } from 'react'
import { useModelState } from '@risklight/models/react'
import { User } from './models/User'

function UserForm() {
  const user = useMemo(() => new User({ name: 'John' }), [])
  const state = useModelState(user)

  return (
    <>
      <input
        value={state.name}
        onChange={e => user.name = e.target.value}
      />
      <p>{state.name}</p>
    </>
  )
}
```

`useModelState` returns a reactive snapshot of model attributes. It re-renders on:
- attribute changes (including nested models)
- `sync`, `reset`, `fetch`, `save.success`, `delete`
