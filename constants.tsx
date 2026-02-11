import { Category, TransactionType } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Sales', type: TransactionType.INCOME, color: '#10b981' },
  { id: '2', name: 'Consulting', type: TransactionType.INCOME, color: '#34d399' },
  { id: '3', name: 'Rent', type: TransactionType.EXPENSE, color: '#ef4444' },
  { id: '4', name: 'Utilities', type: TransactionType.EXPENSE, color: '#f97316' },
  { id: '5', name: 'Payroll', type: TransactionType.EXPENSE, color: '#8b5cf6' },
  { id: '6', name: 'Marketing', type: TransactionType.EXPENSE, color: '#3b82f6' },
  { id: '7', name: 'Other', type: TransactionType.EXPENSE, color: '#64748b' },
];

export const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
];