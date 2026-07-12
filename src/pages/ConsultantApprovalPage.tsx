import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { Consultant } from '@/store/useDataStore';
import { Loader2, Check, X, FileText, Download } from 'lucide-react';

export default function ConsultantApprovalPage() {
    const [pendingConsultants, setPendingConsultants] = useState<Consultant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('consultants')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setPendingConsultants(data as Consultant[]);
        } catch (error) {
            console.error('Error fetching pending consultants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
        setActionLoading(id);
        try {
            const { error } = await supabase
                .from('consultants')
                .update({ status: newStatus })
                .eq('id', id);
            
            if (error) throw error;
            
            // Remove from list
            setPendingConsultants(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error(`Error ${newStatus} consultant:`, error);
            alert(`Failed to ${newStatus} consultant. Please try again.`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownload = async (path: string, fallbackName: string) => {
        if (!path) return;
        try {
            const { data, error } = await supabase.storage.from('consultant_docs').download(path);
            if (error) throw error;
            
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = path.split('/').pop() || fallbackName;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e: any) {
            console.error("Error downloading file", e);
            alert("Could not download file.");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Consultant Approval</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Review and approve new consultant registrations.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Pending Requests ({pendingConsultants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : pendingConsultants.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">
                            No pending consultant requests.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3">Name & Contact</th>
                                        <th className="px-4 py-3">Location</th>
                                        <th className="px-4 py-3">Bank Details</th>
                                        <th className="px-4 py-3">Documents</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingConsultants.map((consultant) => (
                                        <tr key={consultant.id} className="border-b dark:border-slate-800">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900 dark:text-white">{consultant.name}</div>
                                                <div className="text-xs text-slate-500">{consultant.email}</div>
                                                <div className="text-xs text-slate-500">{consultant.phone}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5">{consultant.associated_branch} Branch</div>
                                                <div className="text-slate-900 dark:text-white">{consultant.state}</div>
                                                <div className="text-xs text-slate-500">{consultant.address}</div>
                                                <div className="text-xs text-slate-500">{consultant.pincode}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-slate-900 dark:text-white">{consultant.bank_name}</div>
                                                <div className="text-xs text-slate-500">A/c: {consultant.account_number}</div>
                                                <div className="text-xs text-slate-500">IFSC: {consultant.ifsc_code}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-2">
                                                    <Button variant="secondary" size="sm" className="h-7 text-xs flex justify-start px-2" onClick={() => handleDownload(consultant.pan_file_url, 'PAN_Card')}>
                                                        <FileText className="w-3 h-3 mr-1" /> PAN: {consultant.pan_number}
                                                    </Button>
                                                    <Button variant="secondary" size="sm" className="h-7 text-xs flex justify-start px-2" onClick={() => handleDownload(consultant.aadhar_file_url, 'Aadhar_Card')}>
                                                        <FileText className="w-3 h-3 mr-1" /> Aadhar: {consultant.aadhar_number}
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary"
                                                    className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 dark:bg-green-900/20 dark:border-green-900/50 dark:hover:bg-green-900/40"
                                                    disabled={actionLoading === consultant.id}
                                                    onClick={() => handleAction(consultant.id, 'approved')}
                                                >
                                                    {actionLoading === consultant.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary"
                                                    className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:border-red-900/50 dark:hover:bg-red-900/40"
                                                    disabled={actionLoading === consultant.id}
                                                    onClick={() => handleAction(consultant.id, 'rejected')}
                                                >
                                                    {actionLoading === consultant.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
