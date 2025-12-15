import { useEffect, useState } from 'react';
import { LayoutDashboard, BookOpen, Wallet, Moon, Sun, BarChart3, Compass } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TradeLog } from './components/TradeLog';
import { Accounting } from './components/Accounting';
import { Resources } from './components/AICoach';
import { TradeModal } from './components/TradeModal';
import { AppState, Trade } from './types';
import { getStoredData, addTrade, deleteTrade, updateTrade } from './services/storage';

const App = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log' | 'accounting' | 'resources'>('dashboard');
  const [data, setData] = useState<AppState>({ trades: [], accounting: [], balance: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isDark, setIsDark] = useState(true);
  
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
      className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
        activeTab === tab 
          ? 'text-white bg-bb-accent shadow-lg shadow-bb-accent/25' 
          : 'text-bb-muted hover:text-bb-text hover:bg-bb-card'
      }`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const isPageScrollable = activeTab === 'dashboard' || activeTab === 'accounting' || activeTab === 'resources';

  return (
    <div className="flex flex-col h-screen bg-bb-bg text-bb-text transition-colors duration-300 font-sans selection:bg-bb-accent/30 selection:text-white">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 sticky top-0 z-30 bg-bb-bg/80 backdrop-blur-xl border-b border-bb-border/50">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-bb-accent to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative w-10 h-10 bg-bb-card rounded-xl flex items-center justify-center text-bb-accent font-bold border border-bb-border shadow-sm">
              <BarChart3 size={24} />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-bb-text to-bb-muted">
              AlphaOne
            </h1>
            <p className="text-[10px] font-medium text-bb-muted uppercase tracking-widest">Journal & Coach</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-1 bg-bb-card/50 p-1.5 rounded-2xl border border-bb-border/50 shadow-inner">
          <NavButton tab="dashboard" label="Dashboard" icon={LayoutDashboard} />
          <NavButton tab="log" label="Journal" icon={BookOpen} />
          <NavButton tab="accounting" label="Accounting" icon={Wallet} />
          <NavButton tab="resources" label="Resources" icon={Compass} />
        </nav>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-green-500 font-bold tracking-wide">LIVE</span>
            </div>

            <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-bb-card text-bb-muted hover:text-bb-text transition-all border border-transparent hover:border-bb-border"
                title={isDark ? "Light Mode" : "Dark Mode"}
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 p-4 md:p-8 relative ${isPageScrollable ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'}`}>
        <div className={`max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 ${isPageScrollable ? '' : 'h-full'}`}>
            {activeTab === 'dashboard' && <Dashboard data={data} />}
            {activeTab === 'log' && <TradeLog trades={data.trades} onDelete={handleDeleteTrade} onEdit={handleEditTrade} onAddClick={() => setIsModalOpen(true)} />}
            {activeTab === 'accounting' && <Accounting transactions={data.accounting} onUpdate={refreshData} />}
            {activeTab === 'resources' && <Resources />}
        </div>
      </main>

      {/* Mobile Nav (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bb-card border-t border-bb-border z-30 flex items-center justify-around px-4">
          <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded-lg ${activeTab === 'dashboard' ? 'text-bb-accent' : 'text-bb-muted'}`}><LayoutDashboard size={24} /></button>
          <button onClick={() => setActiveTab('log')} className={`p-2 rounded-lg ${activeTab === 'log' ? 'text-bb-accent' : 'text-bb-muted'}`}><BookOpen size={24} /></button>
          <button onClick={() => setActiveTab('accounting')} className={`p-2 rounded-lg ${activeTab === 'accounting' ? 'text-bb-accent' : 'text-bb-muted'}`}><Wallet size={24} /></button>
          <button onClick={() => setActiveTab('resources')} className={`p-2 rounded-lg ${activeTab === 'resources' ? 'text-bb-accent' : 'text-bb-muted'}`}><Compass size={24} /></button>
      </div>

      {/* Trade Modal */}
      {isModalOpen && (
        <TradeModal onClose={handleCloseModal} onSave={handleSaveTrade} initialData={editingTrade} />
      )}
    </div>
  );
};

export default App;
