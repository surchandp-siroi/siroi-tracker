const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

const targetStr = "from 'lucide-react';";
const replacementStr = ", Calendar } from 'lucide-react';";

if (content.includes("Calendar } from 'lucide-react'")) {
   console.log("Calendar is already imported!");
} else if (content.includes("from 'lucide-react';")) {
   content = content.replace("from 'lucide-react';", replacementStr);
   fs.writeFileSync('src/pages/EntryPage.tsx', content);
   console.log("Added Calendar import successfully!");
} else {
   console.log("Could not find the lucide-react import!");
}
