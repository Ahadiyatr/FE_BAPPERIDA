import { api,dataOf } from "./api"
import type { OpsiMaster,SimpanUserInput,User } from "./types"
type Row={id:number;name:string;email:string;role:"admin_aplikasi"|"admin_bidang";bidang:{id:number}[];deleted_at?:string|null}
const map=(r:Row):User=>({id:r.id,name:r.name,email:r.email,role:r.role,bidangId:r.bidang[0]?.id??null,flagActive:!r.deleted_at})
export async function getUsers(opsi:OpsiMaster={}):Promise<User[]>{return dataOf<Row[]>(await api.get("/pengguna",{params:opsi.termasukNonaktif?{trashed:"with"}:{}})).map(map)}
export async function getUserById(id:number):Promise<User|null>{return map(dataOf<Row>(await api.get(`/pengguna/${id}`)))}
export async function getUsersByBidang(id:number):Promise<User[]>{return dataOf<Row[]>(await api.get("/pengguna",{params:{bidang_id:id}})).map(map)}
export async function simpanUser(i:SimpanUserInput):Promise<User>{const body={name:i.name,email:i.email,role:i.role,bidang_id:i.role==="admin_bidang"?i.bidangId:null};return map(dataOf<Row>(i.id?await api.put(`/pengguna/${i.id}`,body):await api.post("/pengguna",{...body,password:i.password})))}
export async function setAktifUser(id:number,aktif:boolean):Promise<User>{if(!aktif){await api.delete(`/pengguna/${id}`);const r=await getUserById(id);if(!r)throw new Error("Pengguna tidak ditemukan.");return {...r,flagActive:false}}return map(dataOf<Row>(await api.patch(`/pengguna/${id}/pulihkan`)))}
/** Reset kata sandi pengguna (admin_aplikasi). `password` diisi = mode manual;
 * dikosongkan = sistem membuat sandi acak yang dikembalikan sebagai string. */
export async function resetPasswordUser(id:number,password?:string):Promise<string|null>{const body=password?{password,password_confirmation:password}:{};const data=dataOf<{password:string}|null>(await api.patch(`/pengguna/${id}/reset-password`,body));return data?.password??null}
/** Ganti kata sandi sendiri (admin_bidang). */
export async function gantiKataSandi(currentPassword:string,newPassword:string):Promise<void>{await api.patch("/me/password",{current_password:currentPassword,password:newPassword,password_confirmation:newPassword})}
