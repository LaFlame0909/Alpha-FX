import React, { useState, useEffect } from 'react';
import { RESOURCE_MODE } from '../types';
import { CandlestickChart, Clock, PlayCircle, Globe, Sun, Moon, MapPin } from 'lucide-react';

interface ResourcesProps {}

const PatternCard = ({ name, type, desc, children }: { name: string, type: string, desc: string, children?: React.ReactNode }) => (
    <div className="bg-bb-card border border-bb-border rounded-2xl p-5 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-xl hover:border-bb-accent/40 transition-all duration-300 group h-full">
        <div className="h-32 bg-bb-bg rounded-xl flex items-center justify-center border border-bb-border relative overflow-hidden group-hover:bg-bb-bg/80 transition-colors">
            {children}
        </div>
        <div>
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-bb-text text-sm group-hover:text-bb-accent transition-colors">{name}</h4>
                <span className={`text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wide ${
                    type.includes('Bullish') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                    (type.includes('Bearish') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20')
                }`}>
                    {type.split(' ')[0]}
                </span>
            </div>
            <p className="text-xs text-bb-muted leading-relaxed">{desc}</p>
        </div>
    </div>
);

const Candle = ({ type = 'bullish', bodyHeight = 'h-8', topWick = 'h-2', bottomWick = 'h-2', className = '' }: { type?: 'bullish' | 'bearish' | 'neutral', bodyHeight?: string, topWick?: string, bottomWick?: string, className?: string }) => {
    const bg = type === 'bullish' ? 'bg-emerald-500' : (type === 'bearish' ? 'bg-rose-500' : 'bg-gray-400');
    const border = type === 'bullish' ? 'border-emerald-600' : (type === 'bearish' ? 'border-rose-600' : 'border-gray-500');
    const wickColor = 'bg-bb-muted';

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className={`w-[2px] ${wickColor} ${topWick}`}></div>
            <div className={`w-4 ${bodyHeight} ${bg} border ${border} z-10 ${type === 'neutral' ? 'h-[2px] border-none' : 'rounded-[1px]'}`}></div>
            <div className={`w-[2px] ${wickColor} ${bottomWick}`}></div>
        </div>
    );
};

const Sessions = () => {
    // Base UTC Config
    const sessions = [
        { name: "Sydney", city: "Sydney", start: 22, end: 7, color: "bg-amber-500", icon: Sun },
        { name: "Tokyo", city: "Tokyo", start: 0, end: 9, color: "bg-rose-500", icon: Moon },
        { name: "London", city: "London", start: 8, end: 17, color: "bg-indigo-500", icon: Globe },
        { name: "New York", city: "New York", start: 13, end: 22, color: "bg-emerald-500", icon: MapPin },
    ];

    // Persist timezone in localStorage
    const [timezone, setTimezone] = useState<'UTC' | 'IST' | 'EST' | 'Local'>(() => {
        return (localStorage.getItem('market_session_timezone') as any) || 'UTC';
    });
    
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        localStorage.setItem('market_session_timezone', timezone);
    }, [timezone]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10s
        return () => clearInterval(timer);
    }, []);

    // Timezone Offsets (hours relative to UTC)
    const getOffset = () => {
        switch(timezone) {
            case 'IST': return 5.5;
            case 'EST': return -5;
            case 'Local': return -new Date().getTimezoneOffset() / 60;
            default: return 0; // UTC
        }
    };

    const offset = getOffset();

    // Current Hour in Selected Timezone (0-24 scale)
    const utcHour = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;
    let displayHour = (utcHour + offset) % 24;
    if (displayHour < 0) displayHour += 24;

    const displayTimeStr = new Date(currentTime.getTime() + offset * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

    // Helper to calculate session display range
    const getDisplayRange = (start: number, end: number) => {
        let s = (start + offset) % 24;
        let e = (end + offset) % 24;
        if (s < 0) s += 24;
        if (e < 0) e += 24;
        return { start: s, end: e };
    };

    const isActive = (start: number, end: number) => {
        // Active check uses pure UTC to be accurate regardless of display shift
        if (start < end) return utcHour >= start && utcHour < end;
        return utcHour >= start || utcHour < end; 
    };

    const activeSessions = sessions.filter(s => isActive(s.start, s.end));

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Top Status Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-bb-card p-6 rounded-3xl border border-bb-border shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-bb-text flex items-center gap-2">
                        <Globe size={20} className="text-bb-accent" />
                        Global Market Clock
                    </h3>
                    <p className="text-xs text-bb-muted mt-1">Forex Sessions Timeline</p>
                </div>
                
                <div className="flex items-center gap-6">
                    {/* Timezone Switcher */}
                    <div>
                        <div className="text-xs font-bold text-bb-muted uppercase tracking-wider mb-1">Timezone</div>
                        <select 
                            value={timezone} 
                            onChange={(e) => setTimezone(e.target.value as any)}
                            className="bg-bb-bg border border-bb-border text-bb-text text-sm rounded-lg p-1.5 focus:border-bb-accent outline-none font-bold"
                        >
                            <option value="UTC">UTC (GMT)</option>
                            <option value="IST">IST (UTC+5:30)</option>
                            <option value="EST">EST (New York)</option>
                            <option value="Local">My Local Time</option>
                        </select>
                    </div>

                    <div className="h-10 w-px bg-bb-border"></div>

                    <div className="text-right">
                        <div className="text-xs font-bold text-bb-muted uppercase tracking-wider">Current Time</div>
                        <div className="text-2xl font-mono font-bold text-bb-text">{displayTimeStr}</div>
                    </div>
                    
                    <div className="hidden md:block">
                        <div className="text-xs font-bold text-bb-muted uppercase tracking-wider mb-1">Active Now</div>
                        <div className="flex gap-2">
                            {activeSessions.length > 0 ? (
                                activeSessions.map(s => (
                                    <span key={s.name} className={`text-xs font-bold px-2 py-1 rounded-md text-white ${s.color}`}>
                                        {s.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs font-bold px-2 py-1 rounded-md bg-gray-500 text-white">Quiet Hours</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline Chart */}
            <div className="flex-1 bg-bb-card p-8 rounded-3xl border border-bb-border shadow-sm relative overflow-hidden flex flex-col justify-center">
                 {/* Current Time Line (Vertical) */}
                 <div 
                    className="absolute top-12 bottom-12 w-0.5 bg-red-500/80 z-20 pointer-events-none transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    style={{ left: `${(displayHour / 24) * 100}%` }}
                >
                    <div className="absolute -top-3 -translate-x-1/2">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500"></div>
                    </div>
                    <div className="absolute -bottom-3 -translate-x-1/2">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-red-500"></div>
                    </div>
                </div>

                {/* X-Axis Labels */}
                <div className="absolute top-4 left-0 right-0 flex justify-between px-0 text-[10px] font-mono text-bb-muted font-bold uppercase">
                    {Array.from({length: 13}).map((_, i) => (
                        <span key={i} style={{ left: `${(i * 2 / 24) * 100}%`, position: 'absolute' }}>
                            {i * 2}:00
                        </span>
                    ))}
                </div>

                {/* Grid Background */}
                <div className="absolute inset-0 mx-0 grid grid-cols-24 pointer-events-none">
                    {Array.from({length: 24}).map((_, i) => (
                        <div key={i} className={`border-r border-bb-border/20 h-full ${i % 4 === 0 ? 'border-bb-border/40' : ''}`}></div>
                    ))}
                </div>

                {/* Session Bars */}
                <div className="space-y-8 relative z-10 mt-6">
                    {sessions.map((s) => {
                         const { start, end } = getDisplayRange(s.start, s.end);
                         const isWrapped = end < start;
                         const active = isActive(s.start, s.end);
                         
                         return (
                            <div key={s.name} className="relative h-12">
                                {/* Label */}
                                <div className="absolute -top-6 left-0 flex items-center gap-2">
                                    <s.icon size={14} className={active ? 'text-bb-text' : 'text-bb-muted'} />
                                    <span className={`text-xs font-bold ${active ? 'text-bb-text' : 'text-bb-muted'}`}>{s.name}</span>
                                </div>

                                {/* Bar Track */}
                                <div className="absolute inset-x-0 h-3 top-2 bg-bb-bg rounded-full"></div>

                                {/* Active Bar Segment(s) */}
                                {!isWrapped ? (
                                    <div 
                                        className={`absolute h-3 top-2 rounded-full ${s.color} ${active ? 'opacity-100 shadow-lg' : 'opacity-40'} transition-all duration-500`}
                                        style={{ left: `${(start/24)*100}%`, width: `${((end - start)/24)*100}%` }}
                                    ></div>
                                ) : (
                                    <>
                                        <div 
                                            className={`absolute h-3 top-2 rounded-l-full ${s.color} ${active ? 'opacity-100 shadow-lg' : 'opacity-40'} transition-all duration-500`}
                                            style={{ left: `${(start/24)*100}%`, right: 0 }}
                                        ></div>
                                        <div 
                                            className={`absolute h-3 top-2 rounded-r-full ${s.color} ${active ? 'opacity-100 shadow-lg' : 'opacity-40'} transition-all duration-500`}
                                            style={{ left: 0, width: `${(end/24)*100}%` }}
                                        ></div>
                                    </>
                                )}
                            </div>
                         );
                    })}
                </div>

                {/* Bottom Overlap Indicators */}
                <div className="mt-8 flex justify-center gap-4">
                     <span className="text-xs text-bb-muted italic">Timezone adjusted: {timezone}</span>
                </div>
            </div>
        </div>
    );
};

export const Resources: React.FC<ResourcesProps> = () => {
    const [mode, setMode] = useState<RESOURCE_MODE>(RESOURCE_MODE.PATTERNS);

    const ModeButton = ({ m, label, icon: Icon }: any) => (
        <button 
            onClick={() => setMode(m)} 
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-sm flex items-center gap-3 border mb-2 ${
                mode === m 
                ? 'bg-bb-accent text-white shadow-lg shadow-bb-accent/25 border-bb-accent' 
                : 'bg-bb-card text-bb-muted hover:bg-bb-bg hover:text-bb-text border-transparent'
            }`}
        >
            <Icon size={18} /> 
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden pb-4">
            {/* Sidebar */}
            <div className="bg-bb-card p-6 rounded-3xl border border-bb-border flex flex-col h-full shadow-sm">
                <div className="flex items-center gap-2 mb-6 px-2">
                    <PlayCircle className="text-bb-accent" size={24} />
                    <h3 className="font-bold text-lg text-bb-text">Resources</h3>
                </div>
                
                <h4 className="text-[10px] font-bold text-bb-muted mb-3 uppercase tracking-widest px-2">Tools</h4>
                
                <ModeButton m={RESOURCE_MODE.PATTERNS} label="Pattern Library" icon={CandlestickChart} />
                <ModeButton m={RESOURCE_MODE.SESSIONS} label="Market Sessions" icon={Clock} />
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3 flex flex-col overflow-hidden h-full">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                     <h2 className="text-2xl font-bold text-bb-text tracking-tight flex items-center gap-3">
                        {mode === RESOURCE_MODE.PATTERNS && <><CandlestickChart className="text-bb-accent"/> Candlestick Patterns</>}
                        {mode === RESOURCE_MODE.SESSIONS && <><Clock className="text-bb-accent"/> Market Sessions</>}
                     </h2>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
                    
                    {mode === RESOURCE_MODE.SESSIONS && <Sessions />}

                    {mode === RESOURCE_MODE.PATTERNS && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    )}
                </div>
            </div>
        </div>
    );
};