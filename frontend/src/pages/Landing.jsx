import { useNavigate } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#080c1a', minHeight: '100vh', color: '#fff', overflow: 'hidden', cursor: 'none' }}>
            <CustomCursor />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

                *, *::before, *::after { cursor: none !important; }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-18px); }
                }
                @keyframes floatSlow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-24px) rotate(3deg); }
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.75; transform: scale(1.08); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes flow-line {
                    0% { stroke-dashoffset: 300; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes badge-pop {
                    0% { opacity: 0; transform: scale(0.7); }
                    70% { transform: scale(1.05); }
                    100% { opacity: 1; transform: scale(1); }
                }

                .gradient-text {
                    background: linear-gradient(135deg, #818cf8, #a78bfa, #06b6d4);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .shimmer-text {
                    background: linear-gradient(90deg, #818cf8 0%, #e0e7ff 40%, #06b6d4 60%, #818cf8 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 3s linear infinite;
                }
                .card-glass {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    backdrop-filter: blur(12px);
                    transition: all 0.3s ease;
                }
                .card-glass:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(129,140,248,0.35);
                    transform: translateY(-4px);
                    box-shadow: 0 20px 60px rgba(99,102,241,0.18);
                }
                .btn-primary {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border: none;
                    color: black;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                .btn-primary::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, #818cf8, #a78bfa);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .btn-primary:hover::after {color: black; }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(99,102,241,0.45); }
                .btn-ghost {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.2);
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .btn-ghost:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(255,255,255,0.4);
                }
                .step-connector {
                    flex: 1;
                    height: 1px;
                    background: linear-gradient(90deg, rgba(99,102,241,0.5), rgba(6,182,212,0.3));
                    position: relative;
                    top: -20px;
                }
                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    animation: pulse-glow 4s ease-in-out infinite;
                    pointer-events: none;
                }
            `}</style>

            {/* Background Orbs */}
            <div className="orb" style={{ width: 500, height: 500, background: 'rgba(99,102,241,0.18)', top: '-100px', left: '-150px', animationDelay: '0s' }} />
            <div className="orb" style={{ width: 400, height: 400, background: 'rgba(139,92,246,0.15)', top: '30%', right: '-100px', animationDelay: '1.5s' }} />
            <div className="orb" style={{ width: 300, height: 300, background: 'rgba(6,182,212,0.12)', bottom: '10%', left: '30%', animationDelay: '3s' }} />

            {/* ── Navbar ── */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 60px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,12,26,0.85)', backdropFilter: 'blur(16px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
                    <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>QuotePulse <span className="gradient-text">AI</span></span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button className="btn-ghost" onClick={() => navigate('/login')} style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
                        Log In
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/signup')} style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 1 }}>
                        Get Started →
                    </button>
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <section style={{ maxWidth: 1200, margin: '120px auto', padding: '50px 40px 60px', textAlign: 'center', animation: 'fadeInUp 0.8s ease both' }}>

                <h1 style={{ fontSize: 'clamp(48px, 7vw, 82px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 28 }}>
                    Win More Deals with<br />
                    <span className="shimmer-text">AI-Powered Quotations</span>
                </h1>

                <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.7, fontWeight: 400 }}>
                    Upload any RFP and let three specialized AI agents parse it, research competitor pricing, and generate a polished commercial quotation — in minutes.
                </p>
            </section>


            {/* ── Feature Cards ── */}
            <section style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 40px' }}>
                <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 16, letterSpacing: '-1px' }}>
                    Everything your sales team needs
                </h2>
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', marginBottom: 56, fontSize: 16 }}>Built on a multi-agent LangGraph architecture with MongoDB intelligence</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                    {[
                        { icon: '🔍', title: 'Competitor Intelligence', desc: 'Real-time competitor price lookup from your MongoDB competitors collection. Min, max, avg — all computed per item.', tag: 'Powered by MongoDB' },
                        { icon: '🤖', title: 'Three Specialized Agents', desc: 'Parser → Pricing → Drafter. Each agent has a single responsibility, keeping the pipeline clean and auditable.', tag: 'LangGraph + Groq' },
                        { icon: '⚖️', title: '5 Pricing Strategies', desc: 'Undercut, Match Market, Value-Bundle, Margin-Maximizer, Market-Penetration — switchable per line item in real time.', tag: 'AI Recalculation' },
                        { icon: '📑', title: 'PDF Quotation Output', desc: 'Professional branded PDF generated via xhtml2pdf with executive summary written by the Drafter Agent.', tag: 'Instant Download' },
                        { icon: '🔐', title: 'Secure JWT Auth', desc: 'OAuth2-compliant authentication with token blacklisting and automatic MongoDB TTL cleanup.', tag: 'Production Ready' },
                        { icon: '✏️', title: 'Human-in-the-Loop', desc: 'Review the full pricing matrix, override any price, and only generate the PDF once you approve every line.', tag: 'Your Control' },
                    ].map((f, i) => (
                        <div key={i} className="card-glass" style={{ cursor: 'pointer', borderRadius: 20, padding: '32px 28px', animation: `fadeInUp 0.6s ${i * 0.1}s ease both`, opacity: 0, animationFillMode: 'forwards' }}>
                            <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                            <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', borderRadius: 6, padding: '3px 10px', marginBottom: 14, letterSpacing: 0.5 }}>{f.tag}</div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>


            {/* ── FOOTER ── */}
            <footer id="contact" style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)', padding: '56px 60px 28px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>

                    {/* ── Top grid: Brand + Contact ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 48, marginBottom: 48 }}>

                        {/* Brand col */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>⚡</div>
                                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                                    QuotePulse <span style={{ background: 'linear-gradient(135deg,#818cf8,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
                                </span>
                            </div>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 280 }}>
                                Autonomous B2B SaaS RFP Quotation Engine. Real-time Competitor Market Intelligence &amp; HITL Approval System.
                            </p>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#34d399' }}>
                                <span>🛡️</span>
                                <span>SOC-2 Compliant · End-to-End Encrypted</span>
                            </div>
                        </div>

                        {/* Contact col */}
                        <div>
                            <h4 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Contact Us</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[
                                    { icon: '✉️', color: '#818cf8', label: 'Email', value: 'support@quotepulse.ai', href: 'mailto:support@quotepulse.ai' },
                                    { icon: '📞', color: '#34d399', label: 'Phone', value: '+91 12345 67890', href: 'tel:+911234567890' },
                                    { icon: '📍', color: '#60a5fa', label: 'Office', value: 'Pune, Maharashtra, India 🇮🇳', href: null },
                                    { icon: '🌐', color: '#fbbf24', label: 'Website', value: 'quotepulse.ai', href: 'https://quotepulse.ai' },
                                ].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <span style={{ fontSize: 15, marginTop: 1 }}>{item.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{item.label}</div>
                                            {item.href ? (
                                                <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                                                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
                                                    onMouseEnter={e => e.target.style.color = item.color}
                                                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>
                                                    {item.value}
                                                </a>
                                            ) : (
                                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.value}</span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* ── Bottom bar ── */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© 2026 QuotePulse AI · All rights reserved.</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Autonomous RFP Quotation Engine · Real-time Market Intelligence</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981', animation: 'pulse-glow 2s ease-in-out infinite' }} />
                            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>All systems operational</span>
                        </div>
                    </div>

                </div>
            </footer>
        </div>
    );

}