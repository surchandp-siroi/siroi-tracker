const fs = require('fs');

function rewriteEntryPage() {
    let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf-8');
    
    // We will do a regex to replace the entire table headers and rows to ensure correctness.
    // Let's create the new headers for the main table.
    
    const mainTableHeaders = `
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[200px]">1. Login Date</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[220px]">2. Category</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[240px]">3. Product</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[250px]">4. Relationship Manager Name</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[220px]">5. File Login</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[240px]">6. Channel Partner</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[220px]">7. Branch</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[240px]">8. Customer Name</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[210px]">9. DOB</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[210px]">10. Phone No.</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[240px]">11. Email ID</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[280px]">12. Customer Address</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[240px]">13. Firm Name</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[220px]">14. Login Amt (₹)</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[220px]">15. File Status</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[220px]">16. Sanctioned (₹)</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[220px]">17. Disbursed (₹)</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[210px]">18. Disbursed Dt</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[210px]">19. EMI Date</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[240px]">20. Repayment Bank</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[230px]">21. Staff Name</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[230px]">22. Manager Name</TableHead>
                                <TableHead className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[230px]">23. Consultant</TableHead>
                                <TableHead className="w-[50px] px-2 sticky right-0 bg-white/5 backdrop-blur z-10"></TableHead>`;

    const stagingModalHeaders = `
                                <TableHead className="min-w-[200px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Login Date</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Category *</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Product {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="min-w-[250px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Relationship Manager Name</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">File Login</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Channel Partner {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="min-w-[200px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Branch Location</TableHead>
                                <TableHead className="min-w-[260px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Customer Name {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">DOB</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Phone No.</TableHead>
                                <TableHead className="min-w-[240px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Email ID</TableHead>
                                <TableHead className="min-w-[280px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Customer Address</TableHead>
                                <TableHead className="min-w-[240px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Firm Name</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Login Amt *</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">File Status {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="min-w-[220px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Sanctioned (₹)</TableHead>
                                <TableHead className="min-w-[220px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Disbursed (₹)</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Disbursed Dt</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">EMI Date</TableHead>
                                <TableHead className="min-w-[240px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Repayment Bank</TableHead>
                                <TableHead className="min-w-[260px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Staff Name *</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Manager Name</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Consultant</TableHead>
                                <TableHead className="w-[50px]"></TableHead>`;

    // Update Main Table Headers
    content = content.replace(
        /<TableHead className="text-\[10px\] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-\[200px\]">1\. Login Date<\/TableHead>[\s\S]*?<TableHead className="w-\[50px\] px-2 sticky right-0 bg-white\/5 backdrop-blur z-10"><\/TableHead>/m,
        mainTableHeaders.trim()
    );

    // Update Staging Modal Headers
    content = content.replace(
        /<TableHead className="min-w-\[200px\] font-bold text-\[10px\] uppercase tracking-wider text-slate-500">Login Date<\/TableHead>[\s\S]*?<TableHead className="w-\[50px\]"><\/TableHead>/m,
        stagingModalHeaders.trim()
    );

    fs.writeFileSync('src/pages/EntryPage.tsx', content, 'utf-8');
}

rewriteEntryPage();
