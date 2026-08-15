import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ReviewQuotation() {
    const location = useLocation();
    const navigate = useNavigate();

    const { analysisData: stateData, rfpTitle: stateTitle } = location.state || {};

    // Fall back to sessionStorage if the user refreshed the page (location.state is null)
    const analysisData = stateData ?? (() => {
        const cached = sessionStorage.getItem('rfp_analysisData');
        return cached ? JSON.parse(cached) : null;
    })();
    const rfpTitle = stateTitle ?? sessionStorage.getItem('rfp_rfpTitle') ?? 'Untitled RFP';


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
                return { ...parsedItem, ...pricingData, is_approved: true };
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
            const approved_items = items
                .filter(item => item.is_approved)
                .map(item => ({
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

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    // KPI Calculations
    const approvedItemsForKPI = items.filter(item => item.is_approved);
    const totalQuotedValue = approvedItemsForKPI.reduce((acc, item) => acc + (parseFloat(item.human_price_override) || 0) * item.quantity, 0);
    const internalCostBase = approvedItemsForKPI.reduce((acc, item) => acc + (parseFloat(item.internal_cost) || 0) * item.quantity, 0);
    const marketAvgBenchmark = approvedItemsForKPI.reduce((acc, item) => acc + (parseFloat(item.competitor_avg) || 0) * item.quantity, 0);

    const grossProfit = totalQuotedValue - internalCostBase;
    const blendedMargin = totalQuotedValue > 0 ? (grossProfit / totalQuotedValue) * 100 : 0;
    const varianceVsMarket = marketAvgBenchmark > 0 ? ((totalQuotedValue - marketAvgBenchmark) / marketAvgBenchmark) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#080c1a] text-slate-800 p-8 font-sans">

            {/* Top Bar */}
            <div className="w-full mx-auto flex justify-between items-end mb-6 text-white">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Review Quotation: {rfpTitle}</h1>
                    <div className="flex items-center gap-4">
                        <label className="text-sm text-slate-400">Client Name:</label>
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
                    className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-900/50 disabled:opacity-50"
                >
                    {isGenerating ? 'Generating PDF...' : 'Approve & Generate PDF →'}
                </button>
            </div>

            {/* KPI Summary Cards */}
            <div className="w-full mx-auto grid grid-cols-5 gap-4 mb-6">
                {/* Card 1: Total Quoted Value */}
                <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 shadow-lg relative">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold text-slate-400">Total Quoted Value</h3>
                        <span className="text-indigo-500 font-bold text-lg leading-none">₹</span>
                    </div>
                    <div className="text-3xl font-black text-indigo-400 mb-1">{formatCurrency(totalQuotedValue)}</div>
                    <p className="text-xs text-slate-400 font-medium">Live sum of all line items</p>
                </div>

                {/* Card 2: Internal Cost Base */}
                <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 shadow-lg relative">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold text-slate-400">Internal Cost Base</h3>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <div className="text-3xl font-black text-slate-100 mb-1">{formatCurrency(internalCostBase)}</div>
                    <p className="text-xs text-slate-400 font-medium">Baseline delivery expense</p>
                </div>

                {/* Card 3: Market Avg Benchmark */}
                <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 shadow-lg relative">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold text-slate-400">Market Avg Benchmark</h3>
                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    </div>
                    <div className="text-3xl font-black text-slate-100 mb-1">{formatCurrency(marketAvgBenchmark)}</div>
                    <p className="text-xs font-medium">
                        <span className="text-slate-400">Variance: </span>
                        <span className={varianceVsMarket <= 0 ? "text-emerald-400" : "text-red-400"}>
                            {varianceVsMarket > 0 ? '+' : ''}{varianceVsMarket.toFixed(1)}% vs Market Avg
                        </span>
                    </p>
                </div>

                {/* Card 4: Blended Gross Margin */}
                <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 shadow-lg relative">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold text-slate-400">Blended Gross Margin</h3>
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <div className="text-3xl font-black text-emerald-400 mb-1">{blendedMargin.toFixed(1)}%</div>
                    <p className="text-xs font-medium text-emerald-500">
                        +{formatCurrency(grossProfit)} Gross Profit
                    </p>
                </div>

                {/* Card 5: Approval Status */}
                <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 shadow-lg relative">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold text-slate-400">Approval Status</h3>
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="text-3xl font-black text-slate-100 mb-1">
                        {items.filter(i => i.is_approved).length} / {items.length}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Line items ready for review</p>
                </div>
            </div>

            {error && (
                <div className="w-full mx-auto mb-4 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">
                    {error}
                </div>
            )}

            {/* Main Table Container */}
            <div className="w-full mx-auto bg-[#111827] rounded-xl overflow-hidden shadow-2xl border border-[#374151]">

                {/* Table Header */}
                <div className="grid gap-4 p-4 border-b border-[#374151] text-xs font-bold text-slate-400 uppercase tracking-wider bg-[#1f2937]"
                    style={{ gridTemplateColumns: '0.5fr 2.5fr 1fr 1fr 1.5fr 2fr 2fr 1.5fr' }}>
                    <div className="text-center">Status</div>
                    <div>Item & Specs</div>
                    <div className="text-center">Qty / Unit</div>
                    <div className="text-right">Internal Cost</div>
                    <div className="text-center">Competitor Sources</div>
                    <div className="text-center">AI Strategy</div>
                    <div className="text-center">Price</div>
                    <div className="text-right">Margin & Profit</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-[#374151] bg-[#111827]">
                    {items.map((item) => (
                        <div key={item.item_id} className="flex flex-col">

                            {/* Main Visible Row */}
                            <div className="grid gap-4 p-4 items-center hover:bg-[#1f2937] transition relative"
                                style={{ gridTemplateColumns: '0.5fr 2.5fr 1fr 1fr 1.5fr 2fr 2fr 1.5fr' }}>

                                {/* Loading Overlay for individual row recalculation */}
                                {recalculatingId === item.item_id && (
                                    <div className="absolute inset-0 bg-[#111827]/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                                        <span className="ml-3 font-semibold text-indigo-400">AI Recalculating...</span>
                                    </div>
                                )}

                                {/* Status Checkbox */}
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => {
                                            setItems(prevItems => prevItems.map(i =>
                                                i.item_id === item.item_id ? { ...i, is_approved: !i.is_approved } : i
                                            ));
                                        }}
                                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition cursor-pointer ${item.is_approved ? 'bg-emerald-500 border-emerald-500 text-slate-900' : 'border-slate-500 text-transparent hover:border-emerald-500'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                </div>

                                {/* Item & Specs */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono bg-[#374151] text-slate-300 px-2 py-0.5 rounded">{item.item_id}</span>
                                        <span className="text-xs text-indigo-400 font-semibold">{item.category}</span>
                                    </div>
                                    <div className="font-bold text-slate-100 text-sm leading-tight">{item.item_name}</div>
                                </div>

                                {/* Qty */}
                                <div className="text-center">
                                    <div className="font-bold text-slate-100">{item.quantity}</div>
                                    <div className="text-xs text-slate-400">{item.unit}</div>
                                </div>

                                {/* Internal Cost */}
                                <div className="text-right">
                                    <div className="font-bold text-slate-100">{formatCurrency(item.internal_cost)}</div>
                                    <div className="text-xs text-slate-500">Total: {formatCurrency(item.internal_cost * item.quantity)}</div>
                                </div>

                                {/* Competitor Sources Button */}
                                <div className="flex flex-col items-center justify-center">
                                    <div className="font-bold text-slate-100 mb-1">
                                        {formatCurrency(item.competitor_avg)} <span className="text-xs text-slate-500 font-normal">(Avg)</span>
                                    </div>
                                    <button
                                        onClick={() => toggleRow(item.item_id)}
                                        className="cursor-pointer text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 flex items-center gap-1 transition"
                                    >
                                        Sources
                                        <svg className={`w-4 h-4 transform transition ${expandedRows[item.item_id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                </div>

                                {/* AI Strategy Dropdown */}
                                <div className="flex justify-center">
                                    <select
                                        value={item.selected_strategy}
                                        onChange={(e) => handleStrategyChange(item, e.target.value)}
                                        className={`text-xs font-bold px-2 py-2 rounded-lg outline-none cursor-pointer border appearance-none text-center shadow-sm
                                            ${item.selected_strategy.includes('Undercut') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                                item.selected_strategy.includes('Margin') ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                                    'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}
                                    >
                                        {item.available_strategies.map(s => (
                                            <option key={s} value={s} className="bg-[#1f2937] text-white">{s}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Human Override (Tooltip removed) */}
                                <div className="flex items-center justify-center gap-2">
                                    <div className="relative flex items-center w-3/4">
                                        <span className="absolute left-3 text-slate-500 font-medium">₹</span>
                                        <input
                                            type="number"
                                            value={item.human_price_override}
                                            onChange={(e) => handlePriceChange(item.item_id, e.target.value)}
                                            className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-right transition"
                                        />
                                    </div>
                                </div>

                                {/* Margin & Profit */}
                                <div className="text-right">
                                    <div className="font-bold text-slate-100">{formatCurrency(item.total_profit)}</div>
                                    <div className={`text-xs font-bold ${item.margin_percentage > 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {item.margin_percentage}% Margin
                                    </div>
                                </div>
                            </div>

                            {/* Nested Competitor Expanded Row */}
                            {expandedRows[item.item_id] && (
                                <div className="bg-[#0b101a] text-white p-6 shadow-inner border-t border-[#374151]">
                                    {/* ... rest of the nested expanded row remains exactly the same ... */}
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

                                    {/* NEW: Static AI Rationale Highlight Card */}
                                    <div className="mb-6 bg-[#1f2937] border border-[#374151] rounded-lg p-4 relative overflow-hidden shadow-md">
                                        {/* Left accent border */}
                                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                        <div className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
                                            <span className="text-lg">✨</span> AI Pricing Rationale
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed ml-7">
                                            {item.ai_rationale}
                                        </p>
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