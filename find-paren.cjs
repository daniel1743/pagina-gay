const fs = require('fs');
const content = fs.readFileSync('src/pages/ChatPage.jsx', 'utf8');
const lines = content.split('\n');
let opens = 0, closes = 0;

for (let i = 0; i < Math.min(820, lines.length); i++) {
  const line = lines[i];
  let o = 0, c = 0;
  for (const ch of line) {
    if (ch === '(') { o++; opens++; }
    if (ch === ')') { c++; closes++; }
  }
  const balance = opens - closes;
  if (balance > 0 && i >= 410 && i < 440) {
    console.log(`Line ${i+1}: Balance ${balance} | ${line.trim().substring(0,70)}`);
  }
}

console.log(`\nTotal: Opens: ${opens}, Closes: ${closes}, Difference: ${opens-closes}`);
