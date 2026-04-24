const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf-8');

const anchor = `      } finally {
          setIsDeleting(false);
      }
  };`;

const insert = `

  const handleBulkSubmit = async () => {
      if (!stagedFile || stagedItems.length === 0) return;
      if (!activeBranchId) {
          setError("You do not have a branch assigned yet. Contact Administrator.");
          return;
      }
      
      setIsBulkSubmitting(true);
      setError('');
      setSuccess('');
      
      try {
          const fileExt = stagedFile.name.split('.').pop();
          const fileName = \`\${Date.now()}_\${Math.random().toString(36).substring(2)}.\${fileExt}\`;
          const { data: uploadData, error: uploadError } = await supabase.storage
              .from('bulk_uploads')
              .upload(fileName, stagedFile);
              
          if (uploadError) throw new Error(\`File upload failed: \${uploadError.message}\`);
          
          const fileUrl = uploadData.path;
          
          const { error: auditError } = await supabase
              .from('upload_audit_logs')
              .insert({
                  filename: stagedFile.name,
                  uploaded_by: user?.email || 'unknown',
                  file_url: fileUrl
              });
              
          if (auditError) throw new Error(\`Audit log failed: \${auditError.message}\`);
          
          const itemsByDate = new Map<string, EntryItem[]>();
          stagedItems.forEach(item => {
              const d = item.date || dateStr;
              if (!itemsByDate.has(d)) itemsByDate.set(d, []);
              itemsByDate.get(d)!.push(item);
          });
          
          for (const [rowDate, rItems] of itemsByDate.entries()) {
              const totalAmt = rItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
              const payload = {
                  branchId: activeBranchId,
                  entryDate: rowDate,
                  mode: entryMode,
                  recordType: recordType,
                  items: rItems,
                  totalAmount: totalAmt,
                  authorId: user?.id,
                  authorEmail: user?.email,
                  location: user?.latestLocation || null,
              };
              
              const { data: existing } = await supabase
                .from('entries')
                .select('id, items')
                .eq('branchId', activeBranchId)
                .eq('entryDate', rowDate)
                .eq('mode', entryMode)
                .eq('recordType', recordType)
                .limit(1);
                
              if (existing && existing.length > 0) {
                  const mergedItems = [...(existing[0].items || []), ...rItems];
                  const mergedTotal = mergedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                  
                  const { error: updateError } = await supabase
                    .from('entries')
                    .update({ items: mergedItems, totalAmount: mergedTotal, authorId: user?.id, authorEmail: user?.email })
                    .eq('id', existing[0].id);
                  if (updateError) throw new Error(updateError.message);
              } else {
                  const { error: insertError } = await supabase
                    .from('entries')
                    .insert([{ ...payload, createdAt: new Date().toISOString() }]);
                  if (insertError) throw new Error(insertError.message);
              }
          }
          
          setSuccess("Bulk upload successfully lodged to respective dates.");
          setIsStagingModalOpen(false);
          setStagedItems([]);
          setStagedFile(null);
          
      } catch(e: any) {
          console.error("Bulk submit error:", e);
          setError(e.message || "Failed to lodge bulk upload.");
      } finally {
          setIsBulkSubmitting(false);
      }
  };`;

const anchorRegex = /      \} finally \{\r?\n          setIsDeleting\(false\);\r?\n      \}\r?\n  \};/;

if (anchorRegex.test(content)) {
    content = content.replace(anchorRegex, anchor + insert);
    fs.writeFileSync('src/pages/EntryPage.tsx', content, 'utf-8');
    console.log("handleBulkSubmit inserted successfully.");
} else {
    console.log("anchor not found!");
}
