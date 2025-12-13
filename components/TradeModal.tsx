import React, { useState, useEffect } from 'react';
import { X, Wand2, Upload } from 'lucide-react';
import { getStrategyTagSuggestion } from '../services/gemini';
import { Trade } from '../types';

interface TradeModalProps {
  onClose: () => void;
  onSave: (trade: Trade | Omit<Trade, 'id'>) => void;
  initialData?: Trade | null;
}

export const TradeModal: React.FC<TradeModalProps> = ({ onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
      pair: '',
      direction: 'Long',
      date: new Date().toISOString().slice(0, 16),
      strategy: '',
      risk: '',
      pl: '',
      notes: ''
  });
  const [image, setImage] = useState<string | undefined>(undefined);
  const [loadingTag, setLoadingTag] = useState(false);

  useEffect(() => {
    if (initialData) {
        setFormData({
            pair: initialData.pair,
            direction: initialData.direction,
            date: initialData.date, // Ensure format matches datetime-local
            strategy: initialData.strategy,
            risk: (initialData.risk ?? '').toString(),
            pl: (initialData.pl ?? '').toString(),
            notes: initialData.notes
        });
        setImage(initialData.image);
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

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const tradeData = {
          ...formData,
          direction: formData.direction as 'Long' | 'Short',
          risk: parseFloat(formData.risk) || 0,
          pl: parseFloat(formData.pl) || 0,
          image
      };

      if (initialData) {
          onSave({ ...tradeData, id: initialData.id });
      } else {
          onSave(tradeData);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-bb-card border border-gray-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-xl">
            <h3 className="font-bold text-white text-lg">{initialData ? 'Edit Trade' : 'Log New Trade'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="tradeForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">Pair</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-bb-accent focus:outline-none"
                        placeholder="EURUSD"
                        value={formData.pair}
                        onChange={e => setFormData({...formData, pair: e.target.value.toUpperCase()})}
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">Direction</label>
                    <select 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-bb-accent focus:outline-none"
                        value={formData.direction}
                        onChange={e => setFormData({...formData, direction: e.target.value})}
                    >
                        <option value="Long">Long (Buy)</option>
                        <option value="Short">Short (Sell)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">Date</label>
                    <input 
                        type="datetime-local" 
                        required 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-bb-accent focus:outline-none"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">Strategy</label>
                    <div className="flex gap-1">
                        <input 
                            type="text" 
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg rounded-r-none p-2.5 text-sm text-white focus:border-bb-accent focus:outline-none"
                            placeholder="Breakout"
                            value={formData.strategy}
                            onChange={e => setFormData({...formData, strategy: e.target.value})}
                        />
                        <button type="button" onClick={handleSuggestTag} disabled={loadingTag} className="bg-indigo-900/50 border border-indigo-700/50 border-l-0 rounded-r-lg px-3 hover:bg-indigo-800/50 transition text-indigo-300">
                            <Wand2 size={16} className={loadingTag ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">Risk ($)</label>
                    <input 
                        type="number" step="0.01" required 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-bb-accent focus:outline-none"
                        value={formData.risk}
                        onChange={e => setFormData({...formData, risk: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">P/L ($)</label>
                    <input 
                        type="number" step="0.01" required 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-bb-accent focus:outline-none"
                        value={formData.pl}
                        onChange={e => setFormData({...formData, pl: e.target.value})}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">Notes</label>
                    <textarea 
                        rows={3}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-bb-accent focus:outline-none resize-none"
                        placeholder="Execution details, psychology..."
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">Chart Image</label>
                    <div className="relative border border-dashed border-gray-600 rounded-lg p-6 text-center hover:bg-gray-800/50 transition group cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImage} className="absolute inset-0 opacity-0 cursor-pointer" />
                        {image ? (
                            <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Image Attached
                            </div>
                        ) : (
                            <div className="text-gray-500 text-sm">
                                <Upload className="mx-auto mb-2 text-gray-600 group-hover:text-gray-400 transition" size={24} />
                                <span className="group-hover:text-gray-300 transition">Click to upload chart screenshot</span>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3 rounded-b-xl">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancel</button>
            <button onClick={() => document.getElementById('tradeForm')?.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}))} className="px-6 py-2 bg-bb-accent hover:bg-indigo-600 rounded-lg text-white font-bold text-sm shadow-lg transition">{initialData ? 'Update Trade' : 'Save Trade'}</button>
        </div>
      </div>
    </div>
  );
};