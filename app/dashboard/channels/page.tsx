'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/useDataStore';
import { Button, Card, CardContent, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';

export default function ChannelsPage() {
  const { channels, entries } = useDataStore();

  const channelRevenues = channels.reduce((acc, channel) => {
    acc[channel.name] = entries.reduce((sum, entry) => {
      const channelItems = entry.items.filter(item => item.channel === channel.name);
      return sum + channelItems.reduce((s, curr) => s + curr.amount, 0);
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <header className="glass px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Loan Channel Partners</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Revenue tracking & closures</p>
        </div>
      </header>

      <div className="grid md:grid-cols-1 gap-6">
          <div className="md:col-span-1">
            <Card className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-900/10 dark:border-white/10 flex justify-between tracking-tight text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] bg-slate-900/5 dark:bg-white/5">
                    <span>Partner Name</span>
                    <span>Total Revenue</span>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                    <Table>
                        <TableBody>
                            {channels.map(channel => (
                                <TableRow key={channel.id}>
                                    <TableCell className="font-medium text-slate-800 dark:text-slate-200">{channel.name}</TableCell>
                                    <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">₹{(channelRevenues[channel.name] || 0).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                            {channels.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-6 text-slate-500">No channel partners found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
          </div>
      </div>
    </>
  );
}
