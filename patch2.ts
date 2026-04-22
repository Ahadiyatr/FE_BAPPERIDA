import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages/dashboard');
const targetFiles = [
  'TransaksiIndikatorBidang.tsx',
  'TransaksiIndikatorDetail.tsx'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Add imports
  if (!content.includes('import Swal from "sweetalert2";')) {
    content = content.replace(/(import .* from "lucide-react";)/, `$1\nimport Swal from "sweetalert2";\nimport { Toast } from "../../utils/toast";\nimport Pagination from "../../components/Pagination";`);
    changed = true;
  }

  // Add Pagination states
  if (!content.includes('const ITEMS_PER_PAGE = 10;')) {
    content = content.replace(/const \[search\, setSearch\] \= useState\(\"\"\)\;/, 
        `const [search, setSearch] = useState("");\n  const [currentPage, setCurrentPage] = useState(1);\n  const ITEMS_PER_PAGE = 10;`);
    changed = true;
  }
  
  // Replace map
  if (!content.includes('paginatedData.map')) {
    content = content.replace(/filteredData\.map\(\s*\(\s*item\,\s*index\s*\)\s*\=\>\s*\(/g, 'paginatedData.map((item, index) => (');
    changed = true;
  }
  
  // Empty data check
  if (!content.includes('paginatedData.length === 0')) {
    content = content.replace(/filteredData\.length\s*\=\=\=\s*0/g, 'paginatedData.length === 0');
    changed = true;
  }

  // Row Indexing
  if (!content.includes('{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}')) {
    content = content.replace(/\{\s*index\s*\+\s*1\s*\}/g, '{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}');
    changed = true;
  }

  // Inject Paginated data logic and effect
  if (!content.includes('const paginatedData =')) {
    content = content.replace(/return\s*\(\s*\<div/g, `const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);\n  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);\n\n  useEffect(() => {\n    setCurrentPage(1);\n  }, [search]);\n\n  return (\n    <div`);
    changed = true;
  }

  // Pagination Element
  if (!content.includes('<Pagination')) {
    content = content.replace(/\{\s*\!\s*loading\s*\&\&\s*\(\s*\<div\s*className\=\"bg-slate-50\s*px-6\s*py-3\s*border-t\s*border-slate-200\s*flex\s*items-center\s*justify-between\s*text-sm\s*text-slate-500\"\>\s*Menampilkan\s*\<span\s*className\=\"font-medium\"\>\{filteredData\.length\}\<\/span\>\s*data\s*\<\/div\>\s*\)\s*\}/g, 
      `{!loading && filteredData.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}`);
    changed = true;
  }

  // Sweet alert form success
  if (content.includes('handleCloseModal();\n      fetchData();')) {
     if(!content.includes('Toast.fire({')) {
        content = content.replace(/handleCloseModal\(\)\;\s*fetchData\(\)\;(?!\s*Toast\.fire)/g, 
        `handleCloseModal();\n      fetchData();\n      Toast.fire({ icon: 'success', title: 'Data berhasil disimpan' });`);
        changed = true;
     }
  }

  // Sweet alert form fail
  if (content.includes('alert(')) {
      content = content.replace(/alert\(err\.response\?\.data\?\.message\s*\|\|\s*"[^"]+"\)\;/g,
      `Swal.fire({\n        icon: 'error',\n        title: 'Gagal',\n        text: err.response?.data?.message || "Terjadi kesalahan.",\n        confirmButtonColor: '#059669'\n      });`);
      changed = true;
  }
  
  if (content.includes('confirmDelete')) {
     content = content.replace(/onClick\=\{\(\)\s*\=\>\s*confirmDelete\(item\.ID\)\}/g, `onClick={() => executeDelete(item.ID)}`);
     changed = true;
  }

  if (content.includes('const confirmDelete = (id: number) => {')) {
    content = content.replace(/const confirmDelete =([\s\S]*?)const executeDelete = async \(\) => \{([\s\S]*?)\} catch \(err: any\) \{([\s\S]*?) finally \{([\s\S]*?) \}\s*\};/m, 
`const executeDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin ingin menghapus data?',
      text: "Data yang dihapus tidak bisa dikembalikan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(\`/api/\$\{id\}\`);
        fetchData();
        Toast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
      } catch (err: any) {
        console.error("Gagal menghapus data:", err);
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err.response?.data?.message || "Terjadi kesalahan saat menghapus data.",
          confirmButtonColor: '#059669'
        });
      }
    }
  };`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

targetFiles.forEach(f => {
  const filePath = path.join(pagesDir, f);
  if (fs.existsSync(filePath)) {
    processFile(filePath);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
