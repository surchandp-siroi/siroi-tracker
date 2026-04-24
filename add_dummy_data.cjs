require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const branches = [
  { id: 'b1', name: 'Guwahati' },
  { id: 'b2', name: 'Manipur' },
  { id: 'b3', name: 'Itanagar' },
  { id: 'b4', name: 'Nagaland & Mizoram' }
];

const products = [
  { name: 'Personal Loan', category: 'Loan' },
  { name: 'General Insurance', category: 'Insurance' },
  { name: 'Currency Exchange', category: 'Forex' },
  { name: 'GST filing', category: 'Consultancy' },
  { name: 'SIP & Mutual Fund', category: 'Investments' }
];

const channels = ['HDFC BANK', 'ICICI BANK', 'Axis Bank', 'Bajaj Finserv'];

async function insertDummyData() {
  const entries = [];
  const today = new Date().toISOString().split('T')[0];

  // For each branch
  for (const branch of branches) {
    // 1 Projection entry for today
    entries.push({
      branchId: branch.id,
      entryDate: today,
      mode: 'daily',
      recordType: 'projection',
      items: [
        {
          date: today,
          staffName: 'Admin Staff',
          customerName: 'Projected Total',
          category: 'Loan',
          product: 'Personal Loan',
          channel: 'HDFC BANK',
          amount: 5000000,
          status: 'Projection',
          projectionAmt: 5000000
        }
      ],
      totalAmount: 5000000,
      authorId: '00000000-0000-0000-0000-000000000000',
      authorEmail: 'admin@siroiforex.com'
    });

    // 5 Achievement entries for today
    for (let i = 0; i < 5; i++) {
      const prod = products[i % products.length];
      const chan = channels[i % channels.length];
      const amt = 100000 * (i + 1);
      
      entries.push({
        branchId: branch.id,
        entryDate: today,
        mode: 'daily',
        recordType: 'achievement',
        items: [
          {
            date: today,
            staffName: 'Sales Exec ' + (i + 1),
            customerName: 'Dummy Customer ' + (i + 1),
            category: prod.category,
            product: prod.name,
            channel: chan,
            amount: amt,
            status: 'Done',
            fileStatus: 'Disbursed',
            disbursedAmount: amt,
            disbursedDate: today
          }
        ],
        totalAmount: amt,
        authorId: '00000000-0000-0000-0000-000000000000',
        authorEmail: 'admin@siroiforex.com'
      });
    }
  }

  const { data, error } = await supabase.from('entries').insert(entries);
  
  if (error) {
    console.error("Error inserting dummy data:", error);
  } else {
    console.log("Successfully inserted", entries.length, "dummy records!");
  }
}

insertDummyData();
