import { type FormEvent, useState } from 'react'

import { useHiveStore } from '../state/useHiveStore'

export function CaptureButton() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const createCapture = useHiveStore((state) => state.createCapture)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!value.trim()) return
    await createCapture({ raw_text: value.trim(), source: 'text' })
    setValue('')
    setOpen(false)
  }

  return (
    <>
      <button className="primary-btn" onClick={() => setOpen(true)}>
        Capture
      </button>

      {open ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 16, 24, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 20,
          }}
          onClick={() => setOpen(false)}
        >
          <form
            className="card"
            style={{ width: '90%', maxWidth: '480px', background: '#1e2132', color: '#fff' }}
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Quick capture</h2>
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="What's on deck?"
              style={{
                width: '100%',
                minHeight: '120px',
                borderRadius: '12px',
                padding: '1rem',
                fontFamily: 'inherit',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                marginBottom: '1rem',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="ghost-btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Save to Command Center
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
