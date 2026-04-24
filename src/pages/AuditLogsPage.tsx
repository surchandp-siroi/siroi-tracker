import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from '@/components/ui';
import { format } from 'date-fns';
import { Download } from 'lucide-react';

interface AuditLog {
    id: string;
    filename: string;
    uploaded_by: string;
    email_id: string;
    file_url: string;
    created_at: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('upload_audit_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileUrl: string, originalName: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('bulk_uploads')
                .download(fileUrl);
            
            if (error) throw error;

            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = originalName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading file:', err);
            alert('Failed to download file.');
        }
    };

    return (
        <div className="p-6">
            <header className="glass px-6 py-4 mb-6 rounded-lg">
                <h1 className="text-xl font-bold tracking-tight dark:text-white text-slate-900">Upload Audit Logs</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track bulk upload history and download source files.</p>
            </header>

            <Card className="border-slate-900/10 dark:border-white/10">
                <CardHeader className="py-4 border-b border-slate-900/10 dark:border-white/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Recent Uploads</span>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-200 dark:border-white/10 hover:bg-transparent">
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Upload Date & Time</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Uploaded By</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Email ID</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Original Filename</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                                            Loading logs...
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                                            No audit logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <TableCell className="p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                {format(new Date(log.created_at), 'dd MMM yyyy, hh:mm a')}
                                            </TableCell>
                                            <TableCell className="p-4 text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                {log.uploaded_by}
                                            </TableCell>
                                            <TableCell className="p-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {log.email_id}
                                            </TableCell>
                                            <TableCell className="p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                {log.filename}
                                            </TableCell>
                                            <TableCell className="p-4 text-right whitespace-nowrap">
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    onClick={() => handleDownload(log.file_url, log.filename)}
                                                    className="gap-2 text-xs h-8 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                >
                                                    <Download size={14} />
                                                    Download File
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
