import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui';
import { Search, UsersRound, Phone, MapPin, User, Calendar, Mail, Building } from 'lucide-react';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';
import { useAuthStore } from '@/store/useAuthStore';
import { EditCustomerDialog } from '@/components/EditCustomerDialog';
import { Edit } from 'lucide-react';

type CustomerData = {
  id: string;
  created_at: string;
  pan_number: string;
  customer_name: string;
  phone_number: string;
  email_id: string;
  entry_person_name: string;
  entry_location: string;
  association_date: string;
  city: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const currentUser = useAuthStore(state => state.user);
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
      } else if (data) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.customer_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (c.pan_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (c.phone_number?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <UsersRound className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Customer Details
          </h1>
          <p className="text-slate-500 mt-1">Overview of all customer records entered by the team</p>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 mb-6">
        <LiquidGlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UsersRound className="w-24 h-24 text-indigo-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Total Customers Filled</p>
            <div className="flex items-end gap-3 mt-2">
              <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                {isLoading ? '-' : customers.length}
              </span>
              <span className="text-sm font-medium text-slate-500 mb-2">records</span>
            </div>
          </div>
        </LiquidGlassCard>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <Input
          type="text"
          placeholder="Search by name, PAN, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-white/50 border-slate-200 text-slate-900 rounded-xl shadow-sm w-full md:max-w-md"
        />
      </div>

      {/* Customers List */}
      <div className="space-y-4 mt-6">
        {isLoading ? (
          <div className="text-center py-10 text-slate-500">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white/40 rounded-2xl border border-slate-100">
            No customers found matching "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id || customer.pan_number} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-2xl" />
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg truncate max-w-[200px]" title={customer.customer_name}>
                      {customer.customer_name || 'N/A'}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">
                      {customer.pan_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Entry By</span>
                      {isAdmin && (
                        <button 
                          onClick={() => setEditingCustomer(customer)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1 bg-slate-50 hover:bg-indigo-50 rounded"
                          title="Edit Customer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs font-medium text-slate-700">
                      <User className="w-3 h-3" />
                      {customer.entry_person_name || 'Unknown'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {customer.phone_number || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{customer.email_id || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Building className="w-3.5 h-3.5 text-indigo-400" />
                      {customer.entry_location || 'N/A'}
                    </div>
                    {customer.association_date && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {customer.association_date}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingCustomer && (
        <EditCustomerDialog 
          customer={editingCustomer} 
          onClose={() => setEditingCustomer(null)}
          onSuccess={() => {
            setEditingCustomer(null);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}
