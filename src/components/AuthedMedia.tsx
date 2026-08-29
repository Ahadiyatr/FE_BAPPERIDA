import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image as ImageIcon, AlertTriangle, FileText, Download } from "lucide-react";
import api from "../services/api";

type BlobError = false | "unauthorized" | "notfound" | "unknown";

// Fetches a protected API path as a blob and exposes an object URL.
// Revokes the previous object URL whenever `apiPath` changes or the
// consuming component unmounts, to avoid leaking blob: URLs.
export function useAuthedBlobUrl(apiPath: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<BlobError>(false);
  const currentObjectUrl = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (currentObjectUrl.current) {
      URL.revokeObjectURL(currentObjectUrl.current);
      currentObjectUrl.current = null;
    }
    setUrl(null);
    setError(false);

    if (!apiPath) return;

    setLoading(true);
    api
      .get(apiPath, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(res.data);
        currentObjectUrl.current = objectUrl;
        setUrl(objectUrl);
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
      if (currentObjectUrl.current) {
        URL.revokeObjectURL(currentObjectUrl.current);
        currentObjectUrl.current = null;
      }
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

function ErrorBox({ className, error }: { className?: string; error: BlobError }) {
  return (
    <div className={`${className} flex flex-col items-center justify-center text-slate-400 bg-slate-100`}>
      {error === "unauthorized" ? (
        <AlertTriangle className="w-6 h-6 mb-1 opacity-50" />
      ) : (
        <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
      )}
      <span className="text-[10px] font-bold tracking-wider">
        {error === "unauthorized" ? "SESI HABIS" : "NO FOTO"}
      </span>
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

  if (loading) return <LoadingBox className={className} />;
  if (error || !url) return <ErrorBox className={className} error={error} />;

  return (
    <div className="relative w-full h-full">
      <img src={url} className={className} alt={alt || "Foto"} />
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
