export interface Trade {
    id: string;
    pair: string;
    direction: 'Long' | 'Short';
    date: string; // ISO string
    strategy: string;
    risk: number;
    pl: number;
    notes: string;
    image?: string; // Base64
    score?: number; // 0-100
    checklist?: string[]; // IDs of checked items
  }
  
  export interface Transaction {
    id: string;
    type: 'Deposit' | 'Withdrawal';
    amount: number;
    date: string;
  }
  
  export interface AppState {
    trades: Trade[];
    accounting: Transaction[];
    balance: number;
  }
  
  export interface KPI {
    balance: number;
    netPL: number;
    winRate: number;
    profitFactor: number;
    ev: number;
    avgHold: string; // Placeholder for simplicity
  }
  
  export enum RESOURCE_MODE {
    PATTERNS = 'patterns',
    SESSIONS = 'sessions'
  }