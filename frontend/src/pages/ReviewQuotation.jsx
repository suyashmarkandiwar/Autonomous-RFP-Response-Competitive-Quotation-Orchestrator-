import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ReviewQuotation() {
    const location = useLocation();
    const navigate = useNavigate();

    const { analysisData, rfpTitle } = location.state || {};

    const [items, setItems] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [recalculatingId, setRecalculatingId] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [clientName, setClientName] = useState("Acme Corp"); // Needed for the PDF generator
    const [error, setError] = useState('');

    // Merge parsed_items and pricing_analysis on mount
    useEffect(() => {
        if (analysisData?.parsed_items && analysisData?.pricing_analysis) {
            const merged = analysisData.parsed_items.map(parsedItem => {
                const pricingData = analysisData.pricing_analysis.find(p => p.item_id === parsedItem.item_id);
                return { ...parsedItem, ...pricingData };
            });
            setItems(merged);
        }
    }, [analysisData]);

    if (!analysisData) {
        return (
            <div className="min-h-screen bg-[#080c1a] text-white flex flex-col items-center justify-center p-6">
                <h2 className="text-xl font-bold mb-4">No data found. Please upload an RFP first.</h2>
                <button
                    onClick={() => navigate('/upload')}
                    className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const toggleRow = (itemId) => {
        setExpandedRows(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    // Handle Local Price Override typing
    const handlePriceChange = (itemId, newPrice) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.item_id === itemId) {
                const price = parseFloat(newPrice) || 0;
                const cost = item.internal_cost || 0;
                const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
                const profit = (price - cost) * item.quantity;

                return {
                    ...item,
                    human_price_override: price,
                    margin_percentage: margin.toFixed(1),
                    total_profit: profit
                };
            }
            return item;
        }));
    };

    // Trigger Backend Recalculation Agent
    const handleStrategyChange = async (item, newStrategy) => {
        setRecalculatingId(item.item_id);
        setError('');

        try {
            const response = await api.post('/api/v1/rfp/recalculate', {
                item_id: item.item_id,
                item_name: item.item_name,
                new_strategy: newStrategy,
                base_cost: item.internal_cost,
                competitor_price: item.competitor_avg,
                quantity: item.quantity
            });

            const data = response.data;

            // Update the specific item in state with new AI data
            setItems(prevItems => prevItems.map(i => {
                if (i.item_id === item.item_id) {
                    return {
                        ...i,
                        selected_strategy: data.updated_strategy,
                        ai_rationale: data.new_ai_rationale,
                        human_price_override: data.new_human_price_override,
                        margin_percentage: data.margin_percentage,
                        total_profit: data.total_profit
                    };
                }
                return i;
            }));
        } catch (err) {
            console.error(err);
            setError('Failed to recalculate strategy. Please try again.');
        } finally {
            setRecalculatingId(null);
        }
    };

    // Generate Final PDF
    const handleApproveAndGenerate = async () => {
        setIsGenerating(true);
        setError('');

        try {
            const approved_items = items.map(item => ({
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: item.quantity,
                final_price: item.human_price_override
            }));

            const payload = {
                rfp_title: rfpTitle,
                client_name: clientName,
                approved_items: approved_items
            };

            const res = await api.post('/api/v1/rfp/approve-and-generate', payload);

            // Navigate to PDF preview/download phase
            navigate(`/preview/${res.data.quote_id}`);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to generate quotation.');
            setIsGenerating(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="min-h-screen bg-[#080c1a] text-slate-800 p-8 font-sans">

            {/* Top Bar */}
            <div className="max-w-7xl mx-auto flex justify-between items-end mb-6 text-white">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Review Quotation: {rfpTitle}</h1>
                    <div className="flex items-center gap-4">
                        <label className="text-sm text-slate-400">Client Name for PDF:</label>
                        <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white px-3 py-1 rounded outline-none focus:border-indigo-500 text-sm"
                        />
                    </div>
                </div>
                <button
                    onClick={handleApproveAndGenerate}
                    disabled={isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-900/50 disabled:opacity-50"
                >
                    {isGenerating ? 'Generating PDF...' : 'Approve & Generate PDF →'}
                </button>
            </div>

            {error && (
                <div className="max-w-7xl mx-auto mb-4 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">
                    {error}
                </div>
            )}

            {/* Main Table Container */}
            <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl overflow-hidden shadow-2xl">

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-3">Item & Specs</div>
                    <div className="col-span-1 text-center">Qty / Unit</div>
                    <div className="col-span-1 text-right">Internal Cost</div>
                    <div className="col-span-2 text-center">Competitor Sources</div>
                    <div className="col-span-1 text-center">AI Strategy</div>
                    <div className="col-span-2 text-center">Human Price Override</div>
                    <div className="col-span-1 text-right">Margin & Profit</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-200 bg-white">
                    {items.map((item) => (
                        <div key={item.item_id} className="flex flex-col">

                            {/* Main Visible Row */}
                            <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition relative">

                                {/* Loading Overlay for individual row recalculation */}
                                {recalculatingId === item.item_id && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <div className="animate-spin h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                                        <span className="ml-3 font-semibold text-indigo-700">AI Recalculating...</span>
                                    </div>
                                )}

                                {/* Status */}
                                <div className="col-span-1 flex justify-center">
                                    <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                </div>

                                {/* Item & Specs */}
                                <div className="col-span-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded">{item.item_id}</span>
                                        <span className="text-xs text-indigo-600 font-semibold">{item.category}</span>
                                    </div>
                                    <div className="font-bold text-slate-900 text-sm leading-tight">{item.item_name}</div>
                                </div>

                                {/* Qty */}
                                <div className="col-span-1 text-center">
                                    <div className="font-bold text-slate-900">{item.quantity}</div>
                                    <div className="text-xs text-slate-500">{item.unit}</div>
                                </div>

                                {/* Internal Cost */}
                                <div className="col-span-1 text-right">
                                    <div className="font-bold text-slate-900">{formatCurrency(item.internal_cost)}</div>
                                    <div className="text-xs text-slate-400">Total: {formatCurrency(item.internal_cost * item.quantity)}</div>
                                </div>

                                {/* Competitor Sources Button */}
                                <div className="col-span-2 flex flex-col items-center justify-center">
                                    <div className="font-bold text-slate-900 mb-1">
                                        {formatCurrency(item.competitor_avg)} <span className="text-xs text-slate-400 font-normal">(Avg)</span>
                                    </div>
                                    <button
                                        onClick={() => toggleRow(item.item_id)}
                                        className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition"
                                    >
                                        {item.competitor_sources} Sources
                                        <svg className={`w-4 h-4 transform transition ${expandedRows[item.item_id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                </div>

                                {/* AI Strategy Dropdown */}
                                <div className="col-span-1 flex justify-center">
                                    <select
                                        value={item.selected_strategy}
                                        onChange={(e) => handleStrategyChange(item, e.target.value)}
                                        className={`text-xs font-bold px-3 py-2 rounded-lg outline-none cursor-pointer border appearance-none text-center w-full shadow-sm
                                            ${item.selected_strategy.includes('Undercut') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                item.selected_strategy.includes('Margin') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'}`}
                                    >
                                        {item.available_strategies.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Human Override & Rationale Tooltip */}
                                <div className="col-span-2 flex items-center justify-center gap-2 relative group">

                                    {/* AI Rationale Hover Card */}
                                    <div className="absolute z-20 bottom-full mb-2 hidden group-hover:block w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-4 text-xs text-slate-600 leading-relaxed">
                                        <div className="font-bold text-indigo-600 mb-1 flex items-center gap-1">
                                            <span>✨</span> AI Rationale
                                        </div>
                                        {item.ai_rationale}
                                    </div>

                                    <div className="relative flex items-center w-3/4">
                                        <span className="absolute left-3 text-slate-400 font-medium">$</span>
                                        <input
                                            type="number"
                                            value={item.human_price_override}
                                            onChange={(e) => handlePriceChange(item.item_id, e.target.value)}
                                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-right"
                                        />
                                    </div>
                                    <span className="text-xl cursor-help text-indigo-400 hover:text-indigo-600 transition">✨</span>
                                </div>

                                {/* Margin & Profit */}
                                <div className="col-span-1 text-right">
                                    <div className="font-bold text-slate-900">{formatCurrency(item.total_profit)}</div>
                                    <div className={`text-xs font-bold ${item.margin_percentage > 20 ? 'text-emerald-600' : 'text-amber-500'}`}>
                                        {item.margin_percentage}% Margin
                                    </div>
                                </div>
                            </div>

                            {/* Nested Competitor Expanded Row (Dark Theme as requested) */}
                            {expandedRows[item.item_id] && (
                                <div className="bg-[#111827] text-white p-6 shadow-inner border-t border-slate-200">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">MARKET COMPETITOR BENCHMARK COMPARISON ({item.competitor_sources} SOURCES)</h4>
                                                <p className="text-xs text-slate-400">Detailed comparison of market pricing for <span className="font-semibold text-slate-200">{item.item_name}</span></p>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleRow(item.item_id)} className="text-xs text-slate-400 hover:text-white transition">Close Table ^</button>
                                    </div>

                                    {/* Stat Cards */}
                                    <div className="grid grid-cols-4 gap-4 mb-6">
                                        <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-4">
                                            <div className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Lowest Market Price</div>
                                            <div className="text-xl font-bold text-emerald-400">{formatCurrency(item.competitor_range_min)}</div>
                                        </div>
                                        <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-4">
                                            <div className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Market Average</div>
                                            <div className="text-xl font-bold text-indigo-400">{formatCurrency(item.competitor_avg)}</div>
                                        </div>
                                        <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-4">
                                            <div className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Highest Market Price</div>
                                            <div className="text-xl font-bold text-amber-400">{formatCurrency(item.competitor_range_max)}</div>
                                        </div>
                                        <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
                                            <div className="relative z-10">
                                                <div className="text-xs text-indigo-200 font-bold mb-1 uppercase tracking-wider">Our Quoted Price</div>
                                                <div className="text-xl font-bold text-white">{formatCurrency(item.human_price_override)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Competitor List Table */}
                                    {item.competitor_details && item.competitor_details.length > 0 ? (
                                        <div className="w-full text-left text-sm">
                                            <div className="grid grid-cols-5 text-xs font-bold text-slate-400 border-b border-[#374151] pb-3 mb-3 uppercase tracking-wider">
                                                <div className="col-span-1">Competitor Name</div>
                                                <div className="col-span-1">Market Tier</div>
                                                <div className="col-span-1 text-right">Unit Price</div>
                                                <div className="col-span-1 text-right">Price Delta</div>
                                                <div className="col-span-1 text-right">Action</div>
                                            </div>
                                            {item.competitor_details.map((comp, idx) => (
                                                <div key={idx} className="grid grid-cols-5 items-center py-3 border-b border-[#1f2937] last:border-0 hover:bg-[#1f2937] transition rounded px-2 -mx-2">
                                                    <div className="col-span-1 font-bold flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                        {comp.competitor_name}
                                                    </div>
                                                    <div className="col-span-1">
                                                        <span className="text-xs bg-[#374151] text-slate-300 px-2 py-1 rounded">{comp.market_tier}</span>
                                                    </div>
                                                    <div className="col-span-1 text-right font-bold">{formatCurrency(comp.unit_price)}</div>
                                                    <div className="col-span-1 text-right text-emerald-400 font-medium">{comp.price_delta_vs_quote}</div>
                                                    <div className="col-span-1 text-right">
                                                        <button
                                                            onClick={() => handlePriceChange(item.item_id, comp.unit_price)}
                                                            className="text-xs font-semibold text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded hover:bg-indigo-500/20 transition"
                                                        >
                                                            Match {formatCurrency(comp.unit_price)}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 text-sm">
                                            Detailed individual competitor data is not available for this item in the current MongoDB collection. The system extrapolated ranges based on the known market average.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}