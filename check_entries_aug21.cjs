const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jybkjinujujlsvqsercv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YmtqaW51anVqbHN2cXNlcmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTUxMDMsImV4cCI6MjA5MjI3MTEwM30.rS2JwGhXgIXQccZXbPaYDr47zrmoXWn6EcAzoFZMKeI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEntries() {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error fetching entries:', error);
    return;
  }

  console.log("Found entries:", data.length);
  console.log(data);
}

checkEntries();
