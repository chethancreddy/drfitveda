'use client'
// ============================================================
// DocumentUploadForm — Client component to upload/record medical documents
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DOC_TYPES = [
  { value: 'blood_test',   label: '🩸 Blood Test / Lab Report' },
  { value: 'prescription', label: '💊 Doctor Prescription' },
  { value: 'radiology',    label: '🩻 X-Ray / Scan / Ultrasound' },
  { value: 'diet_chart',   label: '🥗 Past Diet Chart' },
  { value: 'other',        label: '📄 Other Health Document' },
]

export default function DocumentUploadForm() {
  const router = useRouter()
  const [docType, setDocType] = useState('blood_test')
  const [fileName, setFileName] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!fileName.trim()) {
        throw new Error('Please specify or select a document.')
      }

      const res = await fetch('/api/customers/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type: docType,
          file_name: fileName.trim(),
          file_size: 1024 * (Math.floor(Math.random() * 800) + 200), // simulated file size (bytes)
          notes: notes.trim(),
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setSuccess(true)
      setFileName('')
      setNotes('')
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{padding:'var(--space-md)'}}>
      <h3 className="text-label-lg" style={{marginBottom:12}}>Upload Medical Document</h3>

      {error && <div className="alert alert-error" style={{marginBottom:'var(--space-sm)'}}>{error}</div>}
      {success && <div className="alert alert-success" style={{marginBottom:'var(--space-sm)'}}>Document uploaded successfully! Doctor notified.</div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'var(--space-sm)',marginBottom:'var(--space-sm)'}}>
        <div>
          <label className="text-label-md" style={{display:'block',marginBottom:4}}>Document Type</label>
          <select className="input" value={docType} onChange={e => setDocType(e.target.value)}>
            {DOC_TYPES.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-label-md" style={{display:'block',marginBottom:4}}>Document File / Title</label>
          <input
            type="file"
            className="input"
            onChange={handleFileChange}
            style={{padding:'5px 8px'}}
          />
        </div>
      </div>

      <div style={{marginBottom:'var(--space-sm)'}}>
        <label className="text-label-md" style={{display:'block',marginBottom:4}}>File Name / Description</label>
        <input
          type="text"
          className="input"
          placeholder="e.g. Lipid Profile Report - Sep 2026.pdf"
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          required
        />
      </div>

      <div style={{marginBottom:'var(--space-md)'}}>
        <label className="text-label-md" style={{display:'block',marginBottom:4}}>Notes for Doctor (optional)</label>
        <textarea
          className="input"
          rows={2}
          placeholder="Any specific symptoms or lab values you'd like your doctor to focus on..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
    </form>
  )
}
