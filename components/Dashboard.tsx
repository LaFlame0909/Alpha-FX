import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { AppState, KPI, Trade } from '../types';
import { calculateKPIs } from '../services/storage';
import { Wallet, TrendingUp, Activity, Scale, ArrowUpRight, ArrowDownRight, DollarSign, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DashboardProps {
  data: AppState;
}

const KPICard = ({ label, value, icon: Icon, trend, subValue }: { label: string, value: string | number, icon: any, trend?: 'up' | 'down', subValue?: string }) => (
  <div className="bg-bb-card p-5 rounded-2xl border border-bb-border shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 bg-bb-bg rounded-xl group-hover:bg-bb-accent/10 group-hover:text-bb-accent transition-colors text-bb-muted">
            <Icon size={20} />
        </div>
        {trend && (
            <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full border ${trend === 'up' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                {trend === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                {subValue}
            </div>
        )}
    </div>
    <div>
        <p className="text-xs text-bb-muted uppercase tracking-wider font-semibold mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-bb-text tracking-tight">{value}</h3>
    </div>
  </div>
);

const CalendarWidget = ({ trades }: { trades: Trade[] }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // Calendar Logic
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOffset = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: startDayOffset }, (_, i) => i);

    // Month Stats
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

    const getDayData = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTrades = trades.filter(t => t.date.startsWith(dateStr));
        if (dayTrades.length === 0) return null;
        
        const pl = dayTrades.reduce((acc, t) => acc + t.pl, 0);
        const count = dayTrades.length;
        return { pl, count };
    };

    return (
        <div className="bg-bb-card rounded-2xl border border-bb-border shadow-sm overflow-hidden flex flex-col h-full">
            {/* Calendar Header */}
            <div className="p-6 border-b border-bb-border flex flex-col md:flex-row justify-between items-center gap-4 bg-bb-bg/30">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-bb-accent/10 rounded-xl text-bb-accent">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-bb-text">P/L Calendar</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-bb-border rounded text-bb-muted hover:text-bb-text transition">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-mono text-bb-muted min-w-[120px] text-center font-semibold">
                                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-bb-border rounded text-bb-muted hover:text-bb-text transition">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Monthly Quick Stats */}
                <div className="flex gap-6 bg-bb-bg/50 px-6 py-3 rounded-xl border border-bb-border shadow-inner">
                    <div className="text-center">
                        <p className="text-[10px] uppercase text-bb-muted font-bold mb-1">Monthly P/L</p>
                        <p className={`text-lg font-bold ${monthPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {monthPL >= 0 ? '+' : ''}${monthPL.toFixed(2)}
                        </p>
                    </div>
                    <div className="w-[1px] bg-bb-border"></div>
                    <div className="text-center">
                        <p className="text-[10px] uppercase text-bb-muted font-bold mb-1">Win Rate</p>
                        <p className="text-lg font-bold text-bb-text">{monthWinRate}%</p>
                    </div>
                    <div className="w-[1px] bg-bb-border"></div>
                    <div className="text-center">
                        <p className="text-[10px] uppercase text-bb-muted font-bold mb-1">Trades</p>
                        <p className="text-lg font-bold text-bb-text">{monthTrades.length}</p>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="p-6 flex-1">
                <div className="grid grid-cols-7 gap-4 mb-2">
                    {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
                        <div key={d} className="text-center text-xs font-bold text-bb-muted py-2">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-4 auto-rows-[100px]">
                    {blanks.map((_, i) => (
                        <div key={`blank-${i}`} className="bg-bb-bg/30 rounded-xl border border-bb-border/30 border-dashed"></div>
                    ))}
                    
                    {days.map(day => {
                        const data = getDayData(day);
                        let bgClass = "bg-bb-bg border-bb-border hover:border-bb-muted/50";
                        let textClass = "text-bb-muted";
                        
                        if (data) {
                            if (data.pl > 0) {
                                bgClass = "bg-green-500/10 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 shadow-sm";
                                textClass = "text-green-500";
                            } else if (data.pl < 0) {
                                bgClass = "bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 shadow-sm";
                                textClass = "text-red-500";
                            } else {
                                bgClass = "bg-bb-card border-bb-border text-bb-text";
                                textClass = "text-bb-text";
                            }
                        }

                        return (
                            <div key={day} className={`${bgClass} border rounded-xl p-3 flex flex-col justify-between transition-all duration-200 group relative`}>
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-bb-muted group-hover:text-bb-text transition-colors">{day}</span>
                                    {data && (
                                        <span className="text-[10px] bg-bb-bg/80 px-1.5 py-0.5 rounded text-bb-muted border border-bb-border backdrop-blur-sm">
                                            {data.count}t
                                        </span>
                                    )}
                                </div>
                                
                                {data ? (
                                    <div className="text-center">
                                        <span className={`text-sm md:text-base font-bold ${textClass}`}>
                                            {data.pl > 0 ? '+' : ''}${Math.round(data.pl)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex-1"></div>
                                )}
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
  
  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Top KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard label="Balance" value={`$${stats.balance.toFixed(2)}`} icon={Wallet} />
        <KPICard 
            label="Net P/L" 
            value={`$${stats.netPL.toFixed(2)}`} 
            icon={DollarSign} 
            trend={stats.netPL >= 0 ? 'up' : 'down'} 
            subValue={stats.netPL >= 0 ? 'Profit' : 'Loss'} 
        />
        <KPICard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={TrendingUp} />
        <KPICard label="Profit Factor" value={stats.profitFactor.toFixed(2)} icon={Scale} />
        <KPICard label="Exp. Value" value={`$${stats.ev.toFixed(2)}`} icon={Activity} />
      </div>

      {/* 2. Middle Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
        {/* Equity Curve */}
        <div className="lg:col-span-2 bg-bb-card p-6 rounded-2xl border border-bb-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h4 className="text-lg font-bold text-bb-text flex items-center gap-2">
                    <TrendingUp size={20} className="text-bb-accent" />
                    Equity Curve
                </h4>
                <p className="text-xs text-bb-muted mt-1">Account growth over time</p>
            </div>
            <div className="bg-bb-accent/10 text-bb-accent px-3 py-1 rounded-full text-xs font-bold border border-bb-accent/20">
                Live Account
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                    stroke="var(--color-muted)"
                    tick={{fontSize: 11, fill: 'var(--color-muted)'}}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                />
                <YAxis 
                    stroke="var(--color-muted)" 
                    tick={{fontSize: 11, fill: 'var(--color-muted)'}} 
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                    tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: 'var(--color-accent)' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    formatter={(val: number) => [`$${val.toFixed(2)}`, 'Equity']}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--color-accent)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-card)', stroke: 'var(--color-accent)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win/Loss Donut */}
        <div className="bg-bb-card p-6 rounded-2xl border border-bb-border shadow-sm flex flex-col">
            <h4 className="text-lg font-bold text-bb-text mb-2 flex items-center gap-2">
                <Scale size={20} className="text-bb-accent"/> Win Ratio
            </h4>
            <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={winLossData}
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {winLossData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={5} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-bold text-bb-text">{stats.winRate.toFixed(0)}%</span>
                    <span className="text-xs text-bb-muted uppercase tracking-wide">Win Rate</span>
                </div>
            </div>
        </div>
      </div>

      {/* 3. Bottom Section: Large Calendar */}
      <div className="min-h-[600px]">
          <CalendarWidget trades={data.trades} />
      </div>
    </div>
  );
};