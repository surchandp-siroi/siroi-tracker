const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  if(line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if(line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});
const supabase = createClient(url, key);

async function checkEntries() {
  const { data, error } = await supabase.from('entries').select('*').eq('branchId', 'b1').limit(10);
  console.log("Error:", error);
  console.log("Data count:", data ? data.length : 0);
  
  if (data && data.length > 0) {
      console.log("Moving records to Manipur (b2)...");
      const { data: updateData, error: updateError } = await supabase
          .from('entries')
          .update({ branchId: 'b2' })
          .eq('branchId', 'b1')
          .gte('entryDate', '2026-01-01')
          .lte('entryDate', '2026-04-31');
          
      console.log("Update Error:", updateError);
      console.log("Update Data:", updateData);
  }
}
checkEntries();
