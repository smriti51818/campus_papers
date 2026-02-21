import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon, FileText, Rocket, CheckCircle, XCircle } from 'lucide-react'
import api from '../utils/api'

export default function Upload() {
  const nav = useNavigate()
  const [form, setForm] = useState({ department: '', subject: '', year: '', semester: '', university: '' })
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('') // 'success' | 'error'
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    setUploading(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('file', file)
    try {
      await api.post('/api/papers/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg('Upload successful! Your paper is pending admin approval.')
      setMsgType('success')
      setTimeout(() => nav('/dashboard'), 2500)
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || 'Upload failed'
      setMsg(errorMessage)
      setMsgType('error')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type === 'application/pdf') setFile(dropped)
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }} className="section-gap animate-fade-in">
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UploadIcon className="w-5 h-5 text-white" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Upload Paper
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginLeft: '52px' }}>
          Share past year question papers with the student community.
        </p>
      </div>

      {/* Form Card */}
      <div className="card" style={{ padding: '32px', borderRadius: '16px' }}>
        {/* Status Message */}
        {msg && (
          <div style={{
            marginBottom: '24px', padding: '14px 16px',
            borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px',
            ...(msgType === 'success'
              ? { background: 'var(--color-success-bg)', border: '1px solid #BBF7D0', color: 'var(--color-success)' }
              : { background: 'var(--color-danger-bg)', border: '1px solid #FECACA', color: 'var(--color-danger)' })
          }}>
            {msgType === 'success'
              ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
              : <XCircle className="w-5 h-5 flex-shrink-0" />}
            <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{msg}</p>
          </div>
        )}

        <form onSubmit={submit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Department */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>
                Department <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                className="glass-input"
                placeholder="e.g., Computer Science"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                required
              />
              <p style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Enter the academic department this paper belongs to</p>
            </div>

            {/* Subject */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>
                Subject <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                className="glass-input"
                placeholder="e.g., Data Structures & Algorithms"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>

            {/* Year + Semester */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>
                  Year <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  className="glass-input"
                  placeholder="e.g., 2024"
                  type="number"
                  min="2000"
                  max="2030"
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>
                  Semester <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <select
                  className="glass-input"
                  value={form.semester}
                  onChange={e => setForm({ ...form, semester: e.target.value })}
                  required
                  style={{ cursor: 'pointer' }}
                >
                  <option value="" disabled>Select semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>Semester {num}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* University */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>
                University <span style={{ color: 'var(--color-text-secondary)', fontWeight: '400' }}>(optional)</span>
              </label>
              <input
                className="glass-input"
                placeholder="e.g., MIT, Stanford, IIT Delhi"
                value={form.university}
                onChange={e => setForm({ ...form, university: e.target.value })}
              />
            </div>

            {/* File Upload */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>
                PDF File <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div
                className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => setFile(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                  required={!file}
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  {file ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '10px',
                        background: 'var(--color-primary-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FileText className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '0.9375rem' }}>{file.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '12px',
                        background: 'var(--color-bg)',
                        border: '1.5px solid var(--color-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <UploadIcon className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>Click to upload</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}> or drag & drop</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>PDF only · Max 15MB</div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={uploading || !file}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: '1rem', borderRadius: '10px', marginTop: '4px' }}
            >
              {uploading ? (
                <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />Uploading...</>
              ) : (
                <><Rocket className="w-5 h-5" />Upload Paper</>
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Your paper will be reviewed by an admin before it goes live.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
