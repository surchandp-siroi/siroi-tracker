const fs = require('fs');

const mobileCode = `
      {/* Mobile View */}
      <div className="md:hidden bg-[#f8f9fc] min-h-screen pb-24 font-sans text-slate-800">
        <div className="p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
            <div className="flex items-center gap-3 mb-5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Financial Portal</h1>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">{financialYear}</span>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex bg-slate-100 p-1 rounded-xl flex-1">
                <button 
                  onClick={() => setViewMode('daily')}
                  className={\`flex-1 py-2 text-xs font-bold rounded-lg transition-all \${viewMode === 'daily' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  DAILY
                </button>
                <button 
                  onClick={() => setViewMode('month')}
                  className={\`flex-1 py-2 text-xs font-bold rounded-lg transition-all \${viewMode === 'month' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  MONTH
                </button>
                <button 
                  onClick={() => setViewMode('year')}
                  className={\`flex-1 py-2 text-xs font-bold rounded-lg transition-all \${viewMode === 'year' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  YEAR
                </button>
              </div>

              <div className="relative flex-shrink-0">
                <button className="flex items-center justify-center w-11 h-11 bg-indigo-600 text-white rounded-xl shadow-md active:scale-95 transition-all">
                  <Calendar className="h-5 w-5" />
                </button>
                <Input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 m-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex flex-col items-center border-r border-slate-100 pr-2 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-tight h-6 flex items-center justify-center">Projected Total Business Today</span>
                <span className="text-2xl font-mono font-black text-slate-900 mt-1">
                  ₹{projectedTotalBusinessToday.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">{selectedDate.split('-').reverse().join('-')}</span>
              </div>
              <div className="flex flex-col items-center pl-2 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-tight h-6 flex items-center justify-center">Total Achievement Today</span>
                <span className="text-2xl font-mono font-black text-emerald-500 mt-1">
                  ₹{(kpiMetrics['All Products']?.ftd || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">{selectedDate.split('-').reverse().join('-')}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 py-2 mb-2 flex gap-3 snap-x">
            {['All Products', ...PRODUCTS_LIST].map((prod) => (
              <button
                key={prod}
                onClick={() => setSelectedProduct(prod)}
                className={\`whitespace-nowrap px-5 py-2.5 text-xs font-bold rounded-full transition-all snap-start shadow-sm border \${selectedProduct === prod ? 'bg-indigo-600 text-white border-indigo-600 scale-105 transform' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
              >
                {prod.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-2 truncate">FTD {selectedProduct}</div>
              <div className="text-xl font-mono font-black text-slate-900 truncate" title={\`₹\${(kpiMetrics[selectedProduct]?.ftd || 0).toLocaleString('en-IN')}\`}>
                ₹{(kpiMetrics[selectedProduct]?.ftd || 0).toLocaleString('en-IN')}
              </div>
              <div className="inline-block px-2 py-0.5 bg-sky-50 text-sky-600 text-[9px] font-bold rounded uppercase tracking-wider mt-2">
                {kpiMetrics[selectedProduct]?.ftdCount || 0} ENTRIES
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2 truncate">MTD {selectedProduct}</div>
              <div className="text-xl font-mono font-black text-slate-900 truncate" title={\`₹\${(kpiMetrics[selectedProduct]?.mtd || 0).toLocaleString('en-IN')}\`}>
                ₹{(kpiMetrics[selectedProduct]?.mtd || 0).toLocaleString('en-IN')}
              </div>
              <div className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded uppercase tracking-wider mt-2">
                {kpiMetrics[selectedProduct]?.mtdCount || 0} ENTRIES
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 truncate">YTD {selectedProduct}</div>
              <div className="text-xl font-mono font-black text-slate-900 truncate" title={\`₹\${(kpiMetrics[selectedProduct]?.ytd || 0).toLocaleString('en-IN')}\`}>
                ₹{(kpiMetrics[selectedProduct]?.ytd || 0).toLocaleString('en-IN')}
              </div>
              <div className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded uppercase tracking-wider mt-2">
                {kpiMetrics[selectedProduct]?.ytdCount || 0} ENTRIES
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 truncate">DAILY PROJ.</div>
              <div className="text-xl font-mono font-black text-slate-900 truncate" title={\`₹\${(projectedTotalBusinessToday).toLocaleString('en-IN')}\`}>
                ₹{projectedTotalBusinessToday.toLocaleString('en-IN')}
              </div>
              <div className="inline-block px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded uppercase tracking-wider mt-2">
                ALL BRANCHES
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
`;

let content = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf-8');

// 1. Add selectedProduct state
if (!content.includes('selectedProduct')) {
  content = content.replace(
    /const \[selectedDate, setSelectedDate\] = useState(.*?);/,
    "const [selectedDate, setSelectedDate] = useState$1;\n  const [selectedProduct, setSelectedProduct] = useState<string>('All Products');"
  );
}

// 2. Inject mobile view and wrap desktop
const returnTag = '  return (\n    <>';
if (content.includes(returnTag) && !content.includes('<div className="md:hidden')) {
  content = content.replace(returnTag, returnTag + '\\n' + mobileCode);
  
  // 3. Add closing div at the very end
  const endTag = '    </>\n  );\n}';
  if (content.includes(endTag)) {
    content = content.replace(endTag, '      </div>\n' + endTag);
  }
}

fs.writeFileSync('src/pages/DashboardPage.tsx', content);
console.log('Mobile view successfully injected and desktop view wrapped.');
