import { api, dataOf } from "./api"
import type { Kegiatan, OpsiMaster, SimpanKegiatanInput } from "./types"
type Row={id:number;program_id:number;kode_kegiatan:string;nama_kegiatan:string;flag_active:boolean}
const map=(r:Row):Kegiatan=>({id:r.id,programId:r.program_id,kodeKegiatan:r.kode_kegiatan,namaKegiatan:r.nama_kegiatan,flagActive:r.flag_active})
export async function getKegiatan(opsi:OpsiMaster={}):Promise<Kegiatan[]>{return dataOf<Row[]>(await api.get("/kegiatan",{params:opsi.termasukNonaktif?{}:{flag_active:1}})).map(map)}
export async function getKegiatanById(id:number):Promise<Kegiatan|null>{return map(dataOf<Row>(await api.get(`/kegiatan/${id}`)))}
export async function getKegiatanByProgram(programId:number,opsi:OpsiMaster={}):Promise<Kegiatan[]>{return dataOf<Row[]>(await api.get("/kegiatan",{params:{program_id:programId,...(!opsi.termasukNonaktif&&{flag_active:1})}})).map(map)}
export async function simpanKegiatan(input:SimpanKegiatanInput):Promise<Kegiatan>{const body={PROGRAM_ID:input.programId,KODE_KEGIATAN:input.kodeKegiatan,NAMA_KEGIATAN:input.namaKegiatan,FLAG_ACTIVE:true};return map(dataOf<Row>(input.id?await api.put(`/kegiatan/${input.id}`,body):await api.post("/kegiatan",body)))}
export async function setAktifKegiatan(id:number,aktif:boolean):Promise<Kegiatan>{const r=await getKegiatanById(id);if(!r)throw new Error("Kegiatan tidak ditemukan.");return map(dataOf<Row>(await api.put(`/kegiatan/${id}`,{PROGRAM_ID:r.programId,KODE_KEGIATAN:r.kodeKegiatan,NAMA_KEGIATAN:r.namaKegiatan,FLAG_ACTIVE:aktif})))}
