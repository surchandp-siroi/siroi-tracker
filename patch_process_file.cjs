const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf-8');

const anchorRegex = /const processFile = async \(file: File\) => \{[\s\S]*?finally \{\s*setIsParsing\(false\);\s*\}\s*\};/;

const replacement = `const processFile = async (file: File) => {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
          setError("Smart upload unavailable. Contact admin to set Gemini API key.");
          return;
      }
      
      setIsParsing(true);
      setUploadProgress(0);
      setError('');
      
      try {
          // Asynchronous reading to unblock UI thread
          const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
              const reader = new FileReader();
              reader.onprogress = (e) => {
                  if (e.lengthComputable) {
                      const percent = Math.round((e.loaded / e.total) * 30); // Reading is 30%
                      setUploadProgress(percent);
                  }
              };
              reader.onload = () => resolve(reader.result as ArrayBuffer);
              reader.onerror = () => reject(reader.error);
              reader.readAsArrayBuffer(file);
          });
          
          setUploadProgress(40);
          await new Promise(resolve => setTimeout(resolve, 50)); // Yield thread to allow UI to update

          const workbook = XLSX.read(buffer, { type: 'array' });
          setUploadProgress(50);
          await new Promise(resolve => setTimeout(resolve, 50)); // Yield thread
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (json.length === 0) {
              setError("The uploaded file appears to be empty.");
              setIsParsing(false);
              return;
          }

          setUploadProgress(60);
          
          const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
          const prompt = \`
            You are a strict data extraction AI. Extract financial entry data from the following raw JSON representing an uploaded Excel/CSV file.
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
            \${JSON.stringify(json).substring(0, 50000)} // Limiting to ~50k chars to avoid token limits
          \`;
          
          setUploadProgress(70);
          const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
          });
          setUploadProgress(90);
          
          const text = response.text || "[]";
          const _clean = text.replace(new RegExp('\`\`\`json', 'g'), '').replace(new RegExp('\`\`\`', 'g'), '').trim();
          let parsed = JSON.parse(_clean);
          
          setUploadProgress(100);

          if (Array.isArray(parsed) && parsed.length > 0) {
              // STRICT SEPARATION: Set staged items and open modal
              parsed = parsed.map((p: any) => ({ ...p, isManual: true, projectionAmt: p.projectionAmt || 0 }));
              setStagedItems(parsed);
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
          // Wait briefly before resetting progress so user sees 100%
          setTimeout(() => setUploadProgress(0), 1000);
      }
  };`;

if (anchorRegex.test(content)) {
    content = content.replace(anchorRegex, replacement);
    fs.writeFileSync('src/pages/EntryPage.tsx', content, 'utf-8');
    console.log("processFile patched successfully.");
} else {
    console.log("processFile not found!");
}
