const fs = require('fs');
const content = fs.readFileSync('src/pages/ChatPage.jsx', 'utf8');
const lines = content.split('\n');

let stack = [];
for (let i = 0; i < 820; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (ch === '(') {
      stack.push({char: '(', line: i+1, col: j+1, text: line.trim().substring(0, 60)});
    } else if (ch === ')') {
      if (stack.length === 0 || stack[stack.length-1].char !== '(') {
        console.log(`ERROR: Unexpected ')' at line ${i+1}:${j+1}`);
      } else {
        stack.pop();
      }
    }
  }
}

if (stack.length > 0) {
  console.log(`\nUnclosed parentheses: ${stack.length}`);
  console.log('Last unclosed:');
  console.log(`  Line ${stack[stack.length-1].line}: ${stack[stack.length-1].text}`);
}
