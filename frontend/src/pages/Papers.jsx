import { useEffect, useState, useCallback } from 'react'
import { BookOpen, Filter, Download, Eye, Search, User as UserIcon, FileText, Star, X, ChevronDown, LayoutGrid, List } from 'lucide-react'
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

function PaperCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', gap: '16px' }}>
        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0 }}></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: '18px', width: '60%', marginBottom: '10px' }}></div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <div className="skeleton" style={{ height: '24px', width: '100px', borderRadius: '9999px' }}></div>
            <div className="skeleton" style={{ height: '24px', width: '60px', borderRadius: '9999px' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton" style={{ height: '14px', width: '30%' }}></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="skeleton" style={{ height: '32px', width: '80px', borderRadius: '8px' }}></div>
              <div className="skeleton" style={{ height: '32px', width: '80px', borderRadius: '8px' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaperCard({ paper, onView, onDownload }) {
  return (
    <div className="card-interactive" style={{ padding: '20px', borderRadius: '12px', background: 'var(--color-surface)' }} onClick={() => onView(paper)}>
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
            <AiScoreBadge score={paper.aiResult?.authenticityScore} />
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
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8125rem', height: '32px' }}
                onClick={() => onView(paper)}
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </button>
              <button
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8125rem', height: '32px' }}
                onClick={() => onDownload(paper)}
              >
                <Download className="w-3.5 h-3.5" />
                Get
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
  const [filterOpen, setFilterOpen] = useState(true)

  const load = async (queryObj = q) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (queryObj.subject) params.set('subject', queryObj.subject)
    if (queryObj.department) params.set('department', queryObj.department)
    if (queryObj.year) params.set('year', queryObj.year)
    if (queryObj.sort === 'downloads') params.set('sort', 'downloads')

    try {
      const { data } = await api.get('/api/papers?' + params.toString())
      setItems(data)
    } catch (e) {
      console.error('Failed to load papers:', e)
    } finally {
      setLoading(false)
    }
  }

  // Debounced load
  useEffect(() => {
    const timeout = setTimeout(() => {
      load()
    }, 300)
    return () => clearTimeout(timeout)
  }, [q.subject, q.department, q.year, q.sort])

  const handleDownload = async (paper) => {
    await downloadFile(paper.fileUrl, `${paper.subject}.pdf`, paper._id)
    load()
  }

  const clearFilters = () => {
    setQ({ subject: '', department: '', year: '', sort: 'new' })
  }

  const hasActiveFilters = q.subject || q.department || q.year || q.sort !== 'new'

  return (
    <div className="section-gap animate-fade-in">
      {/* Hero Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              Browse Papers
            </h1>
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
            Find previous year question papers by subject or department. High authenticity guaranteed by our AI scoring system.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: filterOpen ? '280px 1fr' : '1fr', gap: '32px', alignItems: 'start' }}>

        {/* Sidebar Filters */}
        {filterOpen && (
          <aside className="animate-fade-in" style={{ position: 'sticky', top: '100px' }}>
            <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '0.875rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>Filters</h2>
                {hasActiveFilters && (
                  <button onClick={clearFilters} style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Subject</label>
                  <div style={{ position: 'relative' }}>
                    <Search className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      className="glass-input"
                      placeholder="e.g. Mathematics"
                      value={q.subject}
                      style={{ paddingLeft: '38px' }}
                      onChange={e => setQ({ ...q, subject: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Department</label>
                  <input
                    className="glass-input"
                    placeholder="e.g. Computer Science"
                    value={q.department}
                    onChange={e => setQ({ ...q, department: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Year</label>
                    <input
                      className="glass-input"
                      type="number"
                      placeholder="2023"
                      value={q.year}
                      onChange={e => setQ({ ...q, year: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Sort</label>
                    <select
                      className="glass-input"
                      value={q.sort}
                      onChange={e => setQ({ ...q, sort: e.target.value })}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="new">Newest</option>
                      <option value="downloads">Popular</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '8px', padding: '16px', background: 'var(--color-bg)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter className="w-3.5 h-3.5" />
                    Filters are applied instantly
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Results Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="btn-secondary"
                style={{ padding: '8px 14px', height: '38px' }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter className="w-4 h-4" />
                {filterOpen ? 'Hide Filters' : 'Show Filters'}
              </button>
              {!loading && (
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                  Showing <strong style={{ color: 'var(--color-text)' }}>{items.length}</strong> results
                </span>
              )}
            </div>

            <div style={{ display: 'flex', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '2px' }}>
              <button className="btn-secondary" style={{ padding: '6px', border: 'none', background: 'var(--color-bg)', color: 'var(--color-primary)' }}><LayoutGrid className="w-4 h-4" /></button>
              <button className="btn-secondary" style={{ padding: '6px', border: 'none', background: 'transparent' }}><List className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Grid / List */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => <PaperCardSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="card empty-state" style={{ padding: '80px 40px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: 'var(--color-bg)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
              }}>
                <Search className="w-8 h-8" style={{ color: '#CBD5E1' }} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>No matches found</h3>
              <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', maxWidth: '320px', marginBottom: '24px' }}>
                We couldn't find any papers matching your current filters. Try broadening your search or resetting all filters.
              </p>
              <button className="btn-outline" onClick={clearFilters}>Reset All Filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {items.map(i => (
                <PaperCard
                  key={i._id}
                  paper={i}
                  onView={setSelectedPaper}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPaper && (
        <PdfPreview
          file={selectedPaper.fileUrl}
          title={selectedPaper.subject}
          subtitle={`${selectedPaper.department} • ${selectedPaper.year}`}
          onClose={() => setSelectedPaper(null)}
          paperId={selectedPaper._id}
          onDownload={() => load()}
        />
      )}
    </div>
  )
}
