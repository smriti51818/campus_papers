import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon, FileText, Rocket, CheckCircle, XCircle, ChevronRight, ChevronLeft, Eye } from 'lucide-react'
import api from '../utils/api'

const STEPS = [
  { num: 1, label: 'Upload PDF' },
  { num: 2, label: 'Details' },
  { num: 3, label: 'Review' },
]

function StepIndicator({ current }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div className="step-indicator">
        {STEPS.map((step, idx) => {
          const done = current > step.num
          const active = current === step.num
          return (
            <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div className={`step-dot ${done ? 'step-dot--done' : active ? 'step-dot--active' : 'step-dot--inactive'}`}>
                  {done ? <CheckCircle className="w-4 h-4" /> : step.num}
                </div>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: '600',
                  color: active ? 'var(--color-primary)' : done ? 'var(--color-success)' : 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap'
                }}>
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`step-connector ${done ? 'step-connector--done' : 'step-connector--inactive'}`}
                  style={{ marginBottom: '20px' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Toast({ msg, type, onDismiss }) {
  return (
    <div className={`toast toast--${type}`}>
      {type === 'success'
        ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
        : <XCircle className="w-5 h-5 flex-shrink-0" />}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{msg}</p>
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, padding: '0 2px' }}>
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function Upload() {
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ department: '', subject: '', year: '', semester: '', university: '' })
  const [file, setFile] = useState(null)
  const [toast, setToast] = useState(null) // { msg, type }
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    if (type === 'success') setTimeout(() => nav('/dashboard'), 2500)
    else setTimeout(() => setToast(null), 4000)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type === 'application/pdf') setFile(dropped)
  }

  const canNext = () => {
    if (step === 1) return !!file
    if (step === 2) return form.department && form.subject && form.year && form.semester
    return true
  }

  const submit = async () => {
    setUploading(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('file', file)
    try {
      await api.post('/api/papers/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      showToast('Upload successful! Your paper is pending admin approval.', 'success')
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || 'Upload failed. Please try again.'
      showToast(errorMessage, 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }} className="section-gap animate-fade-in">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}

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

      {/* Wizard Card */}
      <div className="card" style={{ padding: '32px', borderRadius: '16px' }}>
        <StepIndicator current={step} />

        {/* ── STEP 1: Upload PDF ── */}
        {step === 1 && (
          <div className="step-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-text)', marginBottom: '4px' }}>
                Select your PDF file
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Drag and drop your file, or click to browse.
              </p>
            </div>

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
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '12px',
                      background: 'var(--color-primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FileText className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--color-text)', fontSize: '0.9375rem' }}>{file.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      <span style={{ marginLeft: '8px', color: 'var(--color-primary)' }}>· Click to replace</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '12px',
                      background: 'var(--color-bg)',
                      border: '1.5px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <UploadIcon className="w-7 h-7" style={{ color: 'var(--color-text-secondary)' }} />
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
        )}

        {/* ── STEP 2: Metadata ── */}
        {step === 2 && (
          <div className="step-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-text)', marginBottom: '4px' }}>
                Paper details
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Help others find your paper with accurate metadata.
              </p>
            </div>

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
                autoFocus
              />
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
          </div>
        )}

        {/* ── STEP 3: Review & Submit ── */}
        {step === 3 && (
          <div className="step-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-text)', marginBottom: '4px' }}>
                Review & submit
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Confirm the details before uploading.
              </p>
            </div>

            {/* Review Card */}
            <div style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {/* File row */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'var(--color-primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', color: 'var(--color-text)', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}</div>
                </div>
              </div>

              {/* Metadata rows */}
              {[
                { label: 'Department', value: form.department },
                { label: 'Subject', value: form.subject },
                { label: 'Year', value: form.year },
                { label: 'Semester', value: form.semester ? `Semester ${form.semester}` : '' },
                ...(form.university ? [{ label: 'University', value: form.university }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: '12px 20px',
                  display: 'flex', alignItems: 'center',
                  borderBottom: '1px solid var(--color-border)',
                  gap: '16px'
                }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', minWidth: '90px' }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text)' }}>{value}</span>
                </div>
              ))}
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Your paper will be reviewed by an admin before it goes live.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '28px', paddingTop: '24px',
          borderTop: '1px solid var(--color-border)'
        }}>
          <button
            className="btn-secondary"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 3 ? (
            <button
              className="btn-primary"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              style={{ minWidth: '120px', justifyContent: 'center' }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={submit}
              disabled={uploading}
              style={{ minWidth: '160px', justifyContent: 'center', padding: '12px 20px', fontSize: '1rem' }}
            >
              {uploading ? (
                <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />Uploading...</>
              ) : (
                <><Rocket className="w-5 h-5" />Submit Paper</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
