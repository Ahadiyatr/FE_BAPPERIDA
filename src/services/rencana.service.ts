import { api,dataOf } from "./api"
import { getBidangById } from "./bidang.service"
import { getPeriodeById } from "./periode.service"
import { getSubkegiatan } from "./subkegiatan.service"
import type { BarisRencana,HasilPemeriksaan,HasilSalinRencana,IndikatorBidang,KatalogTersedia,KesiapanBidang,OpsiSalinRencana,RencanaBidangDetail,StatusKesiapan,SubkegiatanBidang } from "./types"

type AktifitasRow={id:number;subkegiatan_bidang_id:number;master_aktifitas_id:number|null;flag_adhoc:boolean;nama_aktifitas:string;tipe_aktifitas:"UTAMA"|"PENDUKUNG";bobot_target:number;target:number;realisasi:number;bobot_realisasi:number;urutan:number}
type RencanaRow={id:number;periode_id:number;bidang_id:number;subkegiatan_id:number;kode_subkegiatan:string;nama_subkegiatan:string;indikator_kinerja:string;target:number;satuan:string;capaian:number;aktifitas?:AktifitasRow[];jumlah_aktifitas?:number}
type KesiapanRow={bidang_id:number;nama_bidang:string;periode_id:number;status:StatusKesiapan;jumlah_subkegiatan:number;jumlah_lengkap:number;butir:string[]}
const aktifitas=(r:AktifitasRow):IndikatorBidang=>({id:r.id,subkegiatanBidangId:r.subkegiatan_bidang_id,masterIndikatorId:r.master_aktifitas_id??0,flagAdhoc:r.flag_adhoc,tipeAktifitas:r.tipe_aktifitas,namaAktifitas:r.nama_aktifitas,bobotTarget:Number(r.bobot_target),target:Number(r.target),realisasi:Number(r.realisasi),bobotRealisasi:Number(r.bobot_realisasi),urutan:r.urutan})
const skb=(r:RencanaRow):SubkegiatanBidang=>({id:r.id,periodeId:r.periode_id,bidangId:r.bidang_id,indikatorUtamaId:r.subkegiatan_id,indikatorKinerja:r.indikator_kinerja??"",target:Number(r.target),satuan:r.satuan??"",capaian:Number(r.capaian)})
const baris=(r:RencanaRow):BarisRencana=>({subkegiatanBidang:skb(r),namaSubkegiatan:r.nama_subkegiatan,kodeSubkegiatan:r.kode_subkegiatan,aktifitas:(r.aktifitas??[]).map(aktifitas)})

async function daftar(periodeId:number,bidangId?:number):Promise<RencanaRow[]>{return dataOf<RencanaRow[]>(await api.get(`/periode/${periodeId}/rencana`,{params:bidangId?{bidang_id:bidangId}:{}}))}

const kesiapan=(r:KesiapanRow):KesiapanBidang=>({bidangId:r.bidang_id,namaBidang:r.nama_bidang,periodeId:r.periode_id,status:r.status,jumlahSubkegiatan:r.jumlah_subkegiatan,jumlahLengkap:r.jumlah_lengkap})
export async function getPapanKesiapan(periodeId:number):Promise<KesiapanBidang[]>{return dataOf<KesiapanRow[]>(await api.get(`/periode/${periodeId}/kesiapan`)).map(kesiapan)}
export async function getRencanaBidang(bidangId:number,periodeId:number):Promise<RencanaBidangDetail|null>{const [bidang,periode,rows,papan]=await Promise.all([getBidangById(bidangId),getPeriodeById(periodeId),daftar(periodeId,bidangId),getPapanKesiapan(periodeId)]);if(!bidang||!periode)return null;const status=papan.find(b=>b.bidangId===bidangId)?.status??"DRAFT";return{bidang,periode,status,baris:rows.map(baris)}}

async function ubah(rencanaId:number,payload:any):Promise<RencanaRow>{return dataOf<RencanaRow>(await api.patch(`/rencana/${rencanaId}`,payload))}
export async function ubahTargetSubkegiatan(id:number,target:number):Promise<SubkegiatanBidang>{return skb(await ubah(id,{TARGET:target}))}
export async function ubahTargetAktifitas(id:number,target:number):Promise<IndikatorBidang>{const detail=dataOf<RencanaRow>(await api.get(`/rencana/${await cariRencanaId(id)}`));await ubah(detail.id,{aktifitas:[{id,TARGET:target}]});const ulang=dataOf<RencanaRow>(await api.get(`/rencana/${detail.id}`));return aktifitas(ulang.aktifitas!.find(a=>a.id===id)!)}
async function cariRencanaId(aktifitasId:number):Promise<number>{const periods=dataOf<any[]>(await api.get("/periode"));for(const p of periods){const rows=await daftar(p.id);const found=rows.find(r=>(r.aktifitas??[]).some(a=>a.id===aktifitasId));if(found)return found.id}throw new Error("Aktifitas tidak ditemukan.")}
export async function tambahAktifitasKeRencana(i:{subkegiatanBidangId:number;namaAktifitas:string;target:number}):Promise<IndikatorBidang>{return aktifitas(dataOf<AktifitasRow>(await api.post("/aktifitas-bidang",{subkegiatan_bidang_id:i.subkegiatanBidangId,nama_aktifitas:i.namaAktifitas,target:i.target})))}
export async function hapusAktifitasDariRencana(id:number):Promise<void>{await api.delete(`/aktifitas-bidang/${id}`)}
export async function getKatalogTersedia(periodeId:number):Promise<KatalogTersedia[]>{const [master,rows]=await Promise.all([getSubkegiatan(),daftar(periodeId)]);const dipakai=new Set(rows.map(r=>r.subkegiatan_id));return master.filter(s=>!dipakai.has(s.id)).map(s=>({indikatorUtamaId:s.id,kode:s.kodeIndikatorUtama,nama:s.namaIndikatorUtama,indikatorKinerja:s.indikatorKinerja,targetAnjuran:s.targetKinerja,satuan:s.satuanKinerja,jumlahAktifitas:0}))}
export async function tambahSubkegiatanKeRencana(i:{indikatorUtamaId:number;bidangId:number;periodeId:number}):Promise<BarisRencana>{const hasil=dataOf<RencanaRow[]>(await api.post(`/periode/${i.periodeId}/rencana`,{bidang_id:i.bidangId,subkegiatan_ids:[i.indikatorUtamaId]}));return baris(hasil[0])}
export async function cabutSubkegiatanDariRencana(id:number):Promise<void>{await api.delete(`/rencana/${id}`)}
export async function periksaKesiapan(bidangId:number,periodeId:number):Promise<HasilPemeriksaan>{const rows=dataOf<KesiapanRow[]>(await api.get(`/periode/${periodeId}/kesiapan`));const hasil=rows.find(r=>r.bidang_id===bidangId);const butir=hasil?.butir??["Belum ada pembagian rencana untuk bidang ini."];return{butir:butir.map(rincian=>({nada:"bad",menghalangi:true,judul:"Rencana belum siap",rincian})),jumlahMenghalangi:butir.length,bolehTandaiSiap:butir.length===0}}
export async function tandaiKesiapan(bidangId:number,periodeId:number,status:StatusKesiapan):Promise<StatusKesiapan>{const rows=dataOf<KesiapanRow[]>(await api.patch(`/periode/${periodeId}/kesiapan/${bidangId}`,{status}));return rows.find(r=>r.bidang_id===bidangId)?.status??"DRAFT"}
export async function salinRencana(o:OpsiSalinRencana):Promise<HasilSalinRencana>{const h=dataOf<{jumlah_subkegiatan:number}>(await api.post(`/periode/${o.kePeriodeId}/salin-rencana`,{periode_sumber_id:o.dariPeriodeId}));return{jumlahSubkegiatan:h.jumlah_subkegiatan,jumlahAktifitas:0,jumlahBidangDitimpa:0}}
