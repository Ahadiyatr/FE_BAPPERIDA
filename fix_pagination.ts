import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages/dashboard');
const targetFiles = [
  'MasterBidang.tsx',
  'MasterProgram.tsx',
  'MasterIndikator.tsx',
  'MasterIndikatorUtama.tsx',
  'MasterPeriode.tsx',
  'TransaksiIndikatorBidang.tsx',
  'TransaksiIndikatorDetail.tsx'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Replace text-slate-500 menampikan filteredData.length data with Pagination
  // The layout is usually like:
  /*
        {!loading && (
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
            <div className="text-sm text-slate-500">
              Menampilkan <span className="font-medium">{filteredData.length}</span> data
            </div>
          </div>
        )}
  */

  const paginationMatch = /\{\!loading\s*\&\&\s*\(\s*\<div[^>]+bg-slate-50[^>]*\>[\s\S]*?Menampilkan[\s\S]*?\<\/div\>\s*\)\}/;

  if (paginationMatch.test(content)) {
    content = content.replace(paginationMatch, 
      `{!loading && filteredData.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}`);
    changed = true;
  }

  // There might be another variation
  const paginationMatch2 = /\{\!loading\s*\&\&\s*\(\s*\<div[^>]*\>\s*Menampilkan[\s\S]*?\<\/div\>\s*\)\}/;
  if (!changed && paginationMatch2.test(content)) {
    content = content.replace(paginationMatch2, 
      `{!loading && filteredData.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`No match in ${filePath}`);
  }
}

targetFiles.forEach(f => {
  const filePath = path.join(pagesDir, f);
  if (fs.existsSync(filePath)) {
    processFile(filePath);
  }
});
