const fs = require('fs');

let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf-8');

// 1. Add States
if (!content.includes("const [stagedItems, setStagedItems] = useState<EntryItem[]>([]);")) {
    content = content.replace("const [isDragging, setIsDragging] = useState(false);",
                              "const [isDragging, setIsDragging] = useState(false);\n  const [stagedItems, setStagedItems] = useState<EntryItem[]>([]);\n  const [stagedFile, setStagedFile] = useState<File | null>(null);\n  const [uploadProgress, setUploadProgress] = useState<number>(0);\n  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);\n  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);");
}

// 2. Replace processFile
const processFileRegex = /const processFile = async \(file: File\) => \{[\s\S]*?\n  \};\n\n  const handleFileUpload/;

const new_processFile = `const processFile = async (file: File) => {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
          setError("Smart upload unavailable. Contact admin to set Gemini API key.");
          return;
      }
      
      setIsParsing(true);
      setError('');
      setUploadProgress(0);
      
      try {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (json.length === 0) {
              setError("The uploaded file appears to be empty.");
              setIsParsing(false);
              return;
          }

          const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
          
          const chunkSize = 20; 
          const chunks = [];
          for (let i = 0; i < json.length; i += chunkSize) {
              chunks.push(json.slice(i, i + chunkSize));
          }
          
          let allParsed: any[] = [];
          
          for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              const prompt = \`
                You are a strict data extraction AI. Extract financial entry data from the following raw JSON representing an uploaded Excel/CSV file chunk.
                Ignore junk rows like headers, footers, totals, or blank lines.
                
                Return ONLY a valid JSON array of objects without markdown formatting.
                Each object MUST represent a valid row and have these EXACT keys:
                - "date": Map to Login Date (format YYYY-MM-DD). Use the specific date for the row. Do NOT assume a global date.
                - "staffName": string
                - "customerName": string
                - "category": Must be one of ["Loan", "Insurance", "Forex", "Consultancy"].
                - "product": Must be one of: \${products.map((p: any) => p.name).join(', ')}
                - "fileLogin": string (e.g. WBO, EXPRESS LINK, ILENS) or empty if not applicable.
                - "channel": Must be one of: \${channels.map((c: any) => c.name).join(', ')}. Or Bajaj Allianz, Aditya Birla, LIC if Insurance.
                - "branchLocation": Map to Branch name exactly as: \${branches.map((b: any) => b.name).join(', ')}. Use the specific branch for the row.
                - "customerDOB": string
                - "phoneNumber": string
                - "emailId": string
                - "customerAddress": string
                - "firmName": string
                - "amount": Positive number (Login Amount).
                - "fileStatus": string
                - "sanctionedAmount": number
                - "disbursedAmount": number
                - "disbursedDate": string
                - "emiDate": string
                - "repaymentBank": string
                - "managerName": string
                - "consultantName": string
                
                Raw Spreadsheet JSON:
                \${JSON.stringify(chunk)}
              \`;
              
              const response = await ai.models.generateContent({
                 model: 'gemini-2.5-flash',
                 contents: prompt,
              });
              
              const text = response.text || "[]";
              const _clean = text.replace(new RegExp('\`\`\`json', 'g'), '').replace(new RegExp('\`\`\`', 'g'), '').trim();
              
              try {
                  let parsed = JSON.parse(_clean);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                      parsed = parsed.map((p: any) => ({ ...p, isManual: true, projectionAmt: p.projectionAmt || 0 }));
                      allParsed = [...allParsed, ...parsed];
                  }
              } catch(e) {
                  console.error("Parse error for chunk", i);
              }
              
              setUploadProgress(Math.round(((i + 1) / chunks.length) * 100));
          }
          
          if (allParsed.length > 0) {
              setStagedItems(allParsed);
              setStagedFile(file);
              setIsStagingModalOpen(true);
          } else {
              setError("Could not extract valid entries from the file.");
          }
      } catch (e: any) {
          console.error("AI Parse Error:", e);
          setError("Failed to process file. Ensure it's a valid Excel/CSV with readable data.");
      } finally {
          setIsParsing(false);
          setUploadProgress(0);
      }
  };

  const handleFileUpload`;

content = content.replace(processFileRegex, new_processFile);

// 3. Add handleBulkSubmit
const deleteRegex = /setIsDeleting\(false\);\n      \}\n  \};/;
const handleBulkSubmitStr = `setIsDeleting(false);
      }
  };

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

content = content.replace(deleteRegex, handleBulkSubmitStr);

// 4. Update UI progress text
content = content.replace(/{isParsing \? 'Processing File\.\.\.' : isDragging \? 'Drop File Here' : 'Drag \& Drop or Select Excel\/CSV'}/g, 
  "{isParsing ? `Processing File... ${uploadProgress}%` : isDragging ? 'Drop File Here' : 'Drag & Drop or Select Excel/CSV'}");


fs.writeFileSync('src/pages/EntryPage.tsx', content, 'utf-8');
console.log("Patched EntryPage.tsx");
