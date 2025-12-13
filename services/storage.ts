import { Trade, Transaction, AppState } from '../types';

const STORAGE_KEY = 'ALPHA_ONE_DATA_V1';

const INITIAL_STATE: AppState = {
  trades: [],
  accounting: [],
  balance: 0
};

// Robust ID generator
const generateId = () => {
    // Ensure we always return a string
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const getStoredData = (): AppState => {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    let data: AppState = dataStr ? JSON.parse(dataStr) : INITIAL_STATE;

    // Migration: Ensure all items have IDs (Fixes delete issue for legacy data)
    let hasChanges = false;
    if (data.trades) {
        data.trades = data.trades.map(t => {
            if (!t.id) { hasChanges = true; return { ...t, id: generateId() }; }
            return t;
        });
    } else {
        data.trades = [];
    }

    if (data.accounting) {
        data.accounting = data.accounting.map(a => {
            if (!a.id) { hasChanges = true; return { ...a, id: generateId() }; }
            return a;
        });
    } else {
        data.accounting = [];
    }
    
    if (hasChanges) saveData(data);

    return data;
  } catch (e) {
      console.error("Storage Error", e);
      return INITIAL_STATE;
  }
};

export const saveData = (data: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- TRADES ---

export const addTrade = (trade: Omit<Trade, 'id'>): Trade => {
  const data = getStoredData();
  const newTrade = { ...trade, id: generateId() };
  data.trades.push(newTrade);
  saveData(data);
  return newTrade;
};

export const updateTrade = (trade: Trade) => {
  const data = getStoredData();
  const index = data.trades.findIndex(t => t.id === trade.id);
  if (index !== -1) {
    data.trades[index] = trade;
    saveData(data);
  }
};

export const deleteTrade = (id: string) => {
  const data = getStoredData();
  const initialLength = data.trades.length;
  data.trades = data.trades.filter(t => t.id !== id);
  
  if (data.trades.length !== initialLength) {
      saveData(data);
  } else {
      console.warn("Trade ID not found for deletion:", id);
  }
};

// --- ACCOUNTING ---

export const addTransaction = (transaction: Omit<Transaction, 'id'>): Transaction => {
  const data = getStoredData();
  const newTx = { ...transaction, id: generateId() };
  data.accounting.push(newTx);
  saveData(data);
  return newTx;
};

export const updateTransaction = (transaction: Transaction) => {
    const data = getStoredData();
    const index = data.accounting.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
        data.accounting[index] = transaction;
        saveData(data);
    }
};

export const deleteTransaction = (id: string) => {
    const data = getStoredData();
    const initialLength = data.accounting.length;
    data.accounting = data.accounting.filter(t => t.id !== id);
    
    if (data.accounting.length !== initialLength) {
        saveData(data);
    }
};

// --- KPI ---

export const calculateKPIs = (data: AppState) => {
    // Basic calcs
    const wins = data.trades.filter(t => t.pl > 0);
    const losses = data.trades.filter(t => t.pl <= 0);
    
    const totalPL = data.trades.reduce((sum, t) => sum + t.pl, 0);
    const totalDeposits = data.accounting.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = data.accounting.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalDeposits - totalWithdrawals + totalPL;
    
    const winRate = data.trades.length ? (wins.length / data.trades.length) * 100 : 0;
    
    const grossWin = wins.reduce((s, t) => s + t.pl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pl, 0));
    const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
    
    // Expected Value
    const avgWin = wins.length ? grossWin / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const winPct = wins.length / data.trades.length || 0;
    const lossPct = losses.length / data.trades.length || 0;
    const ev = (avgWin * winPct) - (avgLoss * lossPct);

    return {
        balance,
        netPL: totalPL,
        winRate,
        profitFactor,
        ev,
        avgHold: 'N/A' 
    };
};