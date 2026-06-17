const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

const targetStr = "} , Calendar } from 'lucide-react';";
const replacementStr = ", Calendar } from 'lucide-react';";

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/pages/EntryPage.tsx', content);
console.log("Fixed import successfully!");
