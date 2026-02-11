import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Transaction, 
  Category, 
  TransactionType, 
  AnimalSpecies, 
  AnimalLog, 
  PopulationChange, 
  Asset, 
  Liability, 
  InventoryItem, 
  InventoryMovement, 
  MovementType,
  AssetTerm,
  Account,
  AccountType,
  NavItemConfig
} from './types.ts';
import { INITIAL_CATEGORIES } from './constants.tsx';
import Dashboard from './components/Dashboard.tsx';
import TransactionList from './components/TransactionList.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import Reports from './components/Reports.tsx';
import Settings from './components/Settings.tsx';
import AnimalManager from './components/AnimalManager.tsx';
import AssetManager from './components/AssetManager.tsx';
import LiabilityManager from './components/LiabilityManager.tsx';
import InventoryManager from './components/InventoryManager.tsx';
import AccountRegistry from './components/AccountRegistry.tsx';
import SignIn from './components/SignIn.tsx';
import { getFinancialAdvice } from './services/geminiService.ts';

interface User {
  name: string;
  email: string;
}

// Map of all available modules and their icons
const MODULE_REGISTRY = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { id: 'accounts', label: 'Registry', path: '/accounts', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  { id: 'income', label: 'Income', path: '/income', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: 'expenses', label: 'Expenses', path: '/expenses', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: 'animals', label: 'Animals', path: '/animals', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  { id: 'inventory', label: 'Inventory', path: '/inventory', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { id: 'assets', label: 'Assets', path: '/assets', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { id: 'liabilities', label: 'Liabilities', path: '/liabilities', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { id: 'reports', label: 'Reports', path: '/reports', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { id: 'settings', label: 'Settings', path: '/settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

const NavLink: React.FC<{ to: string, children: React.ReactNode, icon: React.ReactNode, onClick?: () => void, isCollapsed: boolean }> = ({ to, children, icon, onClick, isCollapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all relative group/nav ${
        isActive 
          ? 'bg-emerald-600 text-white shadow-md' 
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <div className={`flex-shrink-0 transition-all ${isCollapsed ? 'mx-auto' : ''}`}>
        {icon}
      </div>
      <span className={`font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
        {children}
      </span>
      {isCollapsed && (
        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-opacity z-[60] whitespace-nowrap shadow-xl">
          {children}
        </div>
      )}
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  sidebarConfig: NavItemConfig[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Fixed: Using a regular function for Layout to resolve potential FC assignment issues in some TSX environments
function Layout({ children, user, onLogout, sidebarConfig, isCollapsed, onToggleCollapse }: LayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const getTitle = () => {
    const active = MODULE_REGISTRY.find(m => m.path === location.pathname);
    return active ? active.label : 'Financial Overview';
  };

  const closeSidebar = () => setSidebarOpen(false);

  // Filter and sort modules based on config
  const enabledModules = useMemo(() => {
    return sidebarConfig
      .filter(c => c.visible)
      .map(c => MODULE_REGISTRY.find(m => m.id === c.id))
      .filter((m): m is typeof MODULE_REGISTRY[number] => !!m);
  }, [sidebarConfig]);

  return (
    <div className="flex min-h-screen">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 bg-white/95 backdrop-blur-md border-r border-slate-200 p-6 flex flex-col z-50 transition-all duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-screen print:hidden
        ${isCollapsed ? 'lg:w-24' : 'lg:w-64'}
      `}>
        <div className={`mb-10 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 flex-shrink-0 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="7" width="4" height="11" rx="2" fill="currentColor"/>
                <path d="M8 18C8 18 5 13 6 9C7 5 10 3 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 18C16 18 19 13 18 9C17 5 14 3 14 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className={`text-xl font-bold text-slate-800 tracking-tight transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Farm Accounts</span>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-slate-500 hover:text-slate-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={onToggleCollapse} 
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 hover:bg-emerald-600 hover:text-white transition-all absolute -right-3 top-16 shadow-md border border-white`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {enabledModules.map((module: any) => (
            <NavLink key={module.id} to={module.path} onClick={closeSidebar} icon={module.icon} isCollapsed={isCollapsed}>
              {module.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className={`flex items-center space-x-3 mb-4 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-700 font-bold text-xs uppercase">
              {user.name.charAt(0)}
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            {!isCollapsed && (
              <button 
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                title="Log out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            )}
          </div>
          <div className={`p-4 bg-emerald-50 rounded-xl transition-all duration-300 ${isCollapsed ? 'p-2 flex justify-center' : ''}`}>
            {isCollapsed ? (
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Gemini Active" />
            ) : (
              <>
                <p className="text-xs text-emerald-700 font-bold uppercase mb-1 tracking-wider">Field Insights</p>
                <p className="text-[10px] text-emerald-600 leading-snug">Gemini 3 Flash Pro active.</p>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 transition-all duration-300">
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between lg:hidden print:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-800 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900">{getTitle()}</h1>
          <button 
            onClick={onLogout}
            className="p-2 -mr-2 text-slate-400 hover:text-rose-600 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </header>

        <header className="hidden lg:flex mb-8 justify-between items-center px-8 pt-8 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{getTitle()}</h1>
            <p className="text-slate-500 text-sm">Managing your farm's financial harvest.</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-500 bg-white/50 backdrop-blur px-3 py-1 rounded-full">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <div className="p-4 lg:p-8 pt-4">
          {children}
        </div>
      </main>
    </div>
  );
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sidebarConfig, setSidebarConfig] = useState<NavItemConfig[]>(MODULE_REGISTRY.map(m => ({ id: m.id, visible: true })));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [animalSpecies, setAnimalSpecies] = useState<AnimalSpecies[]>([]);
  const [animalLogs, setAnimalLogs] = useState<AnimalLog[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);

  // Storage key helper scoped by email
  const getScopedKey = (key: string) => user ? `${user.email}:${key}` : null;

  // Load user-specific data whenever the user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('active_user', JSON.stringify(user));
      
      // Fixed: Using a function declaration to avoid mis-parsing <T> as JSX in TSX environments
      function load<T>(key: string, defaultValue: T): T {
        const scoped = getScopedKey(key);
        if (!scoped) return defaultValue;
        const saved = localStorage.getItem(scoped);
        return saved ? JSON.parse(saved) : defaultValue;
      }

      setTransactions(load<Transaction[]>('transactions', []));
      setCategories(load<Category[]>('categories', INITIAL_CATEGORIES));
      setAccounts(load<Account[]>('accounts', []));
      setSidebarConfig(load<NavItemConfig[]>('sidebar_config', MODULE_REGISTRY.map(m => ({ id: m.id, visible: true }))));
      setIsSidebarCollapsed(load<boolean>('sidebar_collapsed', false));
      setAnimalSpecies(load<AnimalSpecies[]>('animal_species', []));
      setAnimalLogs(load<AnimalLog[]>('animal_logs', []));
      setInventoryItems(load<InventoryItem[]>('inventory_items', []));
      setInventoryMovements(load<InventoryMovement[]>('inventory_movements', []));
      setAssets(load<Asset[]>('assets', []));
      setLiabilities(load<Liability[]>('liabilities', []));
      setAiAdvice(null); // Reset advice for new user
    } else {
      localStorage.removeItem('active_user');
    }
  }, [user]);

  // Persistence effects - only run if a user is active
  useEffect(() => { if (user) { const key = getScopedKey('transactions'); if (key) localStorage.setItem(key, JSON.stringify(transactions)); } }, [transactions, user]);
  useEffect(() => { if (user) { const key = getScopedKey('categories'); if (key) localStorage.setItem(key, JSON.stringify(categories)); } }, [categories, user]);
  useEffect(() => { if (user) { const key = getScopedKey('accounts'); if (key) localStorage.setItem(key, JSON.stringify(accounts)); } }, [accounts, user]);
  useEffect(() => { if (user) { const key = getScopedKey('sidebar_config'); if (key) localStorage.setItem(key, JSON.stringify(sidebarConfig)); } }, [sidebarConfig, user]);
  useEffect(() => { if (user) { const key = getScopedKey('sidebar_collapsed'); if (key) localStorage.setItem(key, isSidebarCollapsed.toString()); } }, [isSidebarCollapsed, user]);
  useEffect(() => { if (user) { const key = getScopedKey('animal_species'); if (key) localStorage.setItem(key, JSON.stringify(animalSpecies)); } }, [animalSpecies, user]);
  useEffect(() => { if (user) { const key = getScopedKey('animal_logs'); if (key) localStorage.setItem(key, JSON.stringify(animalLogs)); } }, [animalLogs, user]);
  useEffect(() => { if (user) { const key = getScopedKey('inventory_items'); if (key) localStorage.setItem(key, JSON.stringify(inventoryItems)); } }, [inventoryItems, user]);
  useEffect(() => { if (user) { const key = getScopedKey('inventory_movements'); if (key) localStorage.setItem(key, JSON.stringify(inventoryMovements)); } }, [inventoryMovements, user]);
  useEffect(() => { if (user) { const key = getScopedKey('assets'); if (key) localStorage.setItem(key, JSON.stringify(assets)); } }, [assets, user]);
  useEffect(() => { if (user) { const key = getScopedKey('liabilities'); if (key) localStorage.setItem(key, JSON.stringify(liabilities)); } }, [liabilities, user]);

  const handleSignIn = (userData: User) => setUser(userData);
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) setUser(null);
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...newTx, id: crypto.randomUUID() }]);
    setShowAddForm(false);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  
  const handleAddAccount = (acc: Omit<Account, 'id'>) => setAccounts(prev => [...prev, { ...acc, id: crypto.randomUUID() }]);
  const handleUpdateAccount = (updated: Account) => setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
  const handleDeleteAccount = (id: string) => setAccounts(prev => prev.filter(a => a.id !== id));

  const handleAddCategory = (newCat: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...newCat, id: crypto.randomUUID() }]);
  const handleUpdateCategory = (updatedCat: Category) => setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
  const handleDeleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  const handleAddSpecies = (speciesData: Omit<AnimalSpecies, 'id' | 'count'>) => setAnimalSpecies(prev => [...prev, { ...speciesData, id: crypto.randomUUID(), count: 0 }]);
  const handleRecordAnimalLog = (logData: Omit<AnimalLog, 'id'>) => {
    setAnimalLogs(prev => [...prev, { ...logData, id: crypto.randomUUID() }]);
    setAnimalSpecies(prev => prev.map(s => {
      if (s.id === logData.speciesId) {
        const adjustment = (logData.type === PopulationChange.BOUGHT || logData.type === PopulationChange.BIRTH) ? logData.quantity : -logData.quantity;
        return { ...s, count: Math.max(0, s.count + adjustment) };
      }
      return s;
    }));
  };

  const handleAddInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'quantity'>) => {
    setInventoryItems(prev => [...prev, { ...itemData, id: crypto.randomUUID(), quantity: 0 }]);
  };

  const handleRecordInventoryMovement = (movementData: Omit<InventoryMovement, 'id'>) => {
    setInventoryMovements(prev => [...prev, { ...movementData, id: crypto.randomUUID() }]);
    setInventoryItems(prev => prev.map(item => {
      if (item.id === movementData.itemId) {
        const adj = movementData.type === MovementType.IN ? movementData.quantity : -movementData.quantity;
        return { ...item, quantity: Math.max(0, item.quantity + adj) };
      }
      return item;
    }));
  };

  const handleUpdateLiability = (updated: Liability) => {
    setLiabilities(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const handleUpdateAsset = (updated: Asset) => {
    setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const handleImportAllData = (data: any) => {
    if (data.transactions) setTransactions(data.transactions);
    if (data.categories) setCategories(data.categories);
    if (data.accounts) setAccounts(data.accounts);
    if (data.animalSpecies) setAnimalSpecies(data.animalSpecies);
    if (data.animalLogs) setAnimalLogs(data.animalLogs);
    if (data.inventoryItems) setInventoryItems(data.inventoryItems);
    if (data.inventoryMovements) setInventoryMovements(data.inventoryMovements);
    if (data.assets) setAssets(data.assets);
    if (data.liabilities) setLiabilities(data.liabilities);
    if (data.sidebarConfig) setSidebarConfig(data.sidebarConfig);
    if (data.isSidebarCollapsed !== undefined) setIsSidebarCollapsed(data.isSidebarCollapsed);
  };

  const fetchAdvice = async () => {
    if (transactions.length === 0) return;
    setIsGettingAdvice(true);
    const distinctMonths = new Set(transactions.map(t => t.date.substring(0, 7)));
    const monthCount = Math.max(1, distinctMonths.size);
    const averages: Record<string, number> = {};
    categories.forEach(cat => {
      const total = transactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0);
      averages[cat.name] = total / monthCount;
    });
    try {
      const advice = await getFinancialAdvice(transactions, categories, { averages, trends: [] });
      setAiAdvice(advice || null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGettingAdvice(false);
    }
  };

  if (!user) return <SignIn onSignIn={handleSignIn} />;

  return (
    <Router>
      <Layout 
        user={user} 
        onLogout={handleLogout} 
        sidebarConfig={sidebarConfig} 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        <Routes>
          <Route path="/" element={
            <div className="space-y-8">
              <Dashboard 
                transactions={transactions} 
                categories={categories} 
                animalSpecies={animalSpecies}
                animalLogs={animalLogs}
                inventoryItems={inventoryItems}
                inventoryMovements={inventoryMovements}
                assets={assets}
                liabilities={liabilities}
              />
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                    <h3 className="text-lg font-semibold text-slate-800">Field Strategy Analysis</h3>
                  </div>
                  <button onClick={fetchAdvice} disabled={isGettingAdvice} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                    {isGettingAdvice ? 'Consulting Gemini...' : 'Get Fresh Advice'}
                  </button>
                </div>
                {aiAdvice ? <div className="prose prose-slate max-w-none text-slate-600 text-sm">{aiAdvice.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}</div> : <p className="text-center py-8 text-slate-400">Consult AI for farm management insights.</p>}
              </div>
            </div>
          } />
          <Route path="/accounts" element={<AccountRegistry accounts={accounts} transactions={transactions} onAdd={handleAddAccount} onUpdate={handleUpdateAccount} onDelete={handleDeleteAccount} />} />
          <Route path="/income" element={
            <div className="space-y-6">
              <button onClick={() => { setShowAddForm(true); setEditingTransaction(null); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-700 transition-all">Add Income Entry</button>
              {(showAddForm || editingTransaction?.type === TransactionType.INCOME) && (
                <TransactionForm 
                  categories={categories} 
                  accounts={accounts}
                  onSubmit={editingTransaction ? (tx) => handleUpdateTransaction({ ...tx, id: editingTransaction.id }) : handleAddTransaction} 
                  onCancel={() => { setShowAddForm(false); setEditingTransaction(null); }} 
                  fixedType={TransactionType.INCOME}
                  initialData={editingTransaction || undefined}
                />
              )}
              <TransactionList 
                transactions={transactions.filter(t => t.type === TransactionType.INCOME)} 
                categories={categories} 
                accounts={accounts}
                onDelete={handleDeleteTransaction} 
                onEdit={(tx) => { setEditingTransaction(tx); setShowAddForm(false); }}
              />
            </div>
          } />
          <Route path="/expenses" element={
            <div className="space-y-6">
              <button onClick={() => { setShowAddForm(true); setEditingTransaction(null); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all">Add Expense Entry</button>
              {(showAddForm || editingTransaction?.type === TransactionType.EXPENSE) && (
                <TransactionForm 
                  categories={categories} 
                  accounts={accounts}
                  onSubmit={editingTransaction ? (tx) => handleUpdateTransaction({ ...tx, id: editingTransaction.id }) : handleAddTransaction} 
                  onCancel={() => { setShowAddForm(false); setEditingTransaction(null); }} 
                  fixedType={TransactionType.EXPENSE}
                  initialData={editingTransaction || undefined}
                />
              )}
              <TransactionList 
                transactions={transactions.filter(t => t.type === TransactionType.EXPENSE)} 
                categories={categories} 
                accounts={accounts}
                onDelete={handleDeleteTransaction} 
                onEdit={(tx) => { setEditingTransaction(tx); setShowAddForm(false); }}
              />
            </div>
          } />
          <Route path="/animals" element={<AnimalManager species={animalSpecies} logs={animalLogs} onAddSpecies={handleAddSpecies} onRecordLog={handleRecordAnimalLog} onDeleteSpecies={(id) => setAnimalSpecies(s => s.filter(x => x.id !== id))} onUpdateSpecies={(s) => setAnimalSpecies(prev => prev.map(x => x.id === s.id ? s : x))} />} />
          <Route path="/inventory" element={<InventoryManager items={inventoryItems} movements={inventoryMovements} onAddItem={handleAddInventoryItem} onUpdateItem={(i) => setInventoryItems(prev => prev.map(x => x.id === i.id ? i : x))} onRecordMovement={handleRecordInventoryMovement} onDeleteItem={(id) => setInventoryItems(i => i.filter(x => x.id !== id))} />} />
          <Route path="/assets" element={<AssetManager assets={assets} animalSpecies={animalSpecies} inventoryItems={inventoryItems} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} onDelete={(id) => setAssets(a => a.filter(x => x.id !== id))} onUpdate={handleUpdateAsset} />} />
          <Route path="/liabilities" element={<LiabilityManager liabilities={liabilities} categories={categories} accounts={accounts} onAdd={(l) => setLiabilities(prev => [...prev, { ...l, id: crypto.randomUUID() }])} onDelete={(id) => setLiabilities(l => l.filter(x => x.id !== id))} onUpdate={handleUpdateLiability} onAddTransaction={handleAddTransaction} />} />
          <Route path="/settings" element={<Settings categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} user={user} transactions={transactions} accounts={accounts} animalSpecies={animalSpecies} animalLogs={animalLogs} inventoryItems={inventoryItems} inventoryMovements={inventoryMovements} assets={assets} liabilities={liabilities} onImportData={handleImportAllData} sidebarConfig={sidebarConfig} onUpdateSidebar={setSidebarConfig} isSidebarCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />} />
          <Route path="/reports" element={<Reports transactions={transactions} categories={categories} animalSpecies={animalSpecies} assets={assets} liabilities={liabilities} />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;