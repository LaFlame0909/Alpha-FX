import React, { useState } from 'react';
import { Trade } from '../types';
import { Trash2, Image as ImageIcon, Plus, Edit2 } from 'lucide-react';

interface TradeLogProps {
  trades: Trade[];
  onDelete: (id: string) => void;
  onEdit: (trade: Trade) => void;
  onAddClick: () => void;
}

export const TradeLog: React.FC<TradeLogProps> = ({ trades, onDelete, onEdit, onAddClick }) => {
  const [viewImage, setViewImage] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDelete(id);
  }

  const handleEdit = (e: React.MouseEvent, trade: Trade) => {
      e.stopPropagation();
      onEdit(trade);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-bb-text">Trade Journal</h2>
        <button 
            onClick={onAddClick}
            className="bg-bb-accent hover:bg-bb-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-bb-accent/20 transition flex items-center gap-2"
        >
            <Plus size={16} /> Log Trade
        </button>
      </div>

      <div className="bg-bb-card border border-bb-border rounded-xl overflow-hidden flex-1 shadow-sm flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bb-bg/50 text-xs text-bb-muted sticky top-0 backdrop-blur-sm z-10 border-b border-bb-border">
              <tr>
                <th className="p-4 font-semibold uppercase tracking-wider">Date</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Pair</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Side</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Strategy</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-right">Risk ($)</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-right">P/L ($)</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-right">R-Mult</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-center">Chart</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-bb-border">
              {trades.length === 0 ? (
                  <tr>
                      <td colSpan={9} className="p-12 text-center text-bb-muted">
                        <div className="flex flex-col items-center gap-2 opacity-60">
                            <span className="text-lg">No trades logged yet</span>
                            <span className="text-xs">Click "Log Trade" to start tracking your journey.</span>
                        </div>
                      </td>
                  </tr>
              ) : (
                  trades.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => {
                    const r = t.risk > 0 ? (t.pl / t.risk).toFixed(2) : '0.00';
                    return (
                        <tr key={t.id} className="hover:bg-bb-bg/50 transition group">
                        <td className="p-4 text-xs text-bb-muted whitespace-nowrap">
                            <div className="font-bold text-bb-text">{new Date(t.date).toLocaleDateString()}</div>
                            <div>{new Date(t.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="p-4 font-bold text-bb-text">{t.pair}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.direction === 'Long' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                                {t.direction}
                            </span>
                        </td>
                        <td className="p-4"><span className="bg-bb-bg text-bb-text px-2 py-1 rounded text-xs border border-bb-border">{t.strategy}</span></td>
                        <td className="p-4 text-right text-bb-muted font-mono">${t.risk}</td>
                        <td className={`p-4 text-right font-bold font-mono ${t.pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {t.pl >= 0 ? '+' : ''}{t.pl}
                        </td>
                        <td className="p-4 text-right font-mono text-xs text-bb-muted">{r}R</td>
                        <td className="p-4 text-center">
                            {t.image ? (
                                <button onClick={() => setViewImage(t.image!)} className="text-bb-accent hover:text-bb-text transition">
                                    <ImageIcon size={16} />
                                </button>
                            ) : <span className="text-bb-muted opacity-30">-</span>}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                            <button onClick={(e) => handleEdit(e, t)} className="text-bb-muted hover:text-bb-accent transition p-1.5 hover:bg-bb-bg rounded" title="Edit Trade">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => handleDelete(e, t.id)} className="text-bb-muted hover:text-red-500 transition p-1.5 hover:bg-bb-bg rounded" title="Delete Trade">
                                <Trash2 size={14} />
                            </button>
                        </td>
                        </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewImage && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewImage(null)}>
              <img src={viewImage} className="max-w-full max-h-full rounded-lg shadow-2xl border border-gray-700" alt="Trade Setup" />
              <button className="absolute top-4 right-4 text-white hover:text-gray-300">Close</button>
          </div>
      )}
    </div>
  );
};