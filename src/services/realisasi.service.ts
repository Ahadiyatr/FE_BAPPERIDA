import { api,dataOf } from "./api"
import type { AktifitasPencatatan,CatatanBukti,CatatRealisasiInput,PratinjauRealisasi,RealisasiKegiatan,RealisasiLampiran } from "./types"

type LampiranRow={id:number;tipe_berkas:"FOTO"|"DOKUMEN";nama_berkas:string;ukuran_byte:number;preview_url:string}
type RealisasiRow={id:number;aktifitas_bidang_id:number;tanggal_kegiatan:string;jumlah_realisasi:number;keterangan:string|null;created_by:number;log_entry_name:string;lampiran?:LampiranRow[]}
type RencanaRow={id:number;kode_subkegiatan:string;nama_subkegiatan:string;capaian:number;aktifitas:{id:number;nama_aktifitas:string;tipe_aktifitas:"UTAMA"|"PENDUKUNG";bobot_target:number;target:number;realisasi:number;bobot_realisasi:number;jumlah_catatan?:number;jumlah_lampiran?:number;realisasi_kegiatan?:RealisasiRow[]}[]}
const realisasi=(r:RealisasiRow):RealisasiKegiatan=>({id:r.id,indikatorBidangId:r.aktifitas_bidang_id,tanggalKegiatan:r.tanggal_kegiatan,jumlahRealisasi:Number(r.jumlah_realisasi),keterangan:r.keterangan??"",createdBy:r.created_by,logEntryName:r.log_entry_name})
const lampiran=(r:LampiranRow,realisasiId:number):RealisasiLampiran=>({id:r.id,realisasiId,tipeBerkas:r.tipe_berkas,namaBerkas:r.nama_berkas,pathBerkas:r.preview_url,ukuranByte:r.ukuran_byte})

export async function getRealisasiByIndikatorBidang(id:number):Promise<RealisasiKegiatan[]>{return dataOf<RealisasiRow[]>(await api.get("/realisasi-kegiatan",{params:{aktifitas_bidang_id:id}})).map(realisasi)}
export async function getLampiranByRealisasi(id:number):Promise<RealisasiLampiran[]>{const r=dataOf<RealisasiRow>(await api.get(`/realisasi-kegiatan/${id}`));return(r.lampiran??[]).map(x=>lampiran(x,id))}
export async function catatRealisasi(i:CatatRealisasiInput):Promise<RealisasiKegiatan>{const form=new FormData();form.append("aktifitas_bidang_id",String(i.indikatorBidangId));form.append("tanggal_kegiatan",i.tanggalKegiatan);form.append("jumlah_realisasi",String(i.jumlahRealisasi));if(i.keterangan)form.append("keterangan",i.keterangan);for(const f of i.fotos??[])form.append("fotos[]",f);if(i.dokumen)form.append("dokumen",i.dokumen);return realisasi(dataOf<RealisasiRow>(await api.post("/realisasi-kegiatan",form)))}
export async function ubahRealisasi(id:number,input:{tanggalKegiatan:string;jumlahRealisasi:number;keterangan:string}):Promise<RealisasiKegiatan>{return realisasi(dataOf<RealisasiRow>(await api.put(`/realisasi-kegiatan/${id}`,{tanggal_kegiatan:input.tanggalKegiatan,jumlah_realisasi:input.jumlahRealisasi,keterangan:input.keterangan})))}
export async function hapusRealisasi(id:number):Promise<void>{await api.delete(`/realisasi-kegiatan/${id}`)}
export async function uploadLampiran(realisasiId:number,files:File[]):Promise<RealisasiLampiran[]>{const form=new FormData();form.append("realisasi_id",String(realisasiId));for(const f of files){if(f.type.startsWith("image/"))form.append("fotos[]",f);else form.append("dokumen",f)}
// POST /lampiran mengembalikan realisasi + seluruh lampiran-nya (TransRealisasiKegiatanResource),
// bukan array lampiran. Ambil daftar lampiran terbaru dari situ.
const r=dataOf<RealisasiRow>(await api.post("/lampiran",form));return(r.lampiran??[]).map(x=>lampiran(x,realisasiId))}
export async function hapusLampiran(lampiranId:number):Promise<void>{await api.delete(`/lampiran/${lampiranId}`)}

async function rencanaSaya(periodeId:number):Promise<RencanaRow[]>{return dataOf<RencanaRow[]>(await api.get("/bidang-saya/rencana",{params:{periode_id:periodeId}}))}
export async function getAktifitasBidang(_bidangId:number,periodeId:number):Promise<AktifitasPencatatan[]>{
  const rows=await rencanaSaya(periodeId)
  return rows.flatMap(r=>r.aktifitas.map(a=>({
    indikatorBidangId:a.id,subkegiatanBidangId:r.id,kodeSubkegiatan:r.kode_subkegiatan,
    namaSubkegiatan:r.nama_subkegiatan,namaAktifitas:a.nama_aktifitas,tipeAktifitas:a.tipe_aktifitas,
    bobotTarget:Number(a.bobot_target),target:Number(a.target),realisasi:Number(a.realisasi),
    bobotRealisasi:Number(a.bobot_realisasi),jumlahCatatan:Number(a.jumlah_catatan??0),jumlahLampiran:Number(a.jumlah_lampiran??0),
    capaianSubkegiatan:Number(r.capaian),selesai:Number(a.target)>0&&Number(a.realisasi)>=Number(a.target),
  })))
}
export async function pratinjauRealisasi(id:number,tambahan:number):Promise<PratinjauRealisasi|null>{const periods=dataOf<any[]>(await api.get("/periode"));for(const p of periods){try{const rows=await rencanaSaya(p.id);for(const r of rows){const a=r.aktifitas.find(x=>x.id===id);if(a){const sesudah=Number(a.realisasi)+tambahan,bobot=Math.min(1,sesudah/Number(a.target||1))*Number(a.bobot_target);return{namaAktifitas:a.nama_aktifitas,satuanTarget:Number(a.target),bobotTarget:Number(a.bobot_target),realisasiSekarang:Number(a.realisasi),realisasiSetelah:sesudah,bobotRealisasiSekarang:Number(a.bobot_realisasi),bobotRealisasiSetelah:bobot,capaianSekarang:Number(r.capaian),capaianSetelah:Math.min(100,Number(r.capaian)-Number(a.bobot_realisasi)+bobot),melebihiTarget:sesudah>Number(a.target)}}}}catch{continue}}return null}
export async function getBuktiByBidang(_bidangId:number,periodeId:number):Promise<CatatanBukti[]>{const rows=await rencanaSaya(periodeId),hasil:CatatanBukti[]=[];for(const r of rows)for(const a of r.aktifitas)for(const x of a.realisasi_kegiatan??[])hasil.push({realisasiId:x.id,tanggalKegiatan:x.tanggal_kegiatan,jumlahRealisasi:Number(x.jumlah_realisasi),keterangan:x.keterangan??"",logEntryName:x.log_entry_name,namaAktifitas:a.nama_aktifitas,kodeSubkegiatan:r.kode_subkegiatan,namaSubkegiatan:r.nama_subkegiatan,lampirans:(x.lampiran??[]).map(l=>lampiran(l,x.id))});return hasil.sort((a,b)=>b.tanggalKegiatan.localeCompare(a.tanggalKegiatan))}
