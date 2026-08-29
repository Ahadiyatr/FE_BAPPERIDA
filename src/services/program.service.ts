import { api, dataOf } from "./api"
import type { OpsiMaster, Program, SimpanProgramInput } from "./types"

type Row = { id:number; dokumen_id:number; kode_program:string; nama_program:string; flag_active:boolean }
const map = (r: Row): Program => ({ id:r.id, dokumenId:r.dokumen_id, urusanId:0, kodeProgram:r.kode_program, namaProgram:r.nama_program, flagActive:r.flag_active })
export async function getProgram(opsi: OpsiMaster = {}): Promise<Program[]> {
  const rows = dataOf<Row[]>(await api.get("/program", { params: opsi.termasukNonaktif ? {} : { flag_active: 1 } }))
  return rows.map(map)
}
export async function getProgramById(id:number): Promise<Program|null> { return map(dataOf<Row>(await api.get(`/program/${id}`))) }
export async function simpanProgram(input:SimpanProgramInput): Promise<Program> {
  const body = { DOKUMEN_ID:input.dokumenId, KODE_PROGRAM:input.kodeProgram, NAMA_PROGRAM:input.namaProgram, FLAG_ACTIVE:true }
  const response = input.id ? await api.put(`/program/${input.id}`, body) : await api.post("/program", body)
  return map(dataOf<Row>(response))
}
export async function setAktifProgram(id:number, aktif:boolean): Promise<Program> {
  const current = await getProgramById(id); if (!current) throw new Error("Program tidak ditemukan.")
  return map(dataOf<Row>(await api.put(`/program/${id}`, { DOKUMEN_ID:current.dokumenId, KODE_PROGRAM:current.kodeProgram, NAMA_PROGRAM:current.namaProgram, FLAG_ACTIVE:aktif })))
}
