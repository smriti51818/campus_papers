import { useEffect, useState } from 'react'
import { BookOpen, Filter, Download, Eye, Search, User as UserIcon, FileText, Star } from 'lucide-react'
import api from '../utils/api'
import PdfPreview from '../components/PdfPreview'
import { downloadFile } from '../utils/download'

function AiScoreBadge({ score }) {
  if (score === null || score === undefined) return null
  const numScore = Number(score)
  let style, label
  if (numScore >= 80) {
    style = { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
    label = `${numScore}%`
  } else if (numScore >= 50) {
    style = { background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }
    label = `${numScore}%`
  } else {
    style = { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }
    label = `${numScore}%`
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '9999px',
      fontSize: '0.75rem', fontWeight: '700', ...style
    }}>
      <Star className="w-3 h-3" />
      AI {label}
    </span>
  )
}

function PaperCard({ paper, onView, onDownload }) {
  return (
    <div className="card" style={{ padding: '20px', cursor: 'pointer', borderRadius: '12px' }} onClick={() => onView(paper)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {/* Icon */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '10px',
          background: 'var(--color-primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <FileText className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text)', lineHeight: '1.3' }}>
              {paper.subject}
            </h3>
            <AiScoreBadge score={paper.aiScore} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            <span className="badge badge-neutral">{paper.department}</span>
            <span className="badge badge-neutral">{paper.year}</span>
            {paper.semester && <span className="badge badge-neutral">Sem {paper.semester}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                <UserIcon className="w-3.5 h-3.5" />
                {paper.uploadedBy?.name ?? 'Unknown'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                <Download className="w-3.5 h-3.5" />
                {paper.downloads || 0}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
              <button
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8125rem', borderRadius: '8px' }}
                onClick={() => onView(paper)}
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8125rem', borderRadius: '8px' }}
                onClick={() => onDownload(paper)}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Papers() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState({ subject: '', department: '', year: '', sort: 'new' })
  const [loading, setLoading] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q.subject) params.set('subject', q.subject)
    if (q.department) params.set('department', q.department)
    if (q.year) params.set('year', q.year)
    if (q.sort === 'downloads') params.set('sort', 'downloads')
    try {
      const { data } = await api.get('/api/papers?' + params.toString())
      setItems(data)
    } catch (e) {
      console.error('Failed to load papers:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDownload = async (paper) => {
    await downloadFile(paper.fileUrl, `${paper.subject}.pdf`, paper._id)
    load()
  }

  return (
    <div className="section-gap animate-fade-in">
      {/* Hero */}
      <div className="hero-section">
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              Browse Papers
            </h1>
          </div>
          <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Discover past year question papers shared by the student community. Search by subject, department, or year.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</label>
            <input
              className="glass-input"
              placeholder="e.g., Mathematics"
              value={q.subject}
              onChange={e => setQ({ ...q, subject: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</label>
            <input
              className="glass-input"
              placeholder="e.g., Computer Science"
              value={q.department}
              onChange={e => setQ({ ...q, department: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year</label>
            <input
              className="glass-input"
              placeholder="e.g., 2023"
              type="number"
              value={q.year}
              onChange={e => setQ({ ...q, year: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort By</label>
            <select
              className="glass-input"
              value={q.sort}
              onChange={e => setQ({ ...q, sort: e.target.value })}
            >
              <option value="new">Newest First</option>
              <option value="downloads">Most Downloaded</option>
            </select>
          </div>
        </div>
        <button
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.9375rem', borderRadius: '8px' }}
          onClick={load}
          disabled={loading}
        >
          <Search className="w-4 h-4" />
          {loading ? 'Searching...' : 'Search Papers'}
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" />
          <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>Loading papers...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <BookOpen className="empty-state-icon" />
          <p style={{ fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>No papers found</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Try adjusting your search filters or upload the first paper!</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text)' }}>{items.length}</strong> paper{items.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map(i => (
              <PaperCard
                key={i._id}
                paper={i}
                onView={setSelectedPaper}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </div>
      )}

      {selectedPaper && (
        <PdfPreview
          file={selectedPaper.fileUrl}
          title={selectedPaper.subject}
          subtitle={`${selectedPaper.department} • ${selectedPaper.year}`}
          onClose={() => setSelectedPaper(null)}
          paperId={selectedPaper._id}
          onDownload={load}
        />
      )}
    </div>
  )
}
