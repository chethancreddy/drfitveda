'use client'
// ============================================================
// VideoGalleryUpload — Client modal to upload workout & progress videos
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { value: 'workout',        label: '🏋️ Workout & Strength Exercise' },
  { value: 'yoga',           label: '🧘 Yoga Asana & Posture' },
  { value: 'form_check',     label: '🔍 Technique / Form Check for Trainer' },
  { value: 'transformation', label: '✨ Transformation / Progress Video' },
]

export default function VideoGalleryUpload({ customerId }: { customerId?: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('workout')
  const [videoUrl, setVideoUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name)
      if (!title) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!title.trim()) throw new Error('Please enter a video title.')

      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          title: title.trim(),
          category,
          video_url: videoUrl.trim() || 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnail_url: category === 'yoga'
            ? 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80'
            : 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80',
          notes: notes.trim(),
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setTitle('')
        setNotes('')
        setFileName('')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="btn btn-primary btn-sm">
        + Upload Video
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-sm)'
    }}>
      <div className="card" style={{maxWidth:520,width:'100%',padding:'var(--space-md)'}}>
        <div className="flex justify-between items-center" style={{marginBottom:'var(--space-sm)'}}>
          <h3 className="text-headline-sm">Upload Video to Gallery</h3>
          <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-sm">✕</button>
        </div>

        {error && <div className="alert alert-error" style={{marginBottom:'var(--space-sm)'}}>{error}</div>}
        {success && <div className="alert alert-success" style={{marginBottom:'var(--space-sm)'}}>Video uploaded to gallery successfully!</div>}

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:'var(--space-sm)'}}>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div style={{marginBottom:'var(--space-sm)'}}>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Video Title</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Week 4 Overhead Squat Form Check"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{marginBottom:'var(--space-sm)'}}>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Select Video File</label>
            <input
              type="file"
              accept="video/*"
              className="input"
              onChange={handleFileChange}
              style={{padding:'6px 8px'}}
            />
            {fileName && <div className="text-caption text-muted" style={{marginTop:4}}>Selected: {fileName}</div>}
          </div>

          <div style={{marginBottom:'var(--space-sm)'}}>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Or Video URL (optional)</label>
            <input
              type="url"
              className="input"
              placeholder="https://... (mp4 or stream link)"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
            />
          </div>

          <div style={{marginBottom:'var(--space-md)'}}>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Notes for Trainer / Doctor</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Any specific questions about pain, balance, or reps..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-xs">
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Save to Gallery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
