import { api,dataOf } from "./api"
import type { Bidang,OpsiMaster,SimpanBidangInput } from "./types"
type Row={id:number;nama_bidang:string;flag_active:boolean}
const map=(r:Row):Bidang=>({id:r.id,kode:String(r.id),namaBidang:r.nama_bidang,flagActive:r.flag_active})
export async function getBidang(opsi:OpsiMaster={}):Promise<Bidang[]>{try{return dataOf<Row[]>(await api.get("/bidang",{params:opsi.termasukNonaktif?{}:{flag_active:1}})).map(map)}catch(error:any){if(error?.response?.status!==403)throw error;const me=dataOf<{bidang:{id:number;nama_bidang:string}[]}>(await api.get("/me"));return me.bidang.map(b=>({id:b.id,kode:String(b.id),namaBidang:b.nama_bidang,flagActive:true}))}}
export async function getBidangById(id:number):Promise<Bidang|null>{try{return map(dataOf<Row>(await api.get(`/bidang/${id}`)))}catch(error:any){if(error?.response?.status!==403)throw error;return(await getBidang({termasukNonaktif:true})).find(b=>b.id===id)??null}}
export async function simpanBidang(i:SimpanBidangInput):Promise<Bidang>{return map(dataOf<Row>(i.id?await api.put(`/bidang/${i.id}`,{NAMA_BIDANG:i.namaBidang,FLAG_ACTIVE:true}):await api.post("/bidang",{NAMA_BIDANG:i.namaBidang,FLAG_ACTIVE:true})))}
export async function setAktifBidang(id:number,aktif:boolean):Promise<Bidang>{const r=await getBidangById(id);if(!r)throw new Error("Bidang tidak ditemukan.");return map(dataOf<Row>(await api.put(`/bidang/${id}`,{NAMA_BIDANG:r.namaBidang,FLAG_ACTIVE:aktif})))}
