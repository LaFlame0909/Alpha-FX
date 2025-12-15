import React, { useState, useEffect } from 'react';
import { Wand2, Upload, CheckSquare, ShieldCheck, AlertTriangle, LayoutList } from 'lucide-react';
import { getStrategyTagSuggestion } from '../services/gemini';
import { Trade } from '../types';

interface TradeModalProps {
  onClose: () => void;
  onSave: (trade: Trade | Omit<Trade, 'id'>) => void;
  initialData?: Trade | null;
}

const CHECKLIST_ITEMS = [
    { id: 'trend', text: "Is the higher timeframe trend aligned?" },
    { id: 'sr', text: "Price at key Support or Resistance level?" },
    { id: 'signal', text: "Valid candlestick entry signal present?" },
    { id: 'sl', text: "Stop Loss protected by market structure?" },
    { id: 'rr', text: "Risk-to-Reward ratio at least 1:2?" },
    { id: 'news', text: "No high-impact news in next 30 mins?" },
    { id: 'mind', text: "Mental state calm (No FOMO/Revenge)?" },
];

export const TradeModal: React.FC<TradeModalProps> = ({ onClose, onSave, initialData }) => {
  // Use local time for default date
  const getDefaultDate = () => {
    const now = new Date();
    // Offset to get local ISO-like string
    const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return local.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
      pair: '',
      direction: 'Long',
      date: getDefaultDate(),
      strategy: '',
      risk: '',
      pl: '',
      notes: ''
  });
  const [image, setImage] = useState<string | undefined>(undefined);
  const [loadingTag, setLoadingTag] = useState(false);
  
  // Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showChecklist, setShowChecklist] = useState(!initialData); 

  useEffect(() => {
    if (initialData) {
        setFormData({
            pair: initialData.pair,
            direction: initialData.direction,
            date: initialData.date, 
            strategy: initialData.strategy,
            risk: (initialData.risk ?? '').toString(),
            pl: (initialData.pl ?? '').toString(),
            notes: initialData.notes
        });
        setImage(initialData.image);
        
        // Restore checklist
        if (initialData.checklist) {
            const restoredChecks: Record<string, boolean> = {};
            initialData.checklist.forEach(id => { restoredChecks[id] = true; });
            setCheckedItems(restoredChecks);
        }
    }
  }, [initialData]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => setImage(ev.target?.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleSuggestTag = async () => {
      if (!formData.notes) return;
      setLoadingTag(true);
      const tag = await getStrategyTagSuggestion(formData.notes);
      setFormData(prev => ({ ...prev, strategy: tag }));
      setLoadingTag(false);
  };

  const toggleCheck = (id: string) => {
      setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const qualityScore = Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const tradeData = {
          ...formData,
          direction: formData.direction as 'Long' | 'Short',
          risk: parseFloat(formData.risk) || 0,
          pl: parseFloat(formData.pl) || 0,
          image,
          score: qualityScore,
          checklist: Object.keys(checkedItems).filter(k => checkedItems[k])
      };

      if (initialData) {
          onSave({ ...tradeData, id: initialData.id });
      } else {
          onSave(tradeData);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-bb-card border border-bb-border w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden transition-all">
        
        {/* Left Side: Trade Details Form */}
        <div className="flex-1 flex flex-col min-w-0 bg-bb-card">
            <div className="p-5 border-b border-bb-border flex justify-between items-center bg-bb-bg/50">
                <div className="flex items-center gap-3">
                    <div className="bg-bb-accent/10 p-2 rounded-lg text-bb-accent">
                        <LayoutList size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-bb-text text-lg">{initialData ? 'Edit Trade Log' : 'Log New Trade'}</h3>
                        <p className="text-xs text-bb-muted">Record your execution details</p>
                    </div>
                </div>
                <button onClick={() => setShowChecklist(!showChecklist)} className="md:hidden text-bb-accent text-sm font-medium border border-bb-accent/20 px-3 py-1 rounded-lg">
                    {showChecklist ? 'Hide Checklist' : 'Validator'}
                </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-bb-card">
                <form id="tradeForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-bb-muted uppercase tracking-wide">Pair</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full bg-bb-bg border border-bb-border rounded-xl p-3 text-sm text-bb-text focus:border-bb-accent focus:ring-1 focus:ring-bb-accent focus:outline-none transition-all"
                            placeholder="EURUSD"
                            value={formData.pair}
                            onChange={e => setFormData({...formData, pair: e.target.value.toUpperCase()})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-bb-muted uppercase tracking-wide">Direction</label>
                        <select 
                            className="w-full bg-bb-bg border border-bb-border rounded-xl p-3 text-sm text-bb-text focus:border-bb-accent focus:ring-1 focus:ring-bb-accent focus:outline-none transition-all"
                            value={formData.direction}
                            onChange={e => setFormData({...formData, direction: e.target.value})}
                        >
                            <option value="Long">Long (Buy)</option>
                            <option value="Short">Short (Sell)</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-bb-muted uppercase tracking-wide">Date</label>
                        <input 
                            type="datetime-local" 
                            required 
                            className="w-full bg-bb-bg border border-bb-border rounded-xl p-3 text-sm text-bb-text focus:border-bb-accent focus:ring-1 focus:ring-bb-accent focus:outline-none transition-all"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-bb-muted uppercase tracking-wide">Strategy</label>
                        <div className="flex gap-1">
                            <input 
                                type="text" 
                                className="flex-1 bg-bb-bg border border-bb-border rounded-l-xl p-3 text-sm text-bb-text focus:border-bb-accent focus:ring-1 focus:ring-bb-accent focus:outline-none transition-all"
                                placeholder="Breakout"
                                value={formData.strategy}
                                onChange={e => setFormData({...formData, strategy: e.target.value})}
                            />
                            <button type="button" onClick={handleSuggestTag} disabled={loadingTag} className="bg-bb-bg border border-bb-border border-l-0 rounded-r-xl px-3 hover:bg-bb-accent/5 hover:text-bb-accent transition text-bb-muted">
                                <Wand2 size={18} className={loadingTag ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-bb-muted uppercase tracking-wide">Risk ($)</label>
                        <input 
                            type="number" step="0.01" required 
                            className="w-full bg-bb-bg border border-bb-border rounded-xl p-3 text-sm text-bb-text focus:border-bb-accent focus:ring-1 focus:ring-bb-accent focus:outline-none transition-all"
                            value={formData.risk}
                            onChange={e => setFormData({...formData, risk: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-bb-muted uppercase tracking-wide">P/L ($)</label>
                        <input 
                            type="number" step="0.01" required 
                            className="w-full bg-bb-bg border border-bb-border rounded-xl p-3 text-sm text-bb-text focus:border-bb-accent focus:ring-1 focus:ring-bb-accent focus:outline-none transition-all"
                            value={formData.pl}
                            onChange={e => setFormData({...formData, pl: e.target.value})}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-bb-muted uppercase tracking-wide">Notes</label>
                        <textarea 
                            rows={3}
                            className="w-full bg-bb-bg border border-bb-border rounded-xl p-3 text-sm text-bb-text focus:border-bb-accent focus:ring-1 focus:ring-bb-accent focus:outline-none transition-all resize-none"
                            placeholder="Execution details, psychology..."
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-bb-muted uppercase tracking-wide">Chart Image</label>
                        <div className="relative border-2 border-dashed border-bb-border rounded-xl p-8 text-center hover:bg-bb-bg hover:border-bb-accent/50 transition-all group cursor-pointer">
                            <input type="file" accept="image/*" onChange={handleImage} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {image ? (
                                <div className="flex flex-col items-center justify-center gap-2 text-emerald-500 text-sm font-bold">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                         <CheckSquare size={20} />
                                    </div>
                                    Image Attached Successfully
                                </div>
                            ) : (
                                <div className="text-bb-muted text-sm flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-bb-bg border border-bb-border flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload className="text-bb-muted group-hover:text-bb-accent transition" size={20} />
                                    </div>
                                    <span className="font-medium group-hover:text-bb-text transition">Click to upload chart screenshot</span>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            <div className="p-5 border-t border-bb-border bg-bb-bg/50 flex justify-end gap-3 rounded-b-xl md:rounded-bl-xl md:rounded-br-none">
                <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-bb-muted hover:text-bb-text transition">Cancel</button>
                <button onClick={() => document.getElementById('tradeForm')?.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}))} className="px-6 py-2.5 bg-bb-accent hover:bg-bb-accent/90 rounded-xl text-white font-bold text-sm shadow-lg shadow-bb-accent/25 transition-all transform active:scale-95">{initialData ? 'Update Trade' : 'Save Trade'}</button>
            </div>
        </div>

        {/* Right Side: Trade Checklist / Validator */}
        <div className={`md:w-80 bg-bb-bg border-l border-bb-border flex flex-col transition-all duration-300 ${showChecklist ? 'h-auto border-t md:border-t-0' : 'h-0 md:h-auto overflow-hidden'}`}>
            <div className="p-5 border-b border-bb-border bg-bb-card flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-bb-text text-sm flex items-center gap-2">
                        <CheckSquare size={18} className="text-bb-accent" /> Setup Validator
                    </h4>
                    <p className="text-[10px] text-bb-muted mt-0.5">Discipline Score</p>
                </div>
                <div className={`text-xs font-extrabold px-3 py-1 rounded-lg border ${qualityScore >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : (qualityScore >= 50 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20')}`}>
                    {qualityScore}%
                </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-bb-bg">
                {/* Progress Bar */}
                <div className="w-full bg-bb-border h-1.5 rounded-full mb-6 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${qualityScore >= 80 ? 'bg-emerald-500' : (qualityScore >= 50 ? 'bg-amber-500' : 'bg-rose-500')}`} 
                        style={{ width: `${qualityScore}%` }}
                    ></div>
                </div>

                <div className="space-y-3">
                    {CHECKLIST_ITEMS.map(item => (
                        <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group select-none ${checkedItems[item.id] ? 'bg-bb-card border-bb-accent/40 shadow-sm' : 'hover:bg-bb-card border-transparent hover:border-bb-border'}`}>
                            <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checkedItems[item.id] ? 'bg-bb-accent border-bb-accent' : 'bg-bb-card border-bb-border group-hover:border-bb-muted'}`}>
                                {checkedItems[item.id] && <CheckSquare size={12} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={!!checkedItems[item.id]} onChange={() => toggleCheck(item.id)} />
                            <span className={`text-xs font-medium leading-relaxed transition-colors ${checkedItems[item.id] ? 'text-bb-text' : 'text-bb-muted group-hover:text-bb-text'}`}>{item.text}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="p-5 bg-bb-card border-t border-bb-border">
                {qualityScore === 100 ? (
                    <div className="flex items-center gap-3 text-emerald-600 text-xs font-bold p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <ShieldCheck size={20} className="flex-shrink-0" /> 
                        <span>High Probability Setup. <br/>You are clear to engage.</span>
                    </div>
                ) : qualityScore < 50 ? (
                    <div className="flex items-center gap-3 text-rose-500 text-xs font-bold p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                        <AlertTriangle size={20} className="flex-shrink-0" /> 
                        <span>Low Confluence. <br/>Review your plan before entry.</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-amber-500 text-xs font-bold p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <AlertTriangle size={20} className="flex-shrink-0" /> 
                        <span>Moderate Confluence. <br/>Proceed with caution.</span>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
