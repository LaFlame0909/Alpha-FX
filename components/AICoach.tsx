import React, { useState, useRef, useEffect } from 'react';
import { AI_MODE, Trade } from '../types';
import { MessageSquare, Eye, Brain, Globe, Send, Loader2, ImagePlus, CandlestickChart, Trash2 } from 'lucide-react';
import { chatWithCoach, analyzeTradeImage, analyzePsychology, getMarketBriefing } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface AICoachProps {
    trades: Trade[];
}

interface Message {
    role: 'user' | 'ai';
    content: string;
    type?: 'text' | 'image';
}

const PatternCard = ({ name, type, desc, children }: { name: string, type: string, desc: string, children: React.ReactNode }) => (
    <div className="bg-bb-card border border-bb-border rounded-xl p-4 flex flex-col gap-3 hover:border-bb-accent/50 transition group h-full shadow-sm">
        <div className="h-28 bg-bb-bg rounded-lg flex items-center justify-center border border-bb-border relative overflow-hidden group-hover:bg-bb-bg/50 transition-colors">
            {children}
        </div>
        <div>
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-bb-text text-sm">{name}</h4>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
                    type.includes('Bullish') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                    (type.includes('Bearish') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20')
                }`}>
                    {type.split(' ')[0]}
                </span>
            </div>
            <p className="text-xs text-bb-muted leading-relaxed">{desc}</p>
        </div>
    </div>
);

// Improved Candle Component for accurate wick/body rendering
const Candle = ({ type = 'bullish', bodyHeight = 'h-8', topWick = 'h-2', bottomWick = 'h-2', className = '' }: { type?: 'bullish' | 'bearish' | 'neutral', bodyHeight?: string, topWick?: string, bottomWick?: string, className?: string }) => {
    const bg = type === 'bullish' ? 'bg-green-500' : (type === 'bearish' ? 'bg-red-500' : 'bg-gray-400');
    const border = type === 'bullish' ? 'border-green-600' : (type === 'bearish' ? 'border-red-600' : 'border-gray-500');
    const wickColor = 'bg-gray-500';

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className={`w-[1px] ${wickColor} ${topWick}`}></div>
            <div className={`w-3 ${bodyHeight} ${bg} border ${border} z-10 ${type === 'neutral' ? 'h-[1px] border-none' : ''}`}></div>
            <div className={`w-[1px] ${wickColor} ${bottomWick}`}></div>
        </div>
    );
};

export const AICoach: React.FC<AICoachProps> = ({ trades }) => {
    const [mode, setMode] = useState<AI_MODE>(AI_MODE.CHAT);
    
    // Separate history state for each mode
    const [histories, setHistories] = useState<Record<string, Message[]>>({
        [AI_MODE.CHAT]: [{ role: 'ai', content: "Hello! I'm AlphaOne. Ask me anything about your trading data and performance." }],
        [AI_MODE.VISION]: [{ role: 'ai', content: "Upload a chart screenshot or describe a market setup, and I'll analyze the price action." }],
        [AI_MODE.PSYCHO]: [{ role: 'ai', content: "Journal your thoughts here. I'll analyze your psychology, look for bias, and offer mindset advice." }],
        [AI_MODE.NEWS]: [{ role: 'ai', content: "Click 'Market Briefing' to get the latest high-impact news and analysis for today." }],
        [AI_MODE.PATTERNS]: [] // Static view
    });

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [histories[mode], mode]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const clearHistory = () => {
        if(window.confirm("Clear chat history for this module?")) {
             setHistories(prev => ({
                 ...prev,
                 [mode]: []
             }));
        }
    };

    const handleSubmit = async () => {
        if ((!input.trim() && !selectedImage && mode !== AI_MODE.NEWS) || isLoading) return;

        const userMsg = input;
        const currentHistory = histories[mode] || [];

        const newHistory = [...currentHistory, { role: 'user', content: userMsg || (selectedImage ? "[Image Uploaded]" : "Requesting...") } as Message];
        setHistories(prev => ({ ...prev, [mode]: newHistory }));
        
        setInput('');
        setIsLoading(true);

        let responseText = '';

        try {
            switch (mode) {
                case AI_MODE.CHAT:
                    responseText = await chatWithCoach(userMsg, trades);
                    break;
                case AI_MODE.VISION:
                    if (selectedImage) {
                        responseText = await analyzeTradeImage(selectedImage);
                        setSelectedImage(null);
                    } else {
                        responseText = await chatWithCoach("Analyze this setup description: " + userMsg, trades);
                    }
                    break;
                case AI_MODE.PSYCHO:
                    responseText = await analyzePsychology(userMsg, trades);
                    break;
                case AI_MODE.NEWS:
                    responseText = await getMarketBriefing();
                    break;
            }
        } catch (error) {
            responseText = "Sorry, I encountered an error processing your request.";
        }

        setHistories(prev => ({
            ...prev,
            [mode]: [...prev[mode], { role: 'ai', content: responseText }]
        }));
        setIsLoading(false);
    };

    const setPrompt = (m: AI_MODE) => {
        setMode(m);
    };

    const activeMessages = histories[mode] || [];

    const ModeButton = ({ m, label, icon: Icon }: any) => (
        <button 
            onClick={() => { setPrompt(m); if(m === AI_MODE.NEWS && activeMessages.length <= 1) setTimeout(() => handleSubmit(), 100); }} 
            className={`text-left p-3 rounded-xl transition-all text-sm flex items-center gap-3 border ${
                mode === m 
                ? 'bg-bb-accent text-white shadow-md border-bb-accent' 
                : 'bg-bb-bg text-bb-muted hover:bg-bb-bg/80 hover:text-bb-text border-transparent'
            }`}
        >
            <Icon size={18} /> 
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full overflow-hidden pb-4">
            {/* Sidebar */}
            <div className="bg-bb-card p-4 rounded-2xl border border-bb-border flex flex-col gap-2 h-full shadow-sm">
                <h3 className="text-xs font-bold text-bb-muted mb-2 uppercase tracking-wider px-2">AI Modules</h3>
                
                <ModeButton m={AI_MODE.CHAT} label="Ask Journal (RAG)" icon={MessageSquare} />
                <ModeButton m={AI_MODE.VISION} label="Chart Analyst" icon={Eye} />
                <ModeButton m={AI_MODE.PSYCHO} label="Psycho-Analysis" icon={Brain} />
                <ModeButton m={AI_MODE.NEWS} label="Market Briefing" icon={Globe} />

                <div className="my-2 border-t border-bb-border"></div>

                <ModeButton m={AI_MODE.PATTERNS} label="Patterns Reference" icon={CandlestickChart} />

                {mode === AI_MODE.VISION && (
                    <div className="mt-auto pt-4 border-t border-bb-border">
                         <label className="block text-xs text-bb-muted mb-2 font-bold">Upload Chart</label>
                         <div className="relative group cursor-pointer bg-bb-bg border border-bb-border border-dashed rounded-xl p-4 text-center hover:bg-bb-bg/50 transition">
                             <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                             {selectedImage ? (
                                 <div className="text-green-500 text-xs flex flex-col items-center">
                                     <ImagePlus size={20} className="mb-1" />
                                     Image Loaded
                                 </div>
                             ) : (
                                 <div className="text-bb-muted flex flex-col items-center">
                                     <ImagePlus className="mb-1 group-hover:text-bb-text transition-colors" size={20} />
                                     <span className="text-xs">Click to upload</span>
                                 </div>
                             )}
                         </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3 bg-bb-card rounded-2xl border border-bb-border flex flex-col overflow-hidden shadow-sm">
                
                {mode === AI_MODE.PATTERNS ? (
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-bb-bg/30">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-bb-text mb-1">Candlestick Patterns</h2>
                            <p className="text-bb-muted text-sm">Essential price action signals for reversals and continuation.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {/* Reversals */}
                            <PatternCard name="Hammer" type="Bullish Reversal" desc="Found at bottom of downtrend. Small body, little to no upper wick, long lower wick (2x body). Buyers rejected lower prices.">
                                <Candle type="bullish" bodyHeight="h-3" topWick="h-0" bottomWick="h-12" />
                            </PatternCard>

                            <PatternCard name="Shooting Star" type="Bearish Reversal" desc="Found at top of uptrend. Small body, little to no lower wick, long upper wick (2x body). Sellers rejected higher prices.">
                                <Candle type="bearish" bodyHeight="h-3" topWick="h-12" bottomWick="h-0" />
                            </PatternCard>
                            
                            <PatternCard name="Inverted Hammer" type="Bullish Reversal" desc="Found in downtrend. Long upper wick, small body at bottom. Indicates buying pressure despite closing low.">
                                <Candle type="bullish" bodyHeight="h-3" topWick="h-10" bottomWick="h-1" />
                            </PatternCard>

                             <PatternCard name="Hanging Man" type="Bearish Reversal" desc="Found in uptrend. Same shape as Hammer but bearish context. Indicates sellers are starting to exercise control.">
                                <Candle type="bearish" bodyHeight="h-3" topWick="h-0" bottomWick="h-10" />
                            </PatternCard>

                            <PatternCard name="Bullish Engulfing" type="Bullish Reversal" desc="Green candle completely overlaps previous red candle's body. Strong shift in momentum.">
                                <div className="flex items-end gap-1">
                                    <Candle type="bearish" bodyHeight="h-4" topWick="h-2" bottomWick="h-2" />
                                    <Candle type="bullish" bodyHeight="h-8" topWick="h-3" bottomWick="h-2" />
                                </div>
                            </PatternCard>

                            <PatternCard name="Bearish Engulfing" type="Bearish Reversal" desc="Red candle completely overlaps previous green candle's body. Strong bearish momentum.">
                                <div className="flex items-end gap-1">
                                    <Candle type="bullish" bodyHeight="h-4" topWick="h-2" bottomWick="h-2" />
                                    <Candle type="bearish" bodyHeight="h-8" topWick="h-3" bottomWick="h-2" />
                                </div>
                            </PatternCard>

                            <PatternCard name="Morning Star" type="Bullish Reversal" desc="3-Candle: Large red, small indecision gap-down, then large green driving up.">
                                <div className="flex items-end gap-1">
                                    <Candle type="bearish" bodyHeight="h-8" topWick="h-2" bottomWick="h-2" />
                                    <Candle type="neutral" bodyHeight="h-2" topWick="h-2" bottomWick="h-2" className="mb-[-4px]" />
                                    <Candle type="bullish" bodyHeight="h-6" topWick="h-2" bottomWick="h-1" />
                                </div>
                            </PatternCard>

                            <PatternCard name="Evening Star" type="Bearish Reversal" desc="3-Candle: Large green, small indecision gap-up, then large red driving down.">
                                <div className="flex items-end gap-1">
                                    <Candle type="bullish" bodyHeight="h-8" topWick="h-2" bottomWick="h-2" />
                                    <Candle type="neutral" bodyHeight="h-2" topWick="h-2" bottomWick="h-2" className="mb-[24px]" />
                                    <Candle type="bearish" bodyHeight="h-6" topWick="h-2" bottomWick="h-1" />
                                </div>
                            </PatternCard>

                            {/* Indecision / Continuation */}
                            <PatternCard name="Doji" type="Neutral" desc="Open equals Close. Represents market indecision or a potential tug-of-war transition.">
                                <Candle type="neutral" bodyHeight="h-0" topWick="h-6" bottomWick="h-6" />
                            </PatternCard>

                            <PatternCard name="Dragonfly Doji" type="Bullish Bias" desc="Open/Close at high, long lower wick. Rejection of lows.">
                                <Candle type="neutral" bodyHeight="h-0" topWick="h-0" bottomWick="h-10" />
                            </PatternCard>

                            <PatternCard name="Marubozu" type="Trend Continuation" desc="Full body, no wicks. Indicates extreme conviction in one direction.">
                                <div className="flex gap-2">
                                    <Candle type="bullish" bodyHeight="h-12" topWick="h-0" bottomWick="h-0" />
                                    <Candle type="bearish" bodyHeight="h-12" topWick="h-0" bottomWick="h-0" />
                                </div>
                            </PatternCard>
                            
                            <PatternCard name="Tweezer Bottoms" type="Bullish Reversal" desc="Two or more candles with matching lows. Indicates a firm support level is holding.">
                                <div className="flex items-end gap-1">
                                    <Candle type="bearish" bodyHeight="h-6" topWick="h-2" bottomWick="h-0" />
                                    <Candle type="bullish" bodyHeight="h-4" topWick="h-2" bottomWick="h-0" />
                                </div>
                            </PatternCard>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-4 border-b border-bb-border bg-bb-bg/50 backdrop-blur-sm">
                            <span className="text-xs font-bold text-bb-muted uppercase tracking-wider flex items-center gap-2">
                                {mode === AI_MODE.CHAT && <MessageSquare size={14} />}
                                {mode === AI_MODE.VISION && <Eye size={14} />}
                                {mode === AI_MODE.PSYCHO && <Brain size={14} />}
                                {mode === AI_MODE.NEWS && <Globe size={14} />}
                                {mode} SESSION
                            </span>
                            {activeMessages.length > 0 && (
                                <button onClick={clearHistory} className="text-bb-muted hover:text-red-500 transition" title="Clear History">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-bb-bg/30">
                            {activeMessages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-bb-muted opacity-50">
                                    <Brain size={48} className="mb-4 text-bb-accent" />
                                    <p>Start a new conversation</p>
                                </div>
                            )}
                            {activeMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-bb-accent text-white rounded-tr-sm' 
                                        : 'bg-bb-card text-bb-text rounded-tl-sm border border-bb-border'
                                    }`}>
                                        {msg.role === 'ai' && <div className="flex items-center gap-2 mb-2 text-bb-accent font-bold text-xs uppercase"><Brain size={12} /> Coach</div>}
                                        {msg.role === 'ai' ? (
                                            <ReactMarkdown 
                                                className="markdown-content"
                                                components={{
                                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                                    strong: ({node, ...props}) => <strong className="text-bb-accent font-bold" {...props} />,
                                                    h3: ({node, ...props}) => <h3 className="text-sm font-bold text-bb-text mt-3 mb-1 uppercase" {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        ) : (
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-bb-card rounded-2xl px-5 py-3 rounded-tl-sm border border-bb-border flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-bb-accent" />
                                        <span className="text-xs text-bb-muted">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-bb-card border-t border-bb-border">
                            <div className="flex gap-2 relative">
                                <textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                                    rows={1}
                                    disabled={mode === AI_MODE.NEWS}
                                    className="flex-1 bg-bb-bg border border-bb-border rounded-xl px-4 py-3 text-sm text-bb-text focus:border-bb-accent outline-none resize-none disabled:opacity-50 transition-all focus:bg-bb-bg/80 placeholder:text-bb-muted"
                                    placeholder={mode === AI_MODE.NEWS ? "Click module to generate briefing..." : "Type your message here..."}
                                />
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={isLoading || (mode === AI_MODE.NEWS && isLoading)}
                                    className="bg-bb-accent hover:bg-bb-accent/80 disabled:opacity-50 text-white px-4 rounded-xl transition flex items-center justify-center shadow-lg shadow-bb-accent/20"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};