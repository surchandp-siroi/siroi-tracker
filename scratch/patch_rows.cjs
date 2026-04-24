const fs = require('fs');

function rewriteRows() {
    let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf-8');

    // For Main Table Row
    const mainTableRowRegex = /{\/\* 4\. File Login \*\/}[\s\S]*?{\/\* Remove Button \*\/}/;
    const match = content.match(mainTableRowRegex);
    if (!match) {
        console.error("Could not find main table row block");
        return;
    }
    
    // We will do replacements within the block to adjust numbers.
    let block = match[0];
    
    // Insert 4. Relationship Manager Name before 4. File Login
    const relationshipManagerCell = `
                                    {/* 4. Relationship Manager Name */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.relationshipManagerName || ''}
                                            onChange={(e) => handleUpdateItem(index, 'relationshipManagerName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 5. File Login */}`;
    block = block.replace(/{\/\* 4\. File Login \*\/}/, relationshipManagerCell);
    
    // Renumber the rest
    block = block.replace(/{\/\* 5\. Channel Partner \*\/}/, '{/* 6. Channel Partner */}');
    block = block.replace(/{\/\* 6\. Branch \*\/}/, '{/* 7. Branch */}');
    block = block.replace(/{\/\* 7\. Customer Name \*\/}/, '{/* 8. Customer Name */}');
    block = block.replace(/{\/\* 8\. DOB \*\/}/, '{/* 9. DOB */}');
    block = block.replace(/{\/\* 9\. Phone No\. \*\/}/, '{/* 10. Phone No. */}');
    block = block.replace(/{\/\* 10\. Email ID \*\/}/, '{/* 11. Email ID */}');
    block = block.replace(/{\/\* 11\. Customer Address \*\/}/, '{/* 12. Customer Address */}');
    block = block.replace(/{\/\* 12\. Firm Name \*\/}/, '{/* 13. Firm Name */}');
    block = block.replace(/{\/\* 13\. Login Amt \(₹\) \*\/}/, '{/* 14. Login Amt (₹) */}');
    block = block.replace(/{\/\* 14\. File Status \*\/}/, '{/* 15. File Status */}');
    block = block.replace(/{\/\* 15\. Sanctioned \(₹\) \*\/}/, '{/* 16. Sanctioned (₹) */}');
    block = block.replace(/{\/\* 16\. Disbursed \(₹\) \*\/}/, '{/* 17. Disbursed (₹) */}');
    block = block.replace(/{\/\* 17\. Disbursed Dt \*\/}/, '{/* 18. Disbursed Dt */}');
    block = block.replace(/{\/\* 18\. EMI Date \*\/}/, '{/* 19. EMI Date */}');
    block = block.replace(/{\/\* 19\. Repayment Bank \*\/}/, '{/* 20. Repayment Bank */}');
    block = block.replace(/{\/\* 20\. Staff Name \*\/}/, '{/* 21. Staff Name */}');
    block = block.replace(/{\/\* 21\. Manager Name \*\/}/, '{/* 22. Manager Name */}');
    
    // Now handle the old 22. Relationship Manager Name -> 23. Consultant
    block = block.replace(/{\/\* 22\. Relationship Manager Name \*\/}/, '{/* 23. Consultant */}');
    
    // Ensure the last column uses consultantName
    // Wait, the old 22 was using `consultantName` already (because my previous script just renamed the label in the header but left `item.consultantName` intact).
    // Let's ensure the label and everything is correct.
    
    content = content.replace(mainTableRowRegex, block);
    
    // For Staging Modal Row
    // Staging modal row doesn't have number comments, it's just a bunch of <TableCell> in order.
    // Let's find the TableBody of Staging Modal
    const stagingModalBodyRegex = /<TableBody>[\s\S]*?{stagedItems\.map\(\(item, index\) => {[\s\S]*?<TableRow[\s\S]*?<\/TableRow>[\s\S]*?}\)}[\s\S]*?<\/TableBody>/;
    
    const stagingMatch = content.match(stagingModalBodyRegex);
    if (!stagingMatch) {
        console.error("Could not find staging table body block");
        return;
    }
    
    let stagingBlock = stagingMatch[0];
    
    // We need to inject the Relationship Manager cell after the Product cell
    // Let's find the Product cell:
    /*
                                    <TableCell className="p-2">
                                        <select value={item.product || ''} onChange={e => handleUpdate('product', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="">Select...</option>
                                            {allowedProducts(item.category || 'Loan').map((p: any) => (
                                                <option key={p.id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </TableCell>
    */
    const productCellRegex = /<TableCell className="p-2">\s*<select value={item\.product \|\| ''}[\s\S]*?<\/select>\s*<\/TableCell>/;
    const rmStagingCell = `
                                    <TableCell className="p-2">
                                        <Input value={item.relationshipManagerName || ''} onChange={e => handleUpdate('relationshipManagerName', e.target.value)} placeholder="RM Name..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" />
                                    </TableCell>`;
                                    
    stagingBlock = stagingBlock.replace(productCellRegex, match => match + rmStagingCell);
    
    // Finally, at the end of Staging Modal Row, there's `item.consultantName`. Let's just make sure placeholder says "Consultant..."
    stagingBlock = stagingBlock.replace(/onChange={e => handleUpdate\('consultantName', e\.target\.value\)} placeholder="[^"]+"/g, 'onChange={e => handleUpdate(\'consultantName\', e.target.value)} placeholder="Consultant..."');
    
    content = content.replace(stagingModalBodyRegex, stagingBlock);
    
    fs.writeFileSync('src/pages/EntryPage.tsx', content, 'utf-8');
    console.log("Rows rewritten!");
}

rewriteRows();
