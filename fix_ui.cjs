const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

// 1. Add BankIcon component
const bankIconCode = `

const getBankDomain = (bankName: string) => {
    const name = (bankName || '').toLowerCase();
    if (name.includes('state bank') || name.includes('sbi')) return 'sbi.co.in';
    if (name.includes('hdfc')) return 'hdfcbank.com';
    if (name.includes('icici')) return 'icicibank.com';
    if (name.includes('axis')) return 'axisbank.com';
    if (name.includes('punjab national') || name.includes('pnb')) return 'pnbindia.in';
    if (name.includes('kotak')) return 'kotak.com';
    if (name.includes('yes')) return 'yesbank.in';
    if (name.includes('canara')) return 'canarabank.com';
    if (name.includes('bank of baroda')) return 'bankofbaroda.in';
    if (name.includes('bank of india')) return 'bankofindia.co.in';
    if (name.includes('union bank')) return 'unionbankofindia.co.in';
    return null;
};

const BankIcon = ({ bankName, className }: { bankName: string, className?: string }) => {
    const domain = getBankDomain(bankName);
    const [error, setError] = useState(false);

    if (domain && !error) {
        return <img src={\`https://logo.clearbit.com/\${domain}\`} alt={bankName} className={\`\${className || ''} object-contain rounded-sm bg-white p-[1px]\`} onError={() => setError(true)} />;
    }
    return <CreditCard className={\`\${className || ''}\`} fill="currentColor" />;
};

export default function ConsultantApprovalPage() {`;

content = content.replace('export default function ConsultantApprovalPage() {', bankIconCode);

// 2. Solid Icons
// UserCircle
content = content.replaceAll('<UserCircle className="w-5 h-5 text-blue-500" />', '<UserCircle className="w-5 h-5 text-blue-500" fill="currentColor" />');
// Mail
content = content.replaceAll('<Mail className="w-3 h-3 text-cyan-500" />', '<Mail className="w-3 h-3 text-cyan-500" fill="currentColor" />');
// Phone
content = content.replaceAll('<Phone className="w-3 h-3 text-violet-500" />', '<Phone className="w-3 h-3 text-violet-500" fill="currentColor" />');
// Building2
content = content.replaceAll('<Building2 className="w-3 h-3" />', '<Building2 className="w-3 h-3" fill="currentColor" />');
// MapPin
content = content.replaceAll('<MapPin className="w-3.5 h-3.5 text-emerald-500" />', '<MapPin className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" />');

// 3. Bank details
content = content.replaceAll('<CreditCard className="w-3.5 h-3.5 text-amber-500" />', '<BankIcon bankName={consultant.bank_name} className="w-4 h-4 shadow-sm" />');

// 4. Dropdowns
const oldDropdowns = `<div className="flex items-center gap-3 bg-white dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-sm">
                            <select 
                                value={filterState} 
                                onChange={(e) => setFilterState(e.target.value)}
                                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 px-4 py-2 focus:outline-none appearance-none pr-8 cursor-pointer rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                                style={{ backgroundImage: \`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")\`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                            >
                                <option value="All">All States</option>
                                {uniqueStates.map(state => <option key={state} value={state}>{state}</option>)}
                            </select>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                            <select 
                                value={filterBranch} 
                                onChange={(e) => setFilterBranch(e.target.value)}
                                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 px-4 py-2 focus:outline-none appearance-none pr-8 cursor-pointer rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                                style={{ backgroundImage: \`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")\`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                            >
                                <option value="All">All Branches</option>
                                {uniqueBranches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                            </select>
                        </div>`;

const newDropdowns = `<div className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 p-1.5 rounded-full shadow-lg shadow-indigo-600/20">
                            <select 
                                value={filterState} 
                                onChange={(e) => setFilterState(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-white px-4 py-1.5 focus:outline-none appearance-none pr-8 cursor-pointer rounded-full hover:bg-white/10 transition-colors"
                                style={{ backgroundImage: \`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")\`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                            >
                                <option value="All" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">All States</option>
                                {uniqueStates.map(state => <option key={state} value={state} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">{state}</option>)}
                            </select>
                            <div className="w-px h-5 bg-white/20"></div>
                            <select 
                                value={filterBranch} 
                                onChange={(e) => setFilterBranch(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-white px-4 py-1.5 focus:outline-none appearance-none pr-8 cursor-pointer rounded-full hover:bg-white/10 transition-colors"
                                style={{ backgroundImage: \`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")\`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                            >
                                <option value="All" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">All Branches</option>
                                {uniqueBranches.map(branch => <option key={branch} value={branch} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">{branch}</option>)}
                            </select>
                        </div>`;

content = content.replace(oldDropdowns, newDropdowns);

fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
console.log('Fixed UI');
