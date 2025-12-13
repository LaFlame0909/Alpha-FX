import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { AppState, KPI, Trade } from '../types';
import { calculateKPIs } from '../services/storage';
import { Wallet, TrendingUp, Activity, Scale, ArrowUpRight, ArrowDownRight, DollarSign, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Percent, MoreHorizontal } from 'lucide-react';

interface DashboardProps {
  data: AppState;
}

const KPICard = ({ label, value, icon: Icon, trend, subValue, highlight }: { label: string, value: string | number, icon: any, trend?: 'up' | 'down', subValue?: string, highlight?: boolean }) => (
  <div className={`relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 group ${
      highlight 
      ? 'bg-gradient-to-br from-bb-accent to-indigo-600 text-white border-transparent shadow-xl shadow-indigo-500/20' 
      : 'bg-bb-card border-bb-border hover:border-bb-accent/20 hover:shadow-lg hover:shadow-gray-200/5 dark:hover:shadow-black/20'
  }`}>
    {highlight && (
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
    )}
    
    <div className="flex justify-between items-start relative z-10 mb-6">
        <div className={`p-3 rounded-2xl ${highlight ? 'bg-white/20 text-white backdrop-blur-md border border-white/10' : 'bg-bb-bg text-bb-accent border border-bb-border'}`}>
            <Icon size={20} strokeWidth={2.5} />
        </div>
        {(trend || subValue) && (
            <div className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${
                highlight 
                ? 'bg-white/10 border-white/10 text-white' 
                : (trend === 'up' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : trend === 'down' ? 'bg-rose-500/5 text-rose-500 border-rose-500/20' : 'bg-bb-bg text-bb-muted border-bb-border')
            }`}>
                {trend === 'up' && <ArrowUpRight size={14} className="mr-1" />}
                {trend === 'down' && <ArrowDownRight size={14} className="mr-1" />}
                {subValue || (trend === 'up' ? 'Profit' : 'Loss')}
            </div>
        )}
    </div>

    <div className="relative z-10">
        <h3 className="text-3xl font-extrabold tracking-tight truncate mb-1">{value}</h3>
        <p className={`text-[11px] uppercase tracking-widest font-bold ${highlight ? 'text-white/70' : 'text-bb-muted'}`}>{label}</p>
    </div>
  </div>
);

const CalendarWidget = ({ trades }: { trades: Trade[] }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // Helper to get formatted date string
    const getDateStr = (d: Date) => d.toISOString().slice(0, 10);

    // 1. Generate the grid days (always 6 weeks = 42 days for consistency)
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1);
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
        
        // Calculate the very first date of the grid (often in previous month)
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - startDayOfWeek);

        const days = [];
        for (let i = 0; i < 42; i++) {
            const current = new Date(startDate);
            current.setDate(startDate.getDate() + i);
            days.push(current);
        }
        return days;
    }, [year, month]);

    // 2. Chunk days into weeks (7 days per week)
    const weeks = useMemo(() => {
        const chunks = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            chunks.push(calendarDays.slice(i, i + 7));
        }
        return chunks;
    }, [calendarDays]);

    // 3. Trade Data Aggregation
    const getDayStats = (date: Date) => {
        const dateStr = getDateStr(date);
        const dayTrades = trades.filter(t => t.date.startsWith(dateStr));
        const pl = dayTrades.reduce((acc, t) => acc + t.pl, 0);
        const wins = dayTrades.filter(t => t.pl > 0).length;
        return { 
            pl, 
            count: dayTrades.length, 
            wins,
            hasTrades: dayTrades.length > 0 
        };
    };

    // Calculate Month Stats for Header
    const monthTrades = trades.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });
    const monthPL = monthTrades.reduce((sum, t) => sum + t.pl, 0);
    const monthWins = monthTrades.filter(t => t.pl > 0).length;
    const monthWinRate = monthTrades.length ? ((monthWins / monthTrades.length) * 100).toFixed(0) : 0;

    const navigateMonth = (direction: number) => {
        setViewDate(new Date(year, month + direction, 1));
    };

    return (
        <div className="bg-bb-card rounded-3xl border border-bb-border shadow-sm flex flex-col h-full hover:border-bb-accent/20 transition-all duration-300 overflow-hidden">
            {/* Header / Toolbar */}
            <div className="p-6 border-b border-bb-border flex flex-col xl:flex-row justify-between items-center gap-6 bg-bb-bg/30">
                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="p-3 bg-bb-accent/10 rounded-2xl text-bb-accent border border-bb-accent/20 shadow-sm">
                        <CalendarIcon size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-bb-text tracking-tight">Trading Calendar</h3>
                        <p className="text-xs text-bb-muted font-medium uppercase tracking-wide">Performance Overview</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Month Stats Pills */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl bg-bb-bg border border-bb-border flex flex-col items-center min-w-[100px]">
                            <span className="text-[10px] font-bold text-bb-muted uppercase tracking-widest">Net P&L</span>
                            <span className={`text-sm font-black ${monthPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {monthPL >= 0 ? '+' : ''}${monthPL.toFixed(0)}
                            </span>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-bb-bg border border-bb-border flex flex-col items-center min-w-[80px]">
                            <span className="text-[10px] font-bold text-bb-muted uppercase tracking-widest">Win Rate</span>
                            <span className="text-sm font-black text-bb-text">{monthWinRate}%</span>
                        </div>
                         <div className="px-4 py-2 rounded-xl bg-bb-bg border border-bb-border flex flex-col items-center min-w-[80px]">
                            <span className="text-[10px] font-bold text-bb-muted uppercase tracking-widest">Trades</span>
                            <span className="text-sm font-black text-bb-text">{monthTrades.length}</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-1 bg-bb-bg p-1.5 rounded-xl border border-bb-border shadow-inner">
                        <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-bb-card rounded-lg text-bb-muted hover:text-bb-text transition shadow-sm border border-transparent hover:border-bb-border">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-bold text-bb-text min-w-[120px] text-center uppercase tracking-wide select-none">
                            {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-bb-card rounded-lg text-bb-muted hover:text-bb-text transition shadow-sm border border-transparent hover:border-bb-border">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-bb-bg/50 p-4">
                
                {/* Day Headers */}
                <div className="grid grid-cols-[repeat(7,1fr)_120px] gap-2 mb-2">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                        <div key={d} className="text-center text-[11px] font-extrabold text-bb-muted/60 uppercase tracking-widest py-2">
                            {d}
                        </div>
                    ))}
                    <div className="text-center text-[11px] font-extrabold text-bb-accent uppercase tracking-widest py-2">
                        Weekly P&L
                    </div>
                </div>

                {/* Weeks Rows */}
                <div className="flex flex-col gap-2">
                    {weeks.map((week, wIndex) => {
                        // Calculate Weekly P&L
                        const weekPL = week.reduce((acc, date) => {
                            const stats = getDayStats(date);
                            return acc + stats.pl;
                        }, 0);
                        
                        const weekTradeCount = week.reduce((acc, date) => acc + getDayStats(date).count, 0);

                        return (
                            <div key={wIndex} className="grid grid-cols-[repeat(7,1fr)_120px] gap-2">
                                {week.map((date, dIndex) => {
                                    const isCurrentMonth = date.getMonth() === month;
                                    const stats = getDayStats(date);
                                    const isToday = getDateStr(date) === getDateStr(new Date());

                                    return (
                                        <div 
                                            key={dIndex} 
                                            className={`
                                                relative min-h-[120px] p-3 rounded-2xl border flex flex-col justify-between transition-all duration-300
                                                ${isCurrentMonth 
                                                    ? 'bg-bb-card border-bb-border hover:border-bb-accent/30 hover:shadow-lg hover:shadow-bb-accent/5' 
                                                    : 'bg-bb-bg/30 border-transparent opacity-40 hover:opacity-100'
                                                }
                                                ${isToday ? 'ring-2 ring-bb-accent ring-offset-2 ring-offset-bb-bg' : ''}
                                            `}
                                        >
                                            {/* Date Number */}
                                            <div className="flex justify-between items-start">
                                                <span className={`text-xs font-bold ${isCurrentMonth ? 'text-bb-muted' : 'text-bb-muted/50'}`}>
                                                    {date.getDate()}
                                                </span>
                                                {stats.hasTrades && (
                                                    <span className="text-[10px] font-bold text-bb-muted bg-bb-bg border border-bb-border px-1.5 rounded-md">
                                                        {stats.count}t
                                                    </span>
                                                )}
                                            </div>

                                            {/* Day P&L content */}
                                            {stats.hasTrades ? (
                                                <div className="mt-2 text-center">
                                                    <div className={`text-lg font-black tracking-tight ${stats.pl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {stats.pl >= 0 ? '+' : ''}{Math.round(stats.pl)}
                                                    </div>
                                                    <div className={`text-[10px] font-bold uppercase tracking-wider ${stats.pl >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                                        {stats.pl >= 0 ? 'Profit' : 'Loss'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <div className="w-1 h-1 rounded-full bg-bb-border"></div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Weekly Stats Column */}
                                <div className="rounded-2xl bg-bb-bg border border-bb-border flex flex-col items-center justify-center p-2 min-h-[120px]">
                                    {weekTradeCount > 0 ? (
                                        <>
                                            <div className="text-[9px] font-bold text-bb-muted uppercase tracking-widest mb-1">Weekly</div>
                                            <div className={`text-base font-black tracking-tight mb-1 ${weekPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {weekPL >= 0 ? '+' : ''}${Math.round(weekPL)}
                                            </div>
                                            <div className="text-[10px] font-medium text-bb-text px-2 py-0.5 rounded-md bg-bb-card border border-bb-border">
                                                {weekTradeCount} Trades
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-bb-muted/20 text-xs font-bold">-</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const stats: KPI = useMemo(() => calculateKPIs(data), [data]);

  const equityData = useMemo(() => {
    const allEvents = [
        ...data.trades.map(t => ({ date: new Date(t.date).getTime(), val: t.pl })),
        ...data.accounting.map(a => ({ date: new Date(a.date).getTime(), val: a.type === 'Deposit' ? a.amount : -a.amount }))
    ].sort((a, b) => a.date - b.date);

    let running = 0;
    const points = allEvents.map(e => {
        running += e.val;
        return { date: e.date, value: running };
    });
    
    if (points.length === 0) return [{ date: Date.now(), value: 0 }];
    return points;
  }, [data]);

  const winLossData = useMemo(() => {
      const wins = data.trades.filter(t => t.pl > 0).length;
      const losses = data.trades.filter(t => t.pl <= 0).length;
      return [
          { name: 'Wins', value: wins },
          { name: 'Losses', value: losses }
      ];
  }, [data]);
  
  const COLORS = ['#10b981', '#f43f5e']; 

  return (
    <div className="pb-12 max-w-[1600px] mx-auto space-y-8">
      {/* 1. KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <KPICard label="Total Balance" value={`$${stats.balance.toFixed(2)}`} icon={Wallet} highlight />
        <KPICard 
            label="Net Profit/Loss" 
            value={`$${stats.netPL.toFixed(2)}`} 
            icon={DollarSign} 
            trend={stats.netPL >= 0 ? 'up' : 'down'} 
        />
        <KPICard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Percent} />
        <KPICard label="Profit Factor" value={stats.profitFactor.toFixed(2)} icon={Scale} />
        <KPICard label="Exp. Value" value={`$${stats.ev.toFixed(2)}`} icon={Activity} />
      </div>

      {/* 2. Main Grid Layout */}
      <div className="flex flex-col gap-8">
        
        {/* Top Section: Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-3 bg-bb-card rounded-3xl border border-bb-border shadow-sm overflow-hidden hover:border-bb-accent/20 transition-all duration-300">
                <div className="p-6 border-b border-bb-border flex justify-between items-center bg-bb-bg/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                         <div className="p-3 bg-bb-bg rounded-2xl text-bb-accent border border-bb-border shadow-sm">
                            <TrendingUp size={20} strokeWidth={2.5} />
                         </div>
                         <div>
                             <h3 className="text-lg font-bold text-bb-text tracking-tight">Performance Analytics</h3>
                             <p className="text-xs text-bb-muted font-medium">Account Growth & Consistency</p>
                         </div>
                    </div>
                </div>
                
                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Equity Chart */}
                    <div className="lg:col-span-2 h-[350px]">
                        <h4 className="text-xs font-bold text-bb-muted uppercase mb-6 tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-bb-accent"></div>
                            Equity Curve
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={equityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
                                stroke="var(--color-muted)"
                                tick={{fontSize: 10, fill: 'var(--color-muted)', fontWeight: 500}}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis 
                                stroke="var(--color-muted)" 
                                tick={{fontSize: 10, fill: 'var(--color-muted)', fontWeight: 500}} 
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                                tickFormatter={(val) => `$${val}`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-text)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: 'var(--color-accent)', fontWeight: 'bold' }}
                                formatter={(val: number) => [`$${val.toFixed(2)}`, 'Equity']}
                                labelStyle={{ color: 'var(--color-muted)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="var(--color-accent)" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-accent)' }}
                            />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Donut Chart */}
                    <div className="h-[350px] flex flex-col relative border-t lg:border-t-0 lg:border-l border-bb-border/50 pt-8 lg:pt-0 pl-0 lg:pl-10">
                        <h4 className="text-xs font-bold text-bb-muted uppercase mb-6 tracking-widest flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             Win Ratio
                        </h4>
                        <div className="flex-1 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={winLossData}
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={8}
                                    >
                                        {winLossData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}
                                        itemStyle={{ color: 'var(--color-text)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-4xl font-black text-bb-text tracking-tighter">{stats.winRate.toFixed(0)}%</span>
                                <span className="text-[10px] text-bb-muted uppercase tracking-widest font-bold mt-1">Win Rate</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Section: Full Width Calendar */}
        <div className="w-full">
             <CalendarWidget trades={data.trades} />
        </div>

      </div>
    </div>
  );
};