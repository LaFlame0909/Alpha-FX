import React, { useState } from 'react';
import { Transaction } from '../types';
import { addTransaction, deleteTransaction, updateTransaction } from '../services/storage';
import { Trash2, Edit2, X } from 'lucide-react';

interface AccountingProps {
  transactions: Transaction[];
  onUpdate: () => void;
}

export const Accounting: React.FC<AccountingProps> = ({ transactions, onUpdate }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [type, setType] = useState<'Deposit' | 'Withdrawal'>('Deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const resetForm = () => {
      setIsEditing(null);
      setType('Deposit');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
  };

  const handleEditClick = (t: Transaction) => {
      setIsEditing(t.id);
      setType(t.type);
      setAmount(t.amount.toString());
      setDate(t.date);
  };

  const handleDeleteClick = (id: string) => {
      setTimeout(() => {
        if(window.confirm("Are you sure you want to delete this transaction?")) {
            deleteTransaction(id);
            onUpdate();
            if (isEditing === id) resetForm();
        }
      }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;
    
    if (isEditing) {
        updateTransaction({
            id: isEditing,
            type,
            amount: parseFloat(amount),
            date
        });
    } else {
        addTransaction({
            type,
            amount: parseFloat(amount),
            date
        });
    }
    
    resetForm();
    onUpdate();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      <div className="bg-bb-card p-6 rounded-2xl border border-bb-border h-fit shadow-sm">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-bb-text text-lg">{isEditing ? 'Edit Transaction' : 'New Transaction'}</h3>
            {isEditing && (
                <button onClick={resetForm} className="text-bb-muted hover:text-bb-text text-xs flex items-center gap-1">
                    <X size={14} /> Cancel
                </button>
            )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-bb-muted mb-1 font-semibold uppercase">Type</label>
            <div className="grid grid-cols-2 gap-2 bg-bb-bg p-1 rounded-lg border border-bb-border">
                <button type="button" onClick={() => setType('Deposit')} className={`text-sm py-2 rounded-md transition font-medium ${type === 'Deposit' ? 'bg-green-600 text-white shadow' : 'text-bb-muted hover:text-bb-text'}`}>Deposit</button>
                <button type="button" onClick={() => setType('Withdrawal')} className={`text-sm py-2 rounded-md transition font-medium ${type === 'Withdrawal' ? 'bg-red-600 text-white shadow' : 'text-bb-muted hover:text-bb-text'}`}>Withdrawal</button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-bb-muted mb-1 font-semibold uppercase">Amount ($)</label>
            <input 
                type="number" 
                step="0.01" 
                required 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-bb-bg border border-bb-border rounded-lg p-3 text-sm text-bb-text focus:border-bb-accent focus:outline-none transition-colors placeholder:text-bb-muted/50"
                placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-bb-muted mb-1 font-semibold uppercase">Date</label>
            <input 
                type="date" 
                required 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-bb-bg border border-bb-border rounded-lg p-3 text-sm text-bb-text focus:border-bb-accent focus:outline-none transition-colors"
            />
          </div>
          <button type="submit" className={`w-full text-white font-bold py-3 rounded-lg transition shadow-lg mt-2 ${isEditing ? 'bg-bb-accent hover:bg-bb-accent/80' : 'bg-bb-accent hover:bg-bb-accent/80'}`}>
            {isEditing ? 'Update Transaction' : 'Record Transaction'}
          </button>
        </form>
      </div>

      <div className="md:col-span-2 bg-bb-card p-6 rounded-2xl border border-bb-border flex flex-col h-[600px] shadow-sm">
        <h3 className="font-bold mb-4 text-bb-text text-lg">Transaction History</h3>
        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-bb-muted uppercase border-b border-bb-border bg-bb-bg/50 sticky top-0 backdrop-blur-sm">
              <tr>
                  <th className="py-3 pl-2 font-semibold">Date</th>
                  <th className="py-3 font-semibold">Type</th>
                  <th className="py-3 text-right font-semibold">Amount</th>
                  <th className="py-3 text-right pr-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bb-border">
                {transactions.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-12 text-bb-muted opacity-60">No transactions recorded.</td></tr>
                )}
                {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                    <tr key={t.id} className={`hover:bg-bb-bg/50 transition ${isEditing === t.id ? 'bg-bb-accent/5' : ''}`}>
                        <td className="py-3 pl-2 text-bb-muted font-mono">{new Date(t.date).toLocaleDateString()}</td>
                        <td className={`py-3 font-medium ${t.type === 'Deposit' ? 'text-green-500' : 'text-red-500'}`}>{t.type}</td>
                        <td className="py-3 text-right font-bold text-bb-text font-mono">${t.amount.toFixed(2)}</td>
                        <td className="py-3 text-right pr-2 flex justify-end gap-2">
                            <button onClick={() => handleEditClick(t)} className="text-bb-muted hover:text-bb-accent p-1.5 hover:bg-bb-bg rounded transition" title="Edit">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteClick(t.id)} className="text-bb-muted hover:text-red-500 p-1.5 hover:bg-bb-bg rounded transition" title="Delete">
                                <Trash2 size={14} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
