const fs = require('fs');
let content = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf-8');
const startTag = '<div className="md:hidden">';
const endTag = '<div className="hidden md:block">';
const startIdx = content.indexOf(startTag);
const endIdx = content.indexOf(endTag);
if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx + endTag.length);
}
content = content.replace(/const \[selectedProduct, setSelectedProduct\] = useState.*?;\n/g, '');
const lastDivIdx = content.lastIndexOf('</div>\n    </>');
if (lastDivIdx !== -1) {
  content = content.substring(0, lastDivIdx) + '\n    </>' + content.substring(lastDivIdx + '</div>\n    </>'.length);
}
fs.writeFileSync('src/pages/DashboardPage.tsx', content);
console.log('Fixed');
