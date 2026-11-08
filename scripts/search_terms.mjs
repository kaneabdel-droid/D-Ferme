import fs from 'fs';
import path from 'path';

const baseDir = 'C:\\.antigravity-ide\\DEMBA\\d-ferme';

function searchInDir(dir, terms) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchInDir(fullPath, terms);
    } else if (entry.isFile() && /\.(ts|tsx|js|mjs|json|sql)$/.test(entry.name)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const term of terms) {
          const regex = new RegExp(term, 'gi');
          const matches = content.match(regex);
          if (matches) {
            console.log(`Found "${term}" (${matches.length} times) in: ${fullPath.replace(baseDir, '')}`);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

searchInDir(baseDir, ['conditionnement', 'achat', 'article', 'intrant', 'fournisseur']);
