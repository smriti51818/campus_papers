import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileText } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import { downloadFile } from '../utils/download'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const CTRL_BTN = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '8px',
    fontWeight: '600', fontSize: '0.8125rem', cursor: 'pointer', border: 'none',
    background: 'rgba(255,255,255,0.1)', color: 'white',
    transition: 'background 0.15s ease'
}

export default function PdfPreview({ file, title, subtitle, onClose, paperId, onDownload }) {
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [scale, setScale] = useState(1.2)

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages)
    }

    const handleDownload = async () => {
        await downloadFile(file, `${title}.pdf`, paperId)
        if (onDownload) onDownload()
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)'
            }}
            className="animate-fade-in"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                background: '#0F172A',
                borderRadius: '16px',
                width: '100%', maxWidth: '900px', maxHeight: '92vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            background: 'var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{ fontWeight: '700', color: 'white', fontSize: '1rem', truncate: true, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {title}
                            </h2>
                            {subtitle && <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{subtitle}</p>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '34px', height: '34px', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            transition: 'background 0.15s ease', flexShrink: 0, marginLeft: '12px'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* PDF Viewer */}
                <div style={{
                    flex: 1, overflow: 'auto', padding: '24px',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    background: '#0A1020'
                }}>
                    <Document
                        file={file}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '64px 0' }}>
                                <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'white' }} />
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Loading PDF...</p>
                            </div>
                        }
                        error={
                            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                                <p style={{ color: '#FC8181', fontWeight: '600' }}>Failed to load PDF</p>
                            </div>
                        }
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                        />
                    </Document>
                </div>

                {/* Controls */}
                <div style={{
                    padding: '14px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    background: '#0F172A'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                                disabled={pageNumber <= 1}
                                style={{ ...CTRL_BTN, opacity: pageNumber <= 1 ? 0.35 : 1, cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer' }}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Prev
                            </button>
                            <span style={{
                                padding: '7px 14px', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', fontWeight: '600'
                            }}>
                                {pageNumber} / {numPages || '?'}
                            </span>
                            <button
                                onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                                disabled={pageNumber >= numPages}
                                style={{ ...CTRL_BTN, opacity: pageNumber >= numPages ? 0.35 : 1, cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer' }}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Zoom */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                onClick={() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))}
                                style={CTRL_BTN}
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span style={{
                                padding: '7px 12px', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', fontWeight: '600', minWidth: '52px', textAlign: 'center'
                            }}>
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                onClick={() => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)))}
                                style={CTRL_BTN}
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Download */}
                        <button
                            onClick={handleDownload}
                            className="btn-primary"
                            style={{ borderRadius: '8px' }}
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
