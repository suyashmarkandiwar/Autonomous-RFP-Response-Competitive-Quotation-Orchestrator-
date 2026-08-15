import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toasts }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold
                        border backdrop-blur-md animate-[slideUp_0.25s_ease_both] pointer-events-auto
                        ${t.type === 'success'
                            ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100'
                            : 'bg-red-900/90 border-red-500/50 text-red-100'}`}
                >
                    {t.type === 'success' ? (
                        <svg className="w-5 h-5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PreviewPDF() {
    const { quoteId } = useParams();
    const navigate = useNavigate();
    const iframeRef = useRef(null);

    const [htmlContent, setHtmlContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [toasts, setToasts] = useState([]);

    // Add a toast that auto-dismisses after 3.5 s
    const pushToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                const response = await api.get(`/api/v1/rfp/preview-html/${quoteId}`);
                let rawHtml = response.data.html_content;

                if (rawHtml) {
                    rawHtml = rawHtml.replace(
                        /<body([^>]*)>/i,
                        '<body$1 contenteditable="true" style="outline:none; padding:20px; font-family:sans-serif; background:white;">'
                    );
                    setHtmlContent(rawHtml);
                } else {
                    setError('HTML content not found. Ensure the quote was generated correctly.');
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load editable preview.');
                setLoading(false);
            }
        };

        fetchPreview();
    }, [quoteId]);

    const handleSaveEdits = async () => {
        if (!iframeRef.current) return;
        setIsSaving(true);
        try {
            const currentHtml = iframeRef.current.contentDocument.documentElement.outerHTML;
            const cleanHtml = currentHtml.replace('contenteditable="true"', '');

            await api.post(`/api/v1/rfp/regenerate-pdf/${quoteId}`, {
                html_content: cleanHtml
            });

            pushToast('Edits saved — PDF regenerated successfully.', 'success');
        } catch (err) {
            console.error(err);
            pushToast('Failed to save edits. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await api.get(`/api/v1/rfp/download-pdf/${quoteId}`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `Quotation_${quoteId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            pushToast('PDF downloaded successfully.', 'success');
        } catch (err) {
            console.error('Download failed', err);
            pushToast('Download failed. Ensure the PDF exists on the server.', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[#080c1a] flex flex-col font-sans">

            {/* Slide-up keyframe injected inline */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Toast Notifications */}
            <Toast toasts={toasts} />

            {/* Header Toolbar */}
            <div className="bg-[#111827] border-b border-[#374151] px-8 py-4 flex items-center justify-between shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Quotation Document</h1>
                    <p className="text-xs text-indigo-400 font-mono bg-indigo-500/10 inline-block px-2 py-0.5 rounded">ID: {quoteId}</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Fix 4: corrected label — navigates back to /upload (New Quotation) */}
                    <button
                        onClick={() => navigate('/upload')}
                        className="text-slate-400 hover:text-white px-4 py-2 font-medium transition text-sm"
                    >
                        ← New Quotation
                    </button>

                    <button
                        onClick={handleSaveEdits}
                        disabled={!htmlContent || isSaving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-900/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        )}
                        {isSaving ? 'Saving...' : 'Save Edits'}
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={!htmlContent || isSaving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-emerald-900/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                    </button>
                </div>
            </div>

            {/* PDF Viewer Canvas */}
            <div className="flex-1 p-8 flex items-start justify-center overflow-y-auto">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full mt-20">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-indigo-300 font-medium tracking-wide animate-pulse">Loading Document...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/30 border border-red-500 text-red-300 px-6 py-4 rounded-xl shadow-lg mt-20">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="font-bold">Error</span>
                        </div>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {htmlContent && !loading && !error && (
                    <div className="w-full max-w-5xl h-[85vh] bg-[#1f2937] rounded-2xl shadow-2xl overflow-hidden border border-[#374151] flex flex-col relative">
                        <div className="absolute top-0 left-0 w-full bg-indigo-600/20 border-b border-indigo-500/30 px-4 py-2 flex items-center justify-center">
                            <p className="text-xs font-semibold text-indigo-300">✏️ LIVE EDITOR MODE — Click anywhere on the document below to edit text.</p>
                        </div>
                        <iframe
                            ref={iframeRef}
                            srcDoc={htmlContent}
                            title="Editable HTML Preview"
                            className="w-full flex-1 bg-white mt-8"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
