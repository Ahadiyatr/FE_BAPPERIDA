import { api,dataOf } from "./api"
import type { Periode,SimpanPeriodeInput,StatusPeriode,SyaratBukaPeriode } from "./types"
type Row={id:number;dokumen_id:number|null;nama_periode:string;tanggal_mulai:string;tanggal_selesai:string;status:StatusPeriode;dapat_dibuka:boolean}
const map=(r:Row):Periode=>({id:r.id,dokumenId:r.dokumen_id,namaPeriode:r.nama_periode,tanggalMulai:r.tanggal_mulai,tanggalSelesai:r.tanggal_selesai,status:r.status})
export async function getPeriode():Promise<Periode[]>{return dataOf<Row[]>(await api.get("/periode")).map(map)}
export async function getPeriodeById(id:number):Promise<Periode|null>{return map(dataOf<Row>(await api.get(`/periode/${id}`)))}
export async function getPeriodeAktif():Promise<Periode|null>{const rows=await getPeriode();return rows.find(r=>r.status==="OPEN")??rows.find(r=>r.status==="LOCKED")??rows[0]??null}
export async function simpanPeriode(i:SimpanPeriodeInput):Promise<Periode>{if(i.dokumenId==null)throw new Error("Dokumen periode wajib dipilih.");const body={DOKUMEN_ID:i.dokumenId,NAMA_PERIODE:i.namaPeriode,TANGGAL_MULAI:i.tanggalMulai,TANGGAL_SELESAI:i.tanggalSelesai};return map(dataOf<Row>(i.id?await api.put(`/periode/${i.id}`,body):await api.post("/periode",body)))}
export async function cekSyaratBuka(id:number):Promise<SyaratBukaPeriode>{const periode=await getPeriode();const lain=periode.find(p=>p.status==="OPEN"&&p.id!==id);return{boleh:!lain,bidangBelumSiap:[],adaPeriodeLainTerbuka:lain?.namaPeriode??null}}
export async function ubahStatusPeriode(id:number,status:StatusPeriode):Promise<Periode>{if(status==="DRAFT")throw new Error("Status periode tidak dapat dikembalikan ke DRAFT.");return map(dataOf<Row>(await api.patch(`/periode/${id}/${status==="OPEN"?"buka":"kunci"}`)))}
