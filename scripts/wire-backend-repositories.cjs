// Mechanical adapter generation: retain the existing demo implementation behind
// an explicit mode switch, preserving each public function's inferred TS type.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../apps/web/node_modules/typescript');
const dir = path.join(__dirname, '../apps/web/src/lib/storage/repositories');
for (const filename of fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts')) {
  const file = path.join(dir, filename);
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes('// Backend adapters')) continue;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const edits = [], wrappers = [];
  for (const node of ast.statements) {
    if (!ts.isFunctionDeclaration(node) || !node.name || !node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || !node.modifiers.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) continue;
    const name = node.name.text, demo = `demo_${name}`;
    edits.push({ start: node.name.getStart(ast), end: node.name.end, text: demo });
    const ex = node.modifiers.find(m => m.kind === ts.SyntaxKind.ExportKeyword);
    edits.push({ start: ex.getStart(ast), end: ex.end, text: '' });
    wrappers.push(`export const ${name}: typeof ${demo} = (...args) => backendEnabled ? remote("${filename.slice(0,-3)}.${name}", args) : ${demo}(...args);`);
  }
  for (const e of edits.sort((a,b) => b.start-a.start)) source = source.slice(0,e.start)+e.text+source.slice(e.end);
  fs.writeFileSync(file, 'import { backendEnabled } from "@/lib/backend/config";\nimport { remote } from "@/lib/backend/browser";\n'+source+'\n// Backend adapters\n'+wrappers.join('\n')+'\n');
}
