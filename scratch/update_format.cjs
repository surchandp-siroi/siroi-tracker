const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

const effectRegex = /useEffect\(\(\) => \{\s*const timer = setInterval\(\(\) => \{\s*const now = new Date\(\);\s*const dateStr = now\.toLocaleDateString\('en-US', \{ day: 'numeric', month: 'short' \}\);\s*const timeStr = now\.toLocaleTimeString\('en-US', \{ hour: '2-digit', minute: '2-digit', hour12: true \}\);\s*setCurrentTime\(`\$\{dateStr\}, \$\{timeStr\}`\);\s*\}, 1000\);\s*const initialNow = new Date\(\);\s*setCurrentTime\(`\$\{initialNow\.toLocaleDateString\('en-US', \{ day: 'numeric', month: 'short' \}\)\}, \$\{initialNow\.toLocaleTimeString\('en-US', \{ hour: '2-digit', minute: '2-digit', hour12: true \}\)\}`\);\s*return \(\) => clearInterval\(timer\);\s*\}, \[\]\);/;

const newEffect = `useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        setCurrentTime(\`\${dateStr}, \${timeStr}\`);
    }, 1000);
    
    const initialNow = new Date();
    setCurrentTime(\`\${initialNow.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, \${initialNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}\`);
    
    return () => clearInterval(timer);
  }, []);`;

content = content.replace(effectRegex, newEffect);

const spanRegex = /<span className=\"absolute right-8 top-1\/2 -translate-y-1\/2 text-\[10px\] font-mono text-slate-500 pointer-events-none\">/g;
const newSpan = '<span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">';

content = content.replace(spanRegex, newSpan);

fs.writeFileSync('src/pages/EntryPage.tsx', content);
console.log('Done format and font size');
