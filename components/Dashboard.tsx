import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  Transaction, 
  Category, 
  TransactionType, 
  AnimalSpecies, 
  AnimalLog, 
  InventoryItem, 
  InventoryMovement, 
  Asset, 
  Liability 
} from '../types.ts';
import { COLORS } from '../constants.tsx';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  animalSpecies: AnimalSpecies[];
  animalLogs: AnimalLog[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  assets: Asset[];
  liabilities: Liability[];
}

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  categories, 
  animalSpecies, 
  animalLogs, 
  inventoryItems, 
  inventoryMovements, 
  assets, 
  liabilities 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const isSearchActive = searchQuery.trim().length > 0;

  const summary = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const filteredResults = useMemo(() => {
    if (!isSearchActive) return null;

    const q = searchQuery.toLowerCase();
    
    const containsQuery = (item: any, fields: string[]) => {
      return fields.some(field => {
        const val = item[field];
        return val && val.toString().toLowerCase().includes(q);
      });
    };

    return {
      transactions: transactions.filter(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        return containsQuery({...t, categoryName: cat?.name}, ['description', 'categoryName', 'date', 'amount']);
      }),
      animals: animalSpecies.filter(s => containsQuery(s, ['name', 'breed', 'tag'])),
      animalLogs: animalLogs.filter(l => {
        const species = animalSpecies.find(s => s.id === l.speciesId);
        return containsQuery({...l, speciesName: species?.name}, ['speciesName', 'note', 'type', 'date']);
      }),
      inventory: inventoryItems.filter(i => containsQuery(i, ['name', 'sku', 'description'])),
      assets: assets.filter(a => containsQuery(a, ['name', 'category', 'description', 'purchaseDate'])),
      liabilities: liabilities.filter(l => containsQuery(l, ['name', 'category', 'description', 'dueDate'])),
    };
  }, [isSearchActive, searchQuery, transactions, categories, animalSpecies, animalLogs, inventoryItems, assets, liabilities]);

  const categoryData = useMemo(() => {
    const data: { [key: string]: number } = {};
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'Other';
      data[cat] = (data[cat] || 0) + t.amount;
    });
    return Object.keys(data).map((name, index) => ({
      name,
      value: data[name],
      color: COLORS[index % COLORS.length]
    }));
  }, [transactions, categories]);

  const monthlyData = useMemo(() => {
    const data: { [key: string]: { month: string, income: number, expense: number, sortKey: string } } = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      const sortKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('default', { month: 'short', year: '2-digit' });
      if (!data[sortKey]) data[sortKey] = { month: label, income: 0, expense: 0, sortKey };
      if (t.type === TransactionType.INCOME) data[sortKey].income += t.amount;
      else data[sortKey].expense += t.amount;
    });
    return Object.values(data).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm">
        <div className="flex flex-col space-y-2">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Global Farm Search</h2>
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search animals, inventory, ledger or assets..."
              className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner text-slate-700 transition-all"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {isSearchActive && filteredResults && (
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-emerald-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-emerald-800">Unified Results for "{searchQuery}"</h3>
            <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-slate-400 hover:text-rose-500 uppercase tracking-tighter transition-colors">Clear Search</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {/* Ledger Results */}
            {filteredResults.transactions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Ledger Items</h4>
                {filteredResults.transactions.map(t => (
                  <div key={t.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-emerald-200 transition-all group">
                    <p className="text-sm font-bold text-slate-800 truncate">{t.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-slate-400 font-mono">{t.date}</span>
                      <span className={`text-xs font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${t.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Animal Results */}
            {(filteredResults.animals.length > 0 || filteredResults.animalLogs.length > 0) && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Livestock Records</h4>
                {filteredResults.animals.map(a => (
                  <div key={a.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-emerald-200 transition-all">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-800">{a.name}</p>
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">SPECIES</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-slate-400">{a.breed}</span>
                      <span className="text-xs font-black text-slate-700">${(a.count * a.estimatedValue).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {filteredResults.animalLogs.map(l => (
                  <div key={l.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-700">{(animalSpecies.find(s=>s.id===l.speciesId))?.name}</p>
                      <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">{l.type}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic truncate">{l.note}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Inventory Results */}
            {filteredResults.inventory.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Inventory Status</h4>
                {filteredResults.inventory.map(i => (
                  <div key={i.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-emerald-200 transition-all">
                    <p className="text-sm font-bold text-slate-800">{i.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-slate-400 font-mono">{i.sku}</span>
                      <span className="text-xs font-black text-blue-600">{i.quantity} Units</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Asset/Liability Results */}
            {(filteredResults.assets.length > 0 || filteredResults.liabilities.length > 0) && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Fixed Assets & Debt</h4>
                {filteredResults.assets.map(a => (
                  <div key={a.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-800">{a.name}</p>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">ASSET</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-slate-400">{a.category}</span>
                      <span className="text-xs font-black text-emerald-600">${a.currentValue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {filteredResults.liabilities.map(l => (
                  <div key={l.id} className="p-3 bg-white border border-rose-100 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-800">{l.name}</p>
                      <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">LIABILITY</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-slate-400">{l.category}</span>
                      <span className="text-xs font-black text-rose-600">${l.currentBalance.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {Object.values(filteredResults).every(arr => arr.length === 0) && (
              <div className="col-span-full py-20 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <p className="text-slate-500 font-bold">No farm records match your keyword.</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search term or check specific module pages.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">${summary.income.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase">Total Expenses</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">${summary.expense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase">Net Income</p>
          <p className={`text-2xl font-bold mt-1 ${summary.income - summary.expense >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
            ${(summary.income - summary.expense).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Income vs Expenses</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Expense Breakdown</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
