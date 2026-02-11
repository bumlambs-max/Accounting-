import React, { useState } from 'react';
import { Category, TransactionType, Transaction, Account, AnimalSpecies, AnimalLog, InventoryItem, InventoryMovement, Asset, Liability, NavItemConfig } from '../types.ts';
import { COLORS } from '../constants.tsx';
import CategoryManager from './CategoryManager.tsx';

interface SettingsProps {
  // Category Props
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  // Data for Backup
  user: any;
  transactions: Transaction[];
  accounts: Account[];
  animalSpecies: AnimalSpecies[];
  animalLogs: AnimalLog[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  assets: Asset[];
  liabilities: Liability[];
  // Sidebar Props
  sidebarConfig: NavItemConfig[];
  onUpdateSidebar: (config: NavItemConfig[]) => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  // Bulk actions
  onImportData: (data: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  categories, onAddCategory, onUpdateCategory, onDeleteCategory,
  user, transactions, accounts, animalSpecies, animalLogs, inventoryItems, inventoryMovements, assets, liabilities,
  sidebarConfig, onUpdateSidebar, isSidebarCollapsed, onToggleCollapse,
  onImportData
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Section collapse states
  const [isDisplayOpen, setIsDisplayOpen] = useState(true);
  const [isSidebarLayoutOpen, setIsSidebarLayoutOpen] = useState(true);
  const [isDataMgmtOpen, setIsDataMgmtOpen] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);

  const handleExport = () => {
    const backupData = {
      version: '1.2',
      timestamp: new Date().toISOString(),
      user,
      transactions,
      categories,
      accounts,
      animalSpecies,
      animalLogs,
      inventoryItems,
      inventoryMovements,
      assets,
      liabilities,
      sidebarConfig,
      isSidebarCollapsed
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farm_ledger_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.transactions || !data.categories) {
          throw new Error('Invalid backup file format.');
        }

        if (window.confirm('Warning: Restoring from backup will replace ALL current data. Do you wish to proceed?')) {
          onImportData(data);
          alert('Data restored successfully!');
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse backup file.');
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const toggleVisibility = (id: string) => {
    const newConfig = sidebarConfig.map(item => 
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    onUpdateSidebar(newConfig);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newConfig = [...sidebarConfig];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newConfig.length) return;
    
    const temp = newConfig[index];
    newConfig[index] = newConfig[targetIndex];
    newConfig[targetIndex] = temp;
    
    onUpdateSidebar(newConfig);
  };

  const SectionHeader = ({ icon, title, isOpen, onToggle }: { icon: React.ReactNode, title: string, isOpen: boolean, onToggle: () => void }) => (
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between mb-6 group focus:outline-none"
    >
      <div className={`
        flex items-center space-x-3 px-5 py-2.5 rounded-full border transition-all duration-300
        bg-white border-slate-200 shadow-sm
        group-hover:bg-emerald-50 group-hover:border-emerald-300 group-hover:shadow-md group-hover:shadow-emerald-100/50
      `}>
        <div className="text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-slate-700 tracking-tight group-hover:text-emerald-800 transition-colors whitespace-nowrap">
          {title}
        </h2>
      </div>
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0
        bg-white border border-slate-200 text-slate-400
        group-hover:bg-emerald-100 group-hover:text-emerald-600 group-hover:border-emerald-300 group-hover:shadow-md group-hover:shadow-emerald-100
      `}>
        <svg 
          className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Preferences Section */}
      <section>
        <SectionHeader 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          title="Display Preferences"
          isOpen={isDisplayOpen}
          onToggle={() => setIsDisplayOpen(!isDisplayOpen)}
        />
        
        {isDisplayOpen && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <p className="font-bold text-slate-800">Compact Sidebar</p>
              <p className="text-sm text-slate-500">Collapse the navigation menu into an icon-only view for more screen space.</p>
            </div>
            <button 
              onClick={onToggleCollapse}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${isSidebarCollapsed ? 'bg-emerald-600' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSidebarCollapsed ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        )}
      </section>

      {/* Sidebar Customization */}
      <section>
        <SectionHeader 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>}
          title="Sidebar Layout & Visibility"
          isOpen={isSidebarLayoutOpen}
          onToggle={() => setIsSidebarLayoutOpen(!isSidebarLayoutOpen)}
        />
        
        {isSidebarLayoutOpen && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <p className="text-sm text-slate-600">Customize your workspace by hiding modules you don't use or changing the order of the sidebar links.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {sidebarConfig.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.visible ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                      {item.visible ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L4.59 4.59m9.531 9.53a10.05 10.05 0 01-12.122 0m12.122 0L20 20" /></svg>
                      )}
                    </div>
                    <div>
                      <p className={`font-bold ${item.visible ? 'text-slate-800' : 'text-slate-400 italic'}`}>{item.id.charAt(0).toUpperCase() + item.id.slice(1)}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{item.visible ? 'Visible' : 'Hidden from sidebar'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col space-y-1 mr-4">
                      <button 
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                        title="Move Up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button 
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === sidebarConfig.length - 1}
                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                    <button
                      onClick={() => toggleVisibility(item.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${item.visible ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100'}`}
                    >
                      {item.visible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Backup & Security Section */}
      <section>
        <SectionHeader 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
          title="Data Management"
          isOpen={isDataMgmtOpen}
          onToggle={() => setIsDataMgmtOpen(!isDataMgmtOpen)}
        />

        {isDataMgmtOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Backup Farm Ledger</h3>
              <p className="text-sm text-slate-500 mb-6">
                Download all your transactions, livestock records, and account data into a secure JSON file. We recommend backing up monthly.
              </p>
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>Download Backup File</span>
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-amber-400">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Restore from File</h3>
              <p className="text-sm text-slate-500 mb-6">
                Restore your ledger from a previously saved backup. Note: This will overwrite your current live data.
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                  id="restore-upload"
                />
                <label
                  htmlFor="restore-upload"
                  className={`w-full flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:border-amber-400 hover:text-amber-600 cursor-pointer transition-all ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isImporting ? (
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )}
                  <span>Select Backup to Restore</span>
                </label>
                {importError && <p className="mt-2 text-xs font-bold text-rose-600">{importError}</p>}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Categories Management Section */}
      <section>
        <SectionHeader 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 11h.01M7 15h.01M13 7h.01M13 11h.01M13 15h.01M17 7h.01M17 11h.01M17 15h.01" /></svg>}
          title="Financial Categories"
          isOpen={isCategoriesOpen}
          onToggle={() => setIsCategoriesOpen(!isCategoriesOpen)}
        />
        
        {isCategoriesOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <CategoryManager 
              categories={categories} 
              onAdd={onAddCategory} 
              onUpdate={onUpdateCategory} 
              onDelete={onDeleteCategory} 
            />
          </div>
        )}
      </section>

      {/* App Info Footer */}
      <footer className="pt-10 text-center">
        <div className="inline-block p-4 bg-slate-100 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Application Version</p>
          <p className="text-lg font-black text-slate-600">v2.6.0-production</p>
          <p className="text-[10px] text-slate-400 mt-2">All data is stored locally in your browser for privacy.</p>
        </div>
      </footer>
    </div>
  );
};

export default Settings;