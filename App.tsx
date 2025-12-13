import React, { useEffect, useState } from 'react';
import { LayoutDashboard, BookOpen, Wallet, BrainCircuit, Activity, Moon, Sun, Settings, Key, Save, X } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TradeLog } from './components/TradeLog';
import { Accounting } from './components/Accounting';
import { AICoach } from './components/AICoach';
import { TradeModal } from './components/TradeModal';
import { AppState, Trade } from './types';
import { getStoredData, addTrade, deleteTrade, updateTrade } from './services/storage';

const App = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log' | 'accounting' | 'ai'>('dashboard');
  const [data, setData] = useState<AppState>({ trades: [], accounting: [], balance: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isDark, setIsDark] = useState(true);
  
  // Settings State
  const [apiKey, setApiKey] = useState('');

  const refreshData = () => {
    setData(getStoredData());
  };

  useEffect(() => {
    refreshData();
    
    // Check theme
    if (document.documentElement.classList.contains('dark')) {
        setIsDark(true);
    } else {
        setIsDark(false);
    }

    // Check API Key
    const storedKey = localStorage.getItem('ALPHA_GEMINI_KEY');
    if (storedKey) setApiKey(storedKey);
    else {
        // Optional: Open settings automatically if no key found on first load
        // setIsSettingsOpen(true); 
    }
  }, []);

  const toggleTheme = () => {
      const html = document.documentElement;
      if (isDark) {
          html.classList.remove('dark');
          localStorage.setItem('theme', 'light');
          setIsDark(false);
      } else {
          html.classList.add('dark');
          localStorage.setItem('theme', 'dark');
          setIsDark(true);
      }
  };

  const saveApiKey = () => {
      localStorage.setItem('ALPHA_GEMINI_KEY', apiKey);
      setIsSettingsOpen(false);
      alert("API Key Saved Successfully!");
  };

  const handleSaveTrade = (tradeData: Trade | Omit<Trade, 'id'>) => {
    if ('id' in tradeData) {
        updateTrade(tradeData as Trade);
    } else {
        addTrade(tradeData);
    }
    setIsModalOpen(false);
    setEditingTrade(null);
    refreshData();
  };

  const handleEditTrade = (trade: Trade) => {
      setEditingTrade(trade);
      setIsModalOpen(true);
  };

  const handleDeleteTrade = (id: string) => {
      setTimeout(() => {
        if(window.confirm('Are you sure you want to delete this trade?')) {
            deleteTrade(id);
            refreshData();
        }
      }, 50);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingTrade(null);
  };

  const NavButton = ({ tab, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
        activeTab === tab 
          ? 'bg-bb-card text-bb-accent shadow-sm border border-bb-border scale-105' 
          : 'text-bb-muted hover:text-bb-text hover:bg-bb-card/50'
      }`}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const isPageScrollable = activeTab === 'dashboard' || activeTab === 'accounting';

  return (
    <div className="flex flex-col h-screen bg-bb-bg text-bb-text transition-colors duration-300">
      {/* Header */}
      <header className="h-16 border-b border-bb-border flex items-center justify-between px-6 bg-bb-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-bb-accent rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-bb-accent/20">
            A1
          </div>
          <h1 className="font-semibold text-lg tracking-wide hidden md:block">
            ALPHA<span className="text-bb-muted font-light">ONE</span>
          </h1>
        </div>
        
        <nav className="flex gap-1 bg-bb-bg/50 p-1 rounded-xl border border-bb-border shadow-inner">
          <NavButton tab="dashboard" label="Dashboard" icon={LayoutDashboard} />
          <NavButton tab="log" label="Journal" icon={BookOpen} />
          <NavButton tab="accounting" label="Accounting" icon={Wallet} />
          <NavButton tab="ai" label="AI Coach" icon={BrainCircuit} />
        </nav>

        <div className="flex items-center gap-3">
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-bb-bg text-bb-muted hover:text-bb-accent transition-colors"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-bb-bg text-bb-muted hover:text-bb-accent transition-colors"
                title="Settings & API Key"
            >
                <Settings size={18} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bb-bg border border-bb-border">
                <Activity size={12} className="text-green-500 animate-pulse" />
                <span className="text-xs text-bb-muted font-mono">LIVE</span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 p-4 md:p-6 relative ${isPageScrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <div className={`max-w-7xl mx-auto animate-in fade-in duration-300 ${isPageScrollable ? '' : 'h-full'}`}>
            {activeTab === 'dashboard' && <Dashboard data={data} />}
            {activeTab === 'log' && <TradeLog trades={data.trades} onDelete={handleDeleteTrade} onEdit={handleEditTrade} onAddClick={() => setIsModalOpen(true)} />}
            {activeTab === 'accounting' && <Accounting transactions={data.accounting} onUpdate={refreshData} />}
            {activeTab === 'ai' && <AICoach trades={data.trades} />}
        </div>
      </main>

      {/* Trade Modal */}
      {isModalOpen && (
        <TradeModal onClose={handleCloseModal} onSave={handleSaveTrade} initialData={editingTrade} />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-bb-card border border-bb-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-bb-border flex justify-between items-center bg-bb-bg/50">
                      <h3 className="font-bold text-bb-text text-lg flex items-center gap-2">
                          <Settings size={18} className="text-bb-accent" /> Settings
                      </h3>
                      <button onClick={() => setIsSettingsOpen(false)} className="text-bb-muted hover:text-bb-text transition"><X size={20} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                          <p className="text-xs text-blue-400 leading-relaxed">
                              <strong>Note:</strong> AlphaOne runs entirely in your browser. Your data is stored on this device, and your API key is saved locally.
                          </p>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-bb-muted uppercase mb-2">Google Gemini API Key</label>
                          <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Key size={14} className="text-bb-muted" />
                              </div>
                              <input 
                                  type="password" 
                                  value={apiKey}
                                  onChange={(e) => setApiKey(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2.5 bg-bb-bg border border-bb-border rounded-lg text-sm text-bb-text focus:border-bb-accent focus:outline-none transition-colors"
                                  placeholder="AIzaSy..."
                              />
                          </div>
                          <p className="text-[10px] text-bb-muted mt-2">
                              Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-bb-accent hover:underline">Google AI Studio</a>.
                          </p>
                      </div>
                  </div>
                  <div className="p-4 border-t border-bb-border bg-bb-bg/30 flex justify-end">
                      <button onClick={saveApiKey} className="bg-bb-accent hover:bg-bb-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
                          <Save size={16} /> Save Settings
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;