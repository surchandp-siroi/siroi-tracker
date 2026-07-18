const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].replace(/["']/g, '');
  }
});
const { createClient } = require('@supabase/supabase-js');


const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findDuplicates() {
  console.log('Fetching all entries...');
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, branchId, entryDate, mode, recordType, items, totalAmount');

  if (error) {
    console.error('Error fetching entries:', error);
    return;
  }

  console.log(`Found ${entries.length} total entries.`);

  const map = new Map();
  const duplicates = [];

  for (const entry of entries) {
    const key = `${entry.branchId}_${entry.entryDate}_${entry.mode}_${entry.recordType}`;
    if (map.has(key)) {
      duplicates.push({ existing: map.get(key), duplicate: entry });
    } else {
      map.set(key, entry);
    }
  }

  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicate entry records!`);
    for (const d of duplicates) {
      console.log(`Duplicate: Branch ${d.duplicate.branchId}, Date ${d.duplicate.entryDate}, Mode ${d.duplicate.mode}`);
      console.log(`  Existing ID: ${d.existing.id}, Amount: ${d.existing.totalAmount}`);
      console.log(`  Duplicate ID: ${d.duplicate.id}, Amount: ${d.duplicate.totalAmount}`);
    }
  } else {
    console.log('No duplicate entry records found.');
  }

  // Also check if any single entry has duplicate items inside it
  console.log('Checking for duplicate items within entries...');
  for (const entry of entries) {
    if (!entry.items) continue;
    
    // Check if items has duplicate tracking numbers or combinations
    const itemMap = new Set();
    let hasDuplicateItem = false;
    for (const item of entry.items) {
      // Create a unique key for the item
      const key = `${item.trackingNumber || ''}_${item.amount}_${item.product}_${item.category}`;
      if (itemMap.has(key)) {
        hasDuplicateItem = true;
        break;
      }
      itemMap.add(key);
    }

    if (hasDuplicateItem) {
      console.log(`Entry ID ${entry.id} (Branch ${entry.branchId}, Date ${entry.entryDate}) has duplicate items inside its JSON!`);
      console.log(`  Items count: ${entry.items.length}, Amount: ${entry.totalAmount}`);
    }
  }
}

findDuplicates();
