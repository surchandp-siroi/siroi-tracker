import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type ProductCategory = 'Loan' | 'Insurance' | 'Forex' | 'Consultancy';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  revenue: number; // This will now be computed
}

export interface Channel {
  id: string;
  name: string;
  revenue: number;
}

export interface Branch {
  id: string;
  name: string;
  managerName: string;
  managerEmail: string;
  dailyProjection: number;
  dailyAchievement: number; // Computed
  monthlyTarget: number;
}

export interface EntryItem {
    date: string;
    staffName: string;
    customerName: string;
    category: ProductCategory;
    product: string;
    channel: string;
    amount: number;
    status: string;
}

export interface BranchEntry {
    id: string;
    branchId: string;
    entryDate: string;
    mode: 'daily' | 'monthly';
    recordType: 'projection' | 'achievement';
    items: EntryItem[];
    totalAmount: number;
    authorId: string;
    authorEmail: string;
}

const staticChannels: Channel[] = [
  'Aditya Birla', 'Axis Bank', 'Axis Finance', 'Bajaj Finserv', 'Bajaj Market',
  'Bandhan Bank', 'Cholamandalam', 'Finnable', 'SMFG India', 'HDFC BANK',
  'ICICI BANK', 'IDFC FIRST BANK', 'INCRED', 'INDUSIND BANK', 'L&T',
  'PIRAMAL CAPITAL', 'POONAWALA', 'TATA CAPITAL', 'YES BANK', 'INDIFI',
  'Credit SAISON', 'SLICE'
].map((name, i) => ({ id: `ch-${i}`, name, revenue: 0 }));

const staticBranches: Branch[] = [
  { id: 'b1', name: 'Guwahati', managerName: 'Aroop Sharma', managerEmail: 'aroop.sharma@siroiforex.com', dailyProjection: 0, dailyAchievement: 0, monthlyTarget: 1500000 },
  { id: 'b2', name: 'Manipur', managerName: 'Ajay Waikhom', managerEmail: 'ajay.waikhom@siroiforex.com', dailyProjection: 0, dailyAchievement: 0, monthlyTarget: 900000 },
  { id: 'b3', name: 'Itanagar', managerName: 'Nobin Nani', managerEmail: 'nobin.nani@siroiforex.com', dailyProjection: 0, dailyAchievement: 0, monthlyTarget: 600000 },
  { id: 'b4', name: 'Nagaland & Mizoram', managerName: 'Ramesh Singh', managerEmail: 'ramesh@siroiforex.com', dailyProjection: 0, dailyAchievement: 0, monthlyTarget: 150000 },
];

const staticProducts: Omit<Product, 'revenue'>[] = [
  { id: 'p1', name: 'Personal Loan', category: 'Loan' },
  { id: 'p2', name: 'Business Loan', category: 'Loan' },
  { id: 'p3', name: 'Mortgage', category: 'Loan' },
  { id: 'p4', name: 'Home Loan', category: 'Loan' },
  { id: 'p5', name: 'General Insurance', category: 'Insurance' },
  { id: 'p6', name: 'Life Insurance', category: 'Insurance' },
  { id: 'p7', name: 'Currency Exchange', category: 'Forex' },
  { id: 'p8', name: 'Forex card', category: 'Forex' },
  { id: 'p9', name: 'Outward Remittance', category: 'Forex' },
  { id: 'p10', name: 'GST filing', category: 'Consultancy' },
  { id: 'p11', name: 'ITR filing', category: 'Consultancy' },
];

interface DataState {
  products: Product[];
  channels: Channel[];
  branches: Branch[];
  entries: BranchEntry[];
  isLoading: boolean;
  initSync: (role?: string, branchId?: string | null) => Promise<void>;
  unsubscribeSync: () => void;
  addChannel: (name: string) => void;
  deleteChannel: (id: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'revenue'>) => void;
  deleteProduct: (id: string) => void;
  addBranch: (branch: Omit<Branch, 'id' | 'dailyAchievement'>) => void;
  deleteBranch: (id: string) => void;
}

let globalSubscription: any = null;

export const useDataStore = create<DataState>((set) => ({
  products: staticProducts.map(p => ({ ...p, revenue: 0 })),
  channels: staticChannels,
  branches: staticBranches,
  entries: [],
  isLoading: true,
  addChannel: () => {},
  deleteChannel: () => {},
  addProduct: () => {},
  deleteProduct: () => {},
  addBranch: () => {},
  deleteBranch: () => {},

  initSync: async (role?: string, branchId?: string | null) => {
    if (globalSubscription) {
        supabase.removeChannel(globalSubscription);
        globalSubscription = null;
    }

    if (!role) {
        set({ isLoading: false });
        return;
    }

    let query = supabase.from('entries').select('*');
    if (role === 'statehead' && branchId) {
        query = query.eq('branchId', branchId);
    } else if (role !== 'admin') {
        set({ isLoading: false });
        return; // fallback
    }
    
    // Initial fetch
    try {
      const { data: initialEntries, error } = await query;
      if (error) throw error;
      
      const computeStats = (entries: BranchEntry[]) => {
        const productRevenues: Record<string, number> = {};
        const branchAchievements: Record<string, number> = {};
        const branchProjections: Record<string, number> = {};
        const channelRevenues: Record<string, number> = {};
        
        // Use today's date for daily projections check
        const todayStr = new Date().toISOString().split('T')[0];
        
        entries.forEach(entry => {
            const isAchievement = !entry.recordType || entry.recordType === 'achievement';
            const isProjection = entry.recordType === 'projection';
            
            if (isAchievement) {
                branchAchievements[entry.branchId] = (branchAchievements[entry.branchId] || 0) + entry.totalAmount;
                
                entry.items.forEach(item => {
                    productRevenues[item.product] = (productRevenues[item.product] || 0) + item.amount;
                    channelRevenues[item.channel] = (channelRevenues[item.channel] || 0) + item.amount;
                });
            } else if (isProjection && entry.entryDate === todayStr) {
                // If it's a projection for today, sum it up
                branchProjections[entry.branchId] = (branchProjections[entry.branchId] || 0) + entry.totalAmount;
            }
        });

        set((state) => ({
            entries,
            branches: state.branches.map(b => ({ 
                ...b, 
                dailyAchievement: branchAchievements[b.id] || 0,
                dailyProjection: branchProjections[b.id] !== undefined ? branchProjections[b.id] : b.dailyProjection
            })),
            products: state.products.map(p => ({ ...p, revenue: productRevenues[p.name] || 0 })),
            channels: state.channels.map(c => ({ ...c, revenue: channelRevenues[c.name] || 0 })),
            isLoading: false
        }));
      };

      computeStats((initialEntries || []) as any as BranchEntry[]);

      // Subscribe to changes
      globalSubscription = supabase
        .channel('entries_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'entries' },
          async (payload) => {
             // Refetch to keep it simple and accurate with RLS
             const { data: refreshedEntries } = await query;
             if (refreshedEntries) {
                 computeStats(refreshedEntries as any as BranchEntry[]);
             }
          }
        )
        .subscribe();

    } catch (error) {
      console.error("Supabase sync error:", error);
      set({ isLoading: false });
    }
  },
  
  unsubscribeSync: () => {
      if (globalSubscription) {
          supabase.removeChannel(globalSubscription);
          globalSubscription = null;
      }
  }
}));
