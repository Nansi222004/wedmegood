import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const dir = path.join(__dirname, 'src', 'modules', 'vendor');

walkDir(dir, function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Core hex
    content = content.replace(/#ec4899/gi, '#D28A8C'); // primary
    content = content.replace(/#db2777/gi, '#C27A7C'); // dark
    content = content.replace(/#be185d/gi, '#A35E60'); // darker
    
    // Light pink HEX backgrounds
    content = content.replace(/#fdf2f8/gi, '#FAF2F2');
    content = content.replace(/#fce7f3/gi, '#F4DFDF');
    
    // RGB glow colors
    content = content.replace(/236,\s*72,\s*153/g, '210, 138, 140');
    
    // Tailwind specific colors
    content = content.replace(/text-pink-500/g, 'text-[#D28A8C]');
    content = content.replace(/bg-pink-500/g, 'bg-[#D28A8C]');
    content = content.replace(/border-pink-500/g, 'border-[#D28A8C]');
    content = content.replace(/from-pink-500/g, 'from-[#D28A8C]');
    content = content.replace(/to-pink-500/g, 'to-[#D28A8C]');
    content = content.replace(/via-pink-500/g, 'via-[#D28A8C]');
    
    content = content.replace(/text-pink-600/g, 'text-[#C27A7C]');
    content = content.replace(/bg-pink-600/g, 'bg-[#C27A7C]');
    content = content.replace(/border-pink-600/g, 'border-[#C27A7C]');
    content = content.replace(/from-pink-600/g, 'from-[#C27A7C]');
    content = content.replace(/to-pink-600/g, 'to-[#C27A7C]');
    content = content.replace(/via-pink-600/g, 'via-[#C27A7C]');
    
    content = content.replace(/text-pink-700/g, 'text-[#A35E60]');
    content = content.replace(/bg-pink-700/g, 'bg-[#A35E60]');
    content = content.replace(/border-pink-700/g, 'border-[#A35E60]');
    
    content = content.replace(/text-pink-300/g, 'text-[#E6B3B4]');
    
    content = content.replace(/bg-pink-50\b/g, 'bg-[#FAF2F2]');
    content = content.replace(/bg-pink-100\b/g, 'bg-[#F4DFDF]');
    content = content.replace(/border-pink-50\b/g, 'border-[#FAF2F2]');
    content = content.replace(/border-pink-100\b/g, 'border-[#F4DFDF]');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
