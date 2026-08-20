const fs = require('fs');

let content = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

content = content.replace(
  /\{kpiMetrics\[kpiCategory\]\?\.ftdCount \|\| 0\} (\{kpiCategory === 'All Products' \? 'Entries' : .*? 'Entries'\})/g,
  '{kpiMetrics[kpiCategory]?.ftdCount || 0} <span className="hidden sm:inline">$1</span>'
);

content = content.replace(
  /\{kpiMetrics\[kpiCategory\]\?\.mtdCount \|\| 0\} (\{kpiCategory === 'All Products' \? 'Entries' : .*? 'Entries'\})/g,
  '{kpiMetrics[kpiCategory]?.mtdCount || 0} <span className="hidden sm:inline">$1</span>'
);

content = content.replace(
  /\{kpiMetrics\[kpiCategory\]\?\.ytdCount \|\| 0\} (\{kpiCategory === 'All Products' \? 'Entries' : .*? 'Entries'\})/g,
  '{kpiMetrics[kpiCategory]?.ytdCount || 0} <span className="hidden sm:inline">$1</span>'
);

// For Daily Target Pipeline:
content = content.replace(
  /(<span className="[^"]+shrink-0 whitespace-nowrap ml-1[^"]*">)\s*Pipeline\s*(<\/span>)/g,
  '$1<span className="hidden sm:inline">Pipeline</span>$2'
);

// Also change "tracking-widest" to "tracking-wide" in those blocks, and remove "truncate" from "FTD Summary", etc.
content = content.replace(/tracking-widest (text-[a-z]+-600) dark:(text-[a-z]+-400) block truncate/g, "tracking-wide $1 dark:$2 block");

// And also replace `{kpiCategory}` truncate block to use `leading-tight line-clamp-2` instead of `truncate block`
content = content.replace(/truncate block mt-0.5">\s*\{kpiCategory\}\s*<\/span>/g, "leading-tight line-clamp-2 mt-0.5\">\n                    {kpiCategory}\n                  </span>");
content = content.replace(/truncate block mt-0.5">\s*All Branches\s*<\/span>/g, "leading-tight line-clamp-2 mt-0.5\">\n                    All Branches\n                  </span>");

fs.writeFileSync('src/pages/DashboardPage.tsx', content);
console.log("Done");
