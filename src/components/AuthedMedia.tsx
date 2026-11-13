import { useEffect, useState, type ReactNode } from "react";
import { Image as ImageIcon, AlertTriangle, FileText, Download } from "lucide-react";
import api from "../services/api";

type BlobError = false | "unauthorized" | "notfound" | "unknown";

// Cache object URL selama sesi, kunci = apiPath. Urutan sisip Map dipakai
// sebagai LRU: entri tertua dibuang (dan di-revoke) saat melewati batas.
// Tanpa cache, membuka-tutup grup di Bukti Kegiatan atau pindah tab
// mengunduh ulang setiap foto.
const BATAS_CACHE = 300;
const cacheBlob = new Map<string, string>();
const sedangDimuat = new Map<string, Promise<string>>();

function ambilBlobUrl(apiPath: string): Promise<string> {
  const tersimpan = cacheBlob.get(apiPath);
  if (tersimpan) {
    cacheBlob.delete(apiPath);
    cacheBlob.set(apiPath, tersimpan);
    return Promise.resolve(tersimpan);
  }
  // Dua komponen yang meminta berkas yang sama berbagi satu request.
  const berjalan = sedangDimuat.get(apiPath);
  if (berjalan) return berjalan;

  const janji = api
    .get(apiPath, { responseType: "blob" })
    .then((res) => {
      const objectUrl = URL.createObjectURL(res.data);
      cacheBlob.set(apiPath, objectUrl);
      if (cacheBlob.size > BATAS_CACHE) {
        const [kunciTertua, urlTertua] = cacheBlob.entries().next().value!;
        cacheBlob.delete(kunciTertua);
        URL.revokeObjectURL(urlTertua);
      }
      return objectUrl;
    })
    .finally(() => sedangDimuat.delete(apiPath));
  sedangDimuat.set(apiPath, janji);
  return janji;
}

/** Kosongkan cache blob, mis. saat keluar supaya berkas tidak terbawa ke sesi berikutnya. */
export function kosongkanCacheBlob() {
  for (const url of cacheBlob.values()) URL.revokeObjectURL(url);
  cacheBlob.clear();
  sedangDimuat.clear();
}

// Fetches a protected API path as a blob and exposes an object URL.
// Object URL hidup di cache modul, bukan milik komponen, jadi tidak
// di-revoke saat unmount; galat tidak di-cache supaya bisa dicoba lagi.
export function useAuthedBlobUrl(apiPath: string | null) {
  const [url, setUrl] = useState<string | null>(() =>
    apiPath ? cacheBlob.get(apiPath) ?? null : null
  );
  const [loading, setLoading] = useState(() => !!apiPath && !cacheBlob.has(apiPath));
  const [error, setError] = useState<BlobError>(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);

    if (!apiPath) {
      setUrl(null);
      setLoading(false);
      return;
    }

    const tersimpan = cacheBlob.get(apiPath);
    if (tersimpan) {
      setUrl(tersimpan);
      setLoading(false);
      return;
    }

    setUrl(null);
    setLoading(true);
    ambilBlobUrl(apiPath)
      .then((objectUrl) => {
        if (!cancelled) setUrl(objectUrl);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 401) setError("unauthorized");
        else if (err?.response?.status === 404) setError("notfound");
        else setError("unknown");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiPath]);

  return { url, loading, error };
}

function LoadingBox({ className }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center bg-slate-100`}>
      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// "rusak": berkas berhasil diunduh tapi browser gagal men-decode gambarnya.
function ErrorBox({ className, error }: { className?: string; error: BlobError | "rusak" }) {
  const label =
    error === "unauthorized" ? "SESI HABIS" : error === "rusak" ? "FOTO RUSAK" : "NO FOTO";
  return (
    <div
      title={label}
      className={`${className} flex flex-col items-center justify-center text-slate-400 bg-slate-100`}
    >
      {error === "unauthorized" || error === "rusak" ? (
        <AlertTriangle className="w-6 h-6 mb-1 opacity-50" />
      ) : (
        <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
      )}
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </div>
  );
}

export function AuthedImage({
  lampiranId,
  className,
  alt,
  badge,
}: {
  lampiranId: number;
  className?: string;
  alt?: string;
  badge?: ReactNode;
}) {
  const { url, loading, error } = useAuthedBlobUrl(
    lampiranId ? `/lampiran/${lampiranId}/preview` : null
  );
  // Disimpan per-URL supaya otomatis pulih ketika lampiran berganti.
  const [urlRusak, setUrlRusak] = useState<string | null>(null);

  if (loading) return <LoadingBox className={className} />;
  if (error || !url) return <ErrorBox className={className} error={error} />;
  if (urlRusak === url) return <ErrorBox className={className} error="rusak" />;

  return (
    <div className="relative w-full h-full">
      <img
        src={url}
        className={className}
        alt={alt || "Foto"}
        onError={() => setUrlRusak(url)}
      />
      {badge}
    </div>
  );
}

export function DocumentPreview({ id, ext }: { id: number; ext: string }) {
  const isPdf = (ext || "").toLowerCase() === "pdf";
  const apiPath = `/lampiran/${id}/preview`;
  const { url, loading, error } = useAuthedBlobUrl(isPdf ? apiPath : null);

  if (isPdf) {
    if (loading) {
      return (
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      );
    }
    if (error || !url) {
      return (
        <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-slate-200 max-w-md w-full">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="font-bold text-slate-800 text-lg mb-2">
            {error === "unauthorized" ? "Sesi Anda Telah Berakhir" : "Dokumen Tidak Ditemukan"}
          </div>
          <p className="text-sm text-slate-500">
            {error === "unauthorized"
              ? "Silakan login kembali untuk melihat dokumen ini."
              : "File tidak dapat ditemukan di server."}
          </p>
        </div>
      );
    }
    return <iframe src={url} className="w-full h-full min-h-[60vh] rounded-xl border-0 shadow-inner bg-white" />;
  }

  return (
    <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-slate-200 max-w-md w-full">
      <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
      <div className="font-bold text-slate-800 text-lg mb-2">Preview Tidak Tersedia</div>
      <p className="text-sm text-slate-500 mb-6">Format dokumen ini tidak dapat langsung ditampilkan di layar.</p>
      <button
        onClick={() => downloadAuthedFile(apiPath, `dokumen-${id}${ext ? `.${ext}` : ""}`)}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors"
      >
        Unduh Dokumen <Download className="w-4 h-4" />
      </button>
    </div>
  );
}

// Fetches a protected file as a blob and triggers a browser save,
// since a plain <a href> cannot carry the Authorization header.
export async function downloadAuthedFile(apiPath: string, filename: string) {
  const res = await api.get(apiPath, { responseType: "blob" });
  const objectUrl = URL.createObjectURL(res.data);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
