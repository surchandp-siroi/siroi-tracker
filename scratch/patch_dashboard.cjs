const fs = require('fs');

function patchDashboard() {
    let content = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf-8');

    // 1. Update KPI calculations (ftdBusiness, mtdBusiness, ytdBusiness, projectedTotalBusinessToday)
    const kpiRegex = /const { ftdBusiness, mtdBusiness, ytdBusiness, projectedTotalBusinessToday } = useMemo\(\(\) => {[\s\S]*?}, \[entries, selectedDate\]\);/;
    
    const newKpiBlock = `const { ftdBusiness, mtdBusiness, ytdBusiness, projectedTotalBusinessToday } = useMemo(() => {
     let ftd = 0, mtd = 0, ytd = 0, projToday = 0;
     const sd = new Date(selectedDate);
     const sdYear = sd.getFullYear();
     const sdMonth = sd.getMonth();
     
     const sdIsNewFY = sdMonth >= 3;
     const sdFyStart = sdIsNewFY ? sdYear : sdYear - 1;
     
     entries.forEach(entry => {
         let entryProj = 0;
         let entryAch = 0;
         
         if (entry.items && Array.isArray(entry.items)) {
             entry.items.forEach((item: any) => {
                 entryProj += (Number(item.amount) || 0);
                 entryAch += (Number(item.disbursedAmount) || 0);
             });
         }

         if (entry.entryDate === selectedDate) {
             projToday += entryProj;
         }

         const ed = new Date(entry.entryDate);
         const edYear = ed.getFullYear();
         const edMonth = ed.getMonth();
         const edIsNewFY = edMonth >= 3;
         const edFyStart = edIsNewFY ? edYear : edYear - 1;

         if (edFyStart === sdFyStart && ed <= sd) {
             ytd += entryAch;
             if (edMonth === sdMonth && edYear === sdYear) {
                 mtd += entryAch;
                 if (entry.entryDate === selectedDate) {
                     ftd += entryAch;
                 }
             }
         }
     });
     return { ftdBusiness: ftd, mtdBusiness: mtd, ytdBusiness: ytd, projectedTotalBusinessToday: projToday };
  }, [entries, selectedDate]);`;

    content = content.replace(kpiRegex, newKpiBlock);

    // 2. Update filteredBranches and totalBusiness
    const fbRegex = /const { filteredBranches, totalBusiness, businessByCategory } = useMemo\(\(\) => {[\s\S]*?}, \[filteredEntries, branches, selectedBusinessBranch\]\);/;

    const newFbBlock = `const { filteredBranches, totalBusiness, businessByCategory } = useMemo(() => {
     const branchMap = new Map();
     branches.forEach(b => {
         const initialCategories = CATEGORIES.reduce((acc, c) => {
             acc[\`proj_\${c}\`] = 0;
             acc[\`ach_\${c}\`] = 0;
             return acc;
         }, {} as any);

         branchMap.set(b.id, { 
             ...b, 
             dailyAchievement: 0,
             dailyProjection: 0,
             ...initialCategories
         });
     });

     let total = 0;
     const catMap = new Map();

     filteredEntries.forEach(entry => {
          const b = branchMap.get(entry.branchId);
          if (!b) return;

          let entryProj = 0;
          let entryAch = 0;

          if (entry.items && Array.isArray(entry.items)) {
              entry.items.forEach((item: any) => {
                  const pAmt = Number(item.amount) || 0;
                  const aAmt = Number(item.disbursedAmount) || 0;
                  
                  entryProj += pAmt;
                  entryAch += aAmt;

                  b[\`proj_\${item.category}\`] = (b[\`proj_\${item.category}\`] || 0) + pAmt;
                  b[\`ach_\${item.category}\`] = (b[\`ach_\${item.category}\`] || 0) + aAmt;
                  
                  if (selectedBusinessBranch === 'all' || selectedBusinessBranch === b.id) {
                      catMap.set(item.category, (catMap.get(item.category) || 0) + aAmt);
                  }
              });
          }

          b.dailyProjection += entryProj;
          b.dailyAchievement += entryAch;
          total += entryAch;
     });

     const fb = Array.from(branchMap.values());
     const rbC = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

     return { filteredBranches: fb, totalBusiness: total, businessByCategory: rbC };
  }, [filteredEntries, branches, selectedBusinessBranch]);`;

    content = content.replace(fbRegex, newFbBlock);

    fs.writeFileSync('src/pages/DashboardPage.tsx', content, 'utf-8');
    console.log("Dashboard Page patched successfully!");
}

patchDashboard();
