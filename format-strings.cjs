const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

walk('src').forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    let newC = c.replace(/\.toLocaleString\(\)/g, ".toLocaleString('en-IN')");
    if (c !== newC) {
        fs.writeFileSync(f, newC);
        console.log('Updated ' + f);
    }
});
