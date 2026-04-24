const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../src/pages/EntryPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add state variables for lodgeName and lodgeEmail
content = content.replace(
    /const \[isBulkSubmitting, setIsBulkSubmitting\] = useState\(false\);/,
    `const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);\n  const [lodgeName, setLodgeName] = useState('');\n  const [lodgeEmail, setLodgeEmail] = useState('');`
);

// 2. Add routing link to Audit Logs in header
content = content.replace(
    /<div className="flex items-center gap-4">/,
    `<div className="flex items-center gap-4">\n                <Button variant="ghost" className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs" onClick={() => navigate('/audit-logs')}>\n                    Audit Logs\n                </Button>`
);

// 3. AI Data Parsing
content = content.replace(
    /parsed = parsed\.map\(\(p: any\) => \(\{ \.\.\.p, isManual: true, projectionAmt: p\.projectionAmt \|\| 0 \}\)\);/,
    `parsed = parsed.map((p: any) => {
                  let prod = p.product || '';
                  if (prod) {
                      const plMatch = prod.match(/^PL\\s*(.*)$/i);
                      if (plMatch) {
                          prod = plMatch[1] ? \`Personal Loan (\${plMatch[1].trim()})\` : "Personal Loan";
                      } else {
                          const blMatch = prod.match(/^BL\\s*(.*)$/i);
                          if (blMatch) {
                              prod = blMatch[1] ? \`Business Loan (\${blMatch[1].trim()})\` : "Business Loan";
                          }
                      }
                  }
                  return { ...p, product: prod, isManual: true, projectionAmt: p.projectionAmt || 0 };
              });`
);

// 4. Deduplication & Upsert Logic
content = content.replace(
    /const \{ error: auditError \} = await supabase[\s\S]*?if \(auditError\) throw new Error\(\`Audit log failed: \$\{auditError\.message\}\`\);/,
    `const { error: auditError } = await supabase
              .from('upload_audit_logs')
              .insert({
                  filename: stagedFile.name,
                  uploaded_by: lodgeName,
                  email_id: lodgeEmail,
                  file_url: fileUrl
              });
              
          if (auditError) throw new Error(\`Audit log failed: \${auditError.message}\`);`
);

content = content.replace(
    /for \(const \[rowDate, rItems\] of itemsByDate\.entries\(\)\) \{[\s\S]*?if \(insertError\) throw new Error\(insertError\.message\);\n              \}\n          \}/,
    `for (const [rowDate, rItems] of itemsByDate.entries()) {
              const { data: existing } = await supabase
                .from('entries')
                .select('id, items')
                .eq('branchId', activeBranchId)
                .eq('entryDate', rowDate)
                .eq('mode', entryMode)
                .eq('recordType', recordType)
                .limit(1);
                
              let mergedItems = rItems;
              let existingId = undefined;

              if (existing && existing.length > 0) {
                  existingId = existing[0].id;
                  const existingItems = existing[0].items || [];
                  const existingPhones = new Set(existingItems.map((i: any) => i.phoneNumber).filter(Boolean));
                  const duplicateFound = rItems.some((i: any) => i.phoneNumber && existingPhones.has(i.phoneNumber));
                  
                  if (duplicateFound) {
                      if (!window.confirm(\`Duplicate records found for \${rowDate}. Proceeding will overwrite existing data. Continue?\`)) {
                          continue;
                      }
                  }
                  
                  mergedItems = [...existingItems];
                  rItems.forEach((newItem: any) => {
                      let replaced = false;
                      for (let i = 0; i < mergedItems.length; i++) {
                          const existingItem = mergedItems[i];
                          if (newItem.phoneNumber && existingItem.phoneNumber === newItem.phoneNumber) {
                              mergedItems[i] = newItem;
                              replaced = true;
                              break;
                          }
                      }
                      if (!replaced) {
                          mergedItems.push(newItem);
                      }
                  });
              }
              
              const mergedTotal = mergedItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
              const payload = {
                  branchId: activeBranchId,
                  entryDate: rowDate,
                  mode: entryMode,
                  recordType: recordType,
                  items: mergedItems,
                  totalAmount: mergedTotal,
                  authorId: user?.id,
                  authorEmail: user?.email,
                  location: user?.latestLocation || null,
              };

              if (existingId) {
                  const { error: upsertError } = await supabase
                    .from('entries')
                    .upsert({ ...payload, id: existingId }, { onConflict: 'id' });
                  if (upsertError) throw new Error(upsertError.message);
              } else {
                  const { error: upsertError } = await supabase
                    .from('entries')
                    .upsert({ ...payload, createdAt: new Date().toISOString() });
                  if (upsertError) throw new Error(upsertError.message);
              }
          }`
);

// 5. Staging Modal UI (overflow-x-auto, columns)
content = content.replace(
    /<div className="overflow-auto min-h-0 max-h-full p-0">/,
    `<div className="overflow-x-auto overflow-y-auto max-w-full min-h-0 max-h-full p-0">`
);

const newTableHeader = `<TableRow className="border-b border-slate-200 dark:border-white/10 hover:bg-transparent">
                                <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Login Date</TableHead>
                                <TableHead className="w-[130px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Category *</TableHead>
                                <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Product {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-wider text-slate-500">File Login</TableHead>
                                <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Channel Partner {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="w-[140px] font-bold text-[10px] uppercase tracking-wider text-slate-500 min-w-[140px]">Branch Location</TableHead>
                                <TableHead className="w-[180px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Customer Name {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="w-[130px] font-bold text-[10px] uppercase tracking-wider text-slate-500">DOB</TableHead>
                                <TableHead className="w-[130px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Phone No.</TableHead>
                                <TableHead className="w-[160px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Email ID</TableHead>
                                <TableHead className="w-[200px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Customer Address</TableHead>
                                <TableHead className="w-[160px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Firm Name</TableHead>
                                <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Login Amt *</TableHead>
                                <TableHead className="w-[130px] font-bold text-[10px] uppercase tracking-wider text-slate-500">File Status {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="w-[140px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Sanctioned (₹)</TableHead>
                                <TableHead className="w-[140px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Disbursed (₹)</TableHead>
                                <TableHead className="w-[130px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Disbursed Dt</TableHead>
                                <TableHead className="w-[130px] font-bold text-[10px] uppercase tracking-wider text-slate-500">EMI Date</TableHead>
                                <TableHead className="w-[160px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Repayment Bank</TableHead>
                                <TableHead className="w-[180px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Staff Name *</TableHead>
                                <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Manager Name</TableHead>
                                <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Consultant</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>`;

content = content.replace(
    /<TableRow className="border-b border-slate-200 dark:border-white\/10 hover:bg-transparent">[\s\S]*?<\/TableRow>/,
    newTableHeader
);

const newTableBody = `
                                <TableRow key={index} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <TableCell className="p-2"><Input type="date" value={item.date || ''} onChange={e => handleUpdate('date', e.target.value)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <select value={item.category} onChange={e => handleUpdate('category', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="" disabled>Select</option>
                                            <option value="Loan">Loan</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Forex">Forex</option>
                                            <option value="Consultancy">Consultancy</option>
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <select value={item.product} onChange={e => handleUpdate('product', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="" disabled>Select</option>
                                            {allowedProducts(item.category).map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2"><Input value={item.fileLogin || ''} onChange={e => handleUpdate('fileLogin', e.target.value)} disabled={item.category !== 'Loan'} placeholder="e.g. WBO" className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <select value={item.channel || ''} onChange={e => handleUpdate('channel', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="" disabled>Select</option>
                                            {item.category === 'Insurance' 
                                                ? ['Bajaj Allianz', 'Aditya Birla', 'LIC'].map(c => <option key={c} value={c}>{c}</option>)
                                                : channels.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)
                                            }
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <select value={item.branchLocation || ''} onChange={e => handleUpdate('branchLocation', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="" disabled>Select</option>
                                            {branches.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2"><Input value={item.customerName || ''} onChange={e => handleUpdate('customerName', e.target.value)} placeholder="Customer..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input type="date" value={item.customerDOB || ''} onChange={e => handleUpdate('customerDOB', e.target.value)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.phoneNumber || ''} onChange={e => handleUpdate('phoneNumber', e.target.value.replace(/\\D/g,''))} placeholder="Phone..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input type="email" value={item.emailId || ''} onChange={e => handleUpdate('emailId', e.target.value)} placeholder="Email..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.customerAddress || ''} onChange={e => handleUpdate('customerAddress', e.target.value)} placeholder="Address..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.firmName || ''} onChange={e => handleUpdate('firmName', e.target.value)} placeholder="Firm Name..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <NumericFormat
                                            value={item.amount === 0 ? '' : item.amount}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                            onValueChange={(vals) => handleUpdate('amount', vals.floatValue || 0)}
                                            customInput={Input}
                                            placeholder="₹"
                                            className="h-8 text-xs font-medium text-right bg-transparent border-slate-200 dark:border-slate-700"
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <select value={item.fileStatus || ''} onChange={e => handleUpdate('fileStatus', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="" disabled>Status</option>
                                            <option value="Login">Login</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Sanctioned">Sanctioned</option>
                                            <option value="Disbursed">Disbursed</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <NumericFormat
                                            value={item.sanctionedAmount === 0 ? '' : item.sanctionedAmount}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                            onValueChange={(vals) => handleUpdate('sanctionedAmount', vals.floatValue || 0)}
                                            customInput={Input}
                                            placeholder="₹"
                                            className="h-8 text-xs font-medium text-right bg-transparent border-slate-200 dark:border-slate-700"
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <NumericFormat
                                            value={item.disbursedAmount === 0 ? '' : item.disbursedAmount}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                            onValueChange={(vals) => handleUpdate('disbursedAmount', vals.floatValue || 0)}
                                            customInput={Input}
                                            placeholder="₹"
                                            className="h-8 text-xs font-medium text-right bg-transparent border-slate-200 dark:border-slate-700"
                                        />
                                    </TableCell>
                                    <TableCell className="p-2"><Input type="date" value={item.disbursedDate || ''} onChange={e => handleUpdate('disbursedDate', e.target.value)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input type="date" value={item.emiDate || ''} onChange={e => handleUpdate('emiDate', e.target.value)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.repaymentBank || ''} onChange={e => handleUpdate('repaymentBank', e.target.value)} placeholder="Bank..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.staffName || ''} onChange={e => handleUpdate('staffName', e.target.value)} placeholder="Name..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.managerName || ''} onChange={e => handleUpdate('managerName', e.target.value)} placeholder="Manager..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.consultantName || ''} onChange={e => handleUpdate('consultantName', e.target.value)} placeholder="Consultant..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2 text-right">
                                        <button onClick={handleRemove} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                    </TableCell>
                                </TableRow>
`;

content = content.replace(
    /<TableRow key=\{index\} className="group border-b border-slate-100 dark:border-white\/5 hover:bg-slate-50\/50 dark:hover:bg-slate-800\/30 transition-colors">[\s\S]*?<\/TableRow>/,
    newTableBody
);

// Footer validation
content = content.replace(
    /<div className="p-6 border-t border-slate-200 dark:border-white\/10 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800\/50">/,
    `<div className="p-6 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Input 
                            placeholder="Your Name *" 
                            value={lodgeName} 
                            onChange={e => setLodgeName(e.target.value)} 
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs w-full md:w-48"
                        />
                        <Input 
                            placeholder="Your @siroiforex.com Email *" 
                            value={lodgeEmail} 
                            onChange={e => setLodgeEmail(e.target.value)} 
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs w-full md:w-56"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">`
);

content = content.replace(
    /<Button onClick=\{handleBulkSubmit\} disabled=\{isBulkSubmitting \|\| stagedItems\.length === 0\} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-\[160px\]">/,
    `<Button onClick={handleBulkSubmit} disabled={isBulkSubmitting || stagedItems.length === 0 || !lodgeName || !lodgeEmail.endsWith('@siroiforex.com')} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px]">`
);

content = content.replace(
    /<Button variant="secondary" onClick=\{\(\) => \{ setIsStagingModalOpen\(false\); setStagedItems\(\[\]\); setStagedFile\(null\); \}\}>Discard<\/Button>/,
    `<Button variant="secondary" onClick={() => { setIsStagingModalOpen(false); setStagedItems([]); setStagedFile(null); }}>Discard</Button>`
);
// fix the closing div for footer
content = content.replace(
    /Approve & Lodge<\/><\/Button>\n                <\/div>/,
    `Approve & Lodge</></Button>\n                    </div>\n                </div>`
);


fs.writeFileSync(targetFile, content);
console.log('Patched EntryPage.tsx successfully.');
