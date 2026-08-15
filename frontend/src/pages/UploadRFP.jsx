import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function UploadRFP() {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, extracting, analyzing, preview
    const [error, setError] = useState('');
    const [extractedItems, setExtractedItems] = useState([]);
    const [analysisPayload, setAnalysisPayload] = useState(null);

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            setError('');
            setStatus('idle'); // Reset if dropping a new file
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError('');
            setStatus('idle');
        }
    };

    const handleProcess = async () => {
        if (!file) {
            setError('Please upload a file first.');
            return;
        }

        try {
            setError('');

            // 1. Upload & Extract Text
            setStatus('extracting');
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await api.post('/api/v1/rfp/upload-rfp', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const extractedText = uploadRes.data.extracted_text;

            // 2. Analyze with AI
            setStatus('analyzing');
            const analyzeRes = await api.post('/api/v1/rfp/analyze', {
                rfp_text: extractedText
            });

            // 3. Move to Preview State instead of auto-redirecting
            setExtractedItems(analyzeRes.data.parsed_items || []);
            setAnalysisPayload(analyzeRes.data);
            setStatus('preview');

        } catch (err) {
            console.error(err);
            setStatus('idle');
            setError(err.response?.data?.detail || 'An error occurred during processing.');
        }
    };

    const handleContinueToReview = () => {
        const rfpTitle = file.name.replace(/\.[^/.]+$/, "");
        // Persist to sessionStorage so /review survives a page refresh
        sessionStorage.setItem('rfp_analysisData', JSON.stringify(analysisPayload));
        sessionStorage.setItem('rfp_rfpTitle', rfpTitle);
        navigate('/review', {
            state: {
                analysisData: analysisPayload,
                rfpTitle
            }
        });
    };


    return (
        <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: '100vh', background: '#080c1a', color: '#fff', padding: 24, position: 'relative', overflow: 'hidden' }}>
            <style>{`
                @keyframes pulse-glow { 0%,100% { opacity:0.35; } 50% { opacity:0.65; } }
                @keyframes fadeInUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
                @keyframes spin { 100% { transform:rotate(360deg); } }
                
                .upload-zone {
                    border: 2px dashed rgba(255,255,255,0.2);
                    border-radius: 20px;
                    padding: 60px 40px;
                    text-align: center;
                    background: rgba(255,255,255,0.02);
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                .upload-zone.dragging {
                    border-color: #6366f1;
                    background: rgba(99,102,241,0.1);
                    transform: scale(1.02);
                }
                .upload-zone:hover {
                    border-color: rgba(99,102,241,0.5);
                    background: rgba(255,255,255,0.04);
                }
                .btn-primary {
                    width: 100%; padding: 16px; background: linear-gradient(135deg,#6366f1,#8b5cf6); 
                    border: none; border-radius: 12px; color: #fff; font-size: 16px; font-weight: 700; 
                    cursor: pointer; transition: all 0.3s; margin-top: 24px;
                }
                .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(99,102,241,0.45); }
                
                /* FIXED: Default disabled state is not-allowed. Only wait when actively processing */
                .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
                .btn-primary.is-processing:disabled { cursor: wait; }
                
                .loader-circle {
                    width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3);
                    border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite;
                    display: inline-block; vertical-align: middle; margin-right: 10px;
                }
                
                .preview-card {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 16px;
                    padding: 20px;
                    margin-top: 24px;
                    backdrop-filter: blur(12px);
                    animation: fadeInUp 0.5s ease both;
                }
                .preview-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .preview-item:last-child { border-bottom: none; }
            `}</style>

            {/* Background orbs */}
            <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', filter: 'blur(90px)', top: '-200px', right: '-100px', animation: 'pulse-glow 4s ease-in-out infinite', pointerEvents: 'none' }} />

            <div style={{ maxWidth: 700, margin: '80px auto 0', animation: 'fadeInUp 0.6s ease both', position: 'relative', zIndex: 10 }}>


                <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: '-1px' }}>Analyze RFP Document</h1>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 40 }}>
                    Upload your client's Request for Proposal (PDF or Image). Our AI will extract the line items and calculate optimal pricing.
                </p>

                {error && (
                    <div style={{ padding: '14px 20px', borderRadius: 12, marginBottom: 24, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 14 }}>
                        {error}
                    </div>
                )}

                {/* Dropzone (Hides when preview is active) */}
                {status !== 'preview' && (
                    <>
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept=".pdf,image/png,image/jpeg,image/jpg"
                            />

                            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                                {file ? file.name : "Click or drag RFP file here"}
                            </h3>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Supports PDF, PNG, JPG (Max 10MB)"}
                            </p>
                        </div>

                        <button
                            onClick={handleProcess}
                            disabled={!file || status === 'extracting' || status === 'analyzing'}
                            className={`btn-primary ${status !== 'idle' ? 'is-processing' : ''}`}
                        >
                            {status === 'idle' && "Analyze RFP with AI ✨"}
                            {status === 'extracting' && <><span className="loader-circle"></span> Extracting Text (OCR)...</>}
                            {status === 'analyzing' && <><span className="loader-circle"></span> LangGraph AI Parsing & Pricing...</>}
                        </button>
                    </>
                )}

                {/* Preview Section */}
                {status === 'preview' && (
                    <div className="preview-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 700 }}>Extraction Successful ✅</h3>
                            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 20 }}>
                                {extractedItems.length} Items Found
                            </span>
                        </div>

                        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: 20, paddingRight: '10px' }}>
                            {extractedItems.map((item, index) => (
                                <div key={index} className="preview-item">
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15 }}>{item.item_name}</div>
                                        <div style={{ fontSize: 12, color: '#a5b4fc', marginTop: 4 }}>ID: {item.item_id}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>QTY</div>
                                        <div style={{ fontWeight: 700, fontSize: 16 }}>{item.quantity}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => {
                                    setStatus('idle');
                                    setFile(null);
                                }}
                                style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', cursor: 'pointer', flex: 1, fontWeight: 600 }}
                            >
                                Upload Different File
                            </button>
                            <button
                                onClick={handleContinueToReview}
                                className="btn-primary"
                                style={{ flex: 2, marginTop: 0 }}
                            >
                                Review Pricing Strategy →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}