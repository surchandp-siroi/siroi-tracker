import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, X, Users } from 'lucide-react';
import { OrgMember } from '@/store/useDataStore';

// ---------------------------------------------------------------------------
// Lightweight fuzzy scorer: returns 0–1 (1 = identical, 0 = no relation)
// ---------------------------------------------------------------------------
function similarity(a: string, b: string): number {
    const s = a.toLowerCase().trim();
    const t = b.toLowerCase().trim();
    if (s === t) return 1;
    if (s.length === 0 || t.length === 0) return 0;

    // Short-circuit: if one is contained in the other
    if (t.includes(s) || s.includes(t)) return 0.85;

    // Levenshtein distance
    const m = s.length, n = t.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (s[i - 1] === t[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    const maxLen = Math.max(m, n);
    return 1 - dp[m][n] / maxLen;
}

export interface NameMapping {
    rawName: string;         // As extracted from Excel
    resolvedName: string;    // Confirmed canonical name
    branchName: string;      // Which branch this belongs to
}

interface UnresolvedEntry {
    rawName: string;
    branchName: string;
    suggestion: string | null;   // Best match from org_nodes, or null
    score: number;
    confirmed: string;           // Currently selected resolution
}

interface Props {
    rawItems: any[];                  // Parsed items before staging
    orgMembers: OrgMember[];
    branches: { id: string; name: string }[];
    activeBranchName: string;         // Active branch for uploader
    onConfirm: (mappings: NameMapping[], items: any[]) => void;
    onCancel: () => void;
}

const MATCH_THRESHOLD = 0.45; // If similarity >= this, suggest the match

export function StaffNameResolutionDialog({
    rawItems,
    orgMembers,
    branches,
    activeBranchName,
    onConfirm,
    onCancel,
}: Props) {
    // Build list of unique (rawName, branchName) combos that need resolution
    const unresolvedList = useMemo<UnresolvedEntry[]>(() => {
        const seen = new Set<string>();
        const results: UnresolvedEntry[] = [];

        rawItems.forEach(item => {
            const rawName = (item.staffName || '').trim();
            if (!rawName) return;

            // Determine the branch name for this row
            const rowBranchName = item.branchLocation || activeBranchName;
            const key = `${rawName}|||${rowBranchName}`;
            if (seen.has(key)) return;
            seen.add(key);

            // Get staff for this branch using partial branch name matching
            const branchStaff = orgMembers.filter(m => {
                if (!m.branch) return false;
                const mBranch = m.branch.toLowerCase();
                const rBranch = rowBranchName.toLowerCase();
                return mBranch.includes(rBranch) || rBranch.includes(mBranch);
            });

            // Find best match
            let bestName: string | null = null;
            let bestScore = 0;
            branchStaff.forEach(member => {
                const score = similarity(rawName, member.name);
                if (score > bestScore) {
                    bestScore = score;
                    bestName = member.name;
                }
            });

            // If it's an exact match (case-insensitive), auto-resolve — no dialog needed
            if (bestScore === 1) return;

            results.push({
                rawName,
                branchName: rowBranchName,
                suggestion: bestScore >= MATCH_THRESHOLD ? bestName : null,
                score: bestScore,
                confirmed: bestScore >= MATCH_THRESHOLD ? (bestName ?? rawName) : rawName,
            });
        });

        return results;
    }, [rawItems, orgMembers, activeBranchName]);

    const [entries, setEntries] = useState<UnresolvedEntry[]>(unresolvedList);

    const handleConfirm = (index: number, name: string) => {
        setEntries(prev => prev.map((e, i) => i === index ? { ...e, confirmed: name } : e));
    };

    const handleApplyAll = () => {
        // Build mappings
        const mappings: NameMapping[] = entries.map(e => ({
            rawName: e.rawName,
            resolvedName: e.confirmed,
            branchName: e.branchName,
        }));

        // Apply mappings across all raw items
        const resolved = rawItems.map(item => {
            const rawName = (item.staffName || '').trim();
            const rowBranchName = item.branchLocation || activeBranchName;
            const mapping = mappings.find(
                m => m.rawName === rawName && m.branchName === rowBranchName
            );
            return mapping ? { ...item, staffName: mapping.resolvedName } : item;
        });

        onConfirm(mappings, resolved);
    };

    // If nothing to resolve, just proceed immediately
    if (unresolvedList.length === 0) {
        onConfirm([], rawItems);
        return null;
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 bg-slate-800/60 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 shrink-0">
                            <Users className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">Confirm Staff Names</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {entries.length} name{entries.length !== 1 ? 's' : ''} need{entries.length === 1 ? 's' : ''} confirmation. 
                                Once confirmed, the canonical name will replace all matching rows instantly.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {entries.map((entry, i) => {
                        // Get staff options for this row's branch
                        const branchStaff = orgMembers.filter(m => {
                            if (!m.branch) return false;
                            const mBranch = m.branch.toLowerCase();
                            const rBranch = entry.branchName.toLowerCase();
                            return mBranch.includes(rBranch) || rBranch.includes(mBranch);
                        });

                        const hasMatch = entry.suggestion !== null;

                        return (
                            <div
                                key={i}
                                className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                                    hasMatch
                                        ? 'bg-slate-800/50 border-slate-700/50'
                                        : 'bg-amber-950/20 border-amber-700/30'
                                }`}
                            >
                                {/* Left: raw name + branch */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-xs bg-slate-700/50 border border-slate-600/50 px-2 py-1 rounded text-slate-300">
                                            "{entry.rawName}"
                                        </span>
                                        <span className="text-xs text-slate-500">from Excel</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                                        📍 {entry.branchName}
                                        {hasMatch && (
                                            <span className="ml-2 text-emerald-400">
                                                ~{Math.round(entry.score * 100)}% match
                                            </span>
                                        )}
                                        {!hasMatch && (
                                            <span className="ml-2 text-amber-400 flex items-center gap-1 inline-flex">
                                                <AlertTriangle size={10} /> No close match found
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="text-slate-500 text-sm hidden sm:block">→</div>

                                {/* Right: dropdown of staff for that branch */}
                                <div className="shrink-0 w-full sm:w-52">
                                    <select
                                        value={entry.confirmed}
                                        onChange={e => handleConfirm(i, e.target.value)}
                                        className="w-full bg-slate-950/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                                    >
                                        {/* Keep raw as an option */}
                                        <option value={entry.rawName}>Keep as "{entry.rawName}"</option>
                                        {branchStaff.map(m => (
                                            <option key={m.id} value={m.name}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Check indicator */}
                                <CheckCircle2
                                    size={18}
                                    className={entry.confirmed !== entry.rawName ? 'text-emerald-400 shrink-0' : 'text-slate-600 shrink-0'}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-800/60 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel Upload
                    </button>
                    <button
                        onClick={handleApplyAll}
                        className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                    >
                        <CheckCircle2 size={15} />
                        Confirm & Apply to All Rows
                    </button>
                </div>
            </div>
        </div>
    );
}
