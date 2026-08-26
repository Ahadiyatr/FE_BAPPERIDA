import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Plus, X, Minus } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Toast } from '../../utils/toast';
import Pagination from '../../components/Pagination';

interface Rencana {
  CAPAIAN_ID: number;
  INDIKATOR_BIDANG_ID: number;
  PERIODE_ID: number;
  NAMA_PERIODE: string;
  BIDANG_ID: number;
  NAMA_BIDANG: string;
  PROGRAM_ID: number;
  NAMA_PROGRAM: string;
  INDIKATOR_UTAMA_ID: number;
  NAMA_INDIKATOR_UTAMA: string;
  INDIKATOR_ID: number;
  NAMA_INDIKATOR: string;
  TARGET: string;
  REALISASI: string;
  PERSENTASE: string;
  TOTAL_KEGIATAN_UTAMA: number;
  TOTAL_KEGIATAN_PENDUKUNG: number;
  BOBOT_TARGET: string;
  BOBOT_REALISASI: string;
  FLAG_ACTIVE: number;
  LAST_CALCULATE_DATE: string;
}

type RencanaDetailRow = {
  TIPE_AKTIFITAS: 'UTAMA' | 'PENDUKUNG';
  NAMA_AKTIFITAS: string;
  LIST_AKTIFITAS_UTAMA_ID: string;
  LIST_AKTIFITAS_PENDUKUNG_ID: string;
  TARGET: string;
  BOBOT_TARGET: string;
};

export default function RencanaKegiatan() {
  const [data, setData] = useState<Rencana[]>([]);
  const [filteredData, setFilteredData] = useState<Rencana[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [filterBidang, setFilterBidang] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterIndikatorUtama] = useState('');
  const [filterSubIndikator] = useState('');

  const [dropdowns, setDropdowns] = useState<any>({
    periode: [],
    bidang: [],
    program: [],
    indikator_utama: [],
    indikator: [],
  });

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    PERIODE_ID: '',
    BIDANG_ID: '',
    PROGRAM_ID: '',
    INDIKATOR_UTAMA_ID: '',
    INDIKATOR_SUB_ID: '',
    INDIKATOR_KINERJA: '',
    TARGET_KINERJA: '',
    SATUAN_TARGET: '',
    OUTPUT_KINERJA: '',
  });

  // Detail State for 'add' mode
  const [details, setDetails] = useState<RencanaDetailRow[]>([
    {
      TIPE_AKTIFITAS: 'UTAMA',
      NAMA_AKTIFITAS: '',
      LIST_AKTIFITAS_UTAMA_ID: '',
      LIST_AKTIFITAS_PENDUKUNG_ID: '',
      TARGET: '',
      BOBOT_TARGET: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/rencana-kegiatan');
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    const sourceDropdowns: any = {};

    const normalizeItems = (items: any[]) => {
      if (!Array.isArray(items) || items.length === 0) return null;
      const sample = items[0] || {};
      if ('NAMA_PROGRAM' in sample || 'KODE_PROGRAM' in sample) {
        return items.map((item: any) => ({
          value: item.ID ?? item.PROGRAM_ID,
          label:
            item.NAMA_PROGRAM || item.NAMA || item.label || String(item.ID),
        }));
      }
      if ('NAMA_PERIODE' in sample) {
        return items.map((item: any) => ({
          value: item.ID ?? item.PERIODE_ID,
          label:
            item.NAMA_PERIODE || item.NAMA || item.label || String(item.ID),
        }));
      }
      if ('NAMA_BIDANG' in sample) {
        return items.map((item: any) => ({
          value: item.ID ?? item.BIDANG_ID,
          label: item.NAMA_BIDANG || item.NAMA || item.label || String(item.ID),
        }));
      }
      if ('NAMA_INDIKATOR_UTAMA' in sample) {
        return items.map((item: any) => ({
          value: item.ID ?? item.INDIKATOR_UTAMA_ID,
          label:
            item.NAMA_INDIKATOR_UTAMA ||
            item.NAMA ||
            item.label ||
            String(item.ID),
          PROGRAM_ID: item.PROGRAM_ID,
        }));
      }
      if ('NAMA_INDIKATOR_SUB' in sample || 'NAMA_INDIKATOR' in sample) {
        return items.map((item: any) => ({
          value: item.ID ?? item.INDIKATOR_SUB_ID ?? item.INDIKATOR_ID,
          label:
            item.NAMA_INDIKATOR_SUB ||
            item.NAMA_INDIKATOR ||
            item.label ||
            String(item.ID),
          INDIKATOR_UTAMA_ID:
            item.MSTR_INDIKATOR_UTAMA_ID ?? item.INDIKATOR_UTAMA_ID,
        }));
      }
      return null;
    };

    try {
      const res = await api.get('/api/dropdown/rencana-kegiatan');
      const responseData = res.data.data || res.data;
      if (Array.isArray(responseData)) {
        const normalized = normalizeItems(responseData);
        if (normalized) {
          const sample = responseData[0] || {};
          if ('NAMA_PROGRAM' in sample || 'KODE_PROGRAM' in sample)
            sourceDropdowns.program = normalized;
          else if ('NAMA_PERIODE' in sample)
            sourceDropdowns.periode = normalized;
          else if ('NAMA_BIDANG' in sample) sourceDropdowns.bidang = normalized;
          else if ('NAMA_INDIKATOR_UTAMA' in sample)
            sourceDropdowns.indikator_utama = normalized;
          else if ('NAMA_INDIKATOR_SUB' in sample || 'NAMA_INDIKATOR' in sample)
            sourceDropdowns.indikator = normalized;
        }
      } else if (responseData && typeof responseData === 'object') {
        const direct = (key: string) =>
          Array.isArray((responseData as any)[key])
            ? (responseData as any)[key]
            : undefined;
        sourceDropdowns.periode =
          normalizeItems(
            direct('periode') ||
              direct('periods') ||
              direct('list_periode') ||
              [],
          ) || sourceDropdowns.periode;
        sourceDropdowns.bidang =
          normalizeItems(
            direct('bidang') ||
              direct('bidangs') ||
              direct('list_bidang') ||
              [],
          ) || sourceDropdowns.bidang;
        sourceDropdowns.program =
          normalizeItems(
            direct('program') ||
              direct('programs') ||
              direct('list_program') ||
              [],
          ) || sourceDropdowns.program;
        sourceDropdowns.indikator_utama =
          normalizeItems(
            direct('indikator_utama') ||
              direct('indikator_utama_list') ||
              direct('master_indikator_utama') ||
              [],
          ) || sourceDropdowns.indikator_utama;
        sourceDropdowns.indikator =
          normalizeItems(
            direct('indikator') ||
              direct('indikator_sub') ||
              direct('master_indikator_sub') ||
              [],
          ) || sourceDropdowns.indikator;
      }
    } catch (err) {
      console.error('Gagal load dropdown rencana-kegiatan:', err);
    }

    const fallbackRequests = [
      api.get('/api/master-periode'),
      api.get('/api/master-bidang'),
      api.get('/api/master-program'),
      api.get('/api/master-indikator-utama'),
      api.get('/api/master-indikator-sub'),
    ];

    const results = await Promise.allSettled(fallbackRequests);

    if (!Array.isArray(sourceDropdowns.periode)) {
      const r = results[0];
      if (r.status === 'fulfilled') {
        const items = r.value.data.data || r.value.data;
        if (Array.isArray(items)) {
          sourceDropdowns.periode = items.map((item: any) => ({
            value: item.ID ?? item.PERIODE_ID,
            label:
              item.NAMA_PERIODE || item.NAMA || item.label || String(item.ID),
          }));
        }
      }
    }

    if (!Array.isArray(sourceDropdowns.bidang)) {
      const r = results[1];
      if (r.status === 'fulfilled') {
        const items = r.value.data.data || r.value.data;
        if (Array.isArray(items)) {
          sourceDropdowns.bidang = items.map((item: any) => ({
            value: item.ID ?? item.BIDANG_ID,
            label:
              item.NAMA_BIDANG || item.NAMA || item.label || String(item.ID),
          }));
        }
      }
    }

    if (!Array.isArray(sourceDropdowns.program)) {
      const r = results[2];
      if (r.status === 'fulfilled') {
        const items = r.value.data.data || r.value.data;
        if (Array.isArray(items)) {
          sourceDropdowns.program = items.map((item: any) => ({
            value: item.ID ?? item.PROGRAM_ID,
            label:
              item.NAMA_PROGRAM || item.NAMA || item.label || String(item.ID),
          }));
        }
      }
    }

    if (!Array.isArray(sourceDropdowns.indikator_utama)) {
      const r = results[3];
      if (r.status === 'fulfilled') {
        const items = r.value.data.data || r.value.data;
        if (Array.isArray(items)) {
          sourceDropdowns.indikator_utama = items.map((item: any) => ({
            value: item.ID ?? item.INDIKATOR_UTAMA_ID,
            label:
              item.NAMA_INDIKATOR_UTAMA ||
              item.NAMA ||
              item.label ||
              String(item.ID),
            PROGRAM_ID: item.PROGRAM_ID,
          }));
        }
      }
    }

    if (!Array.isArray(sourceDropdowns.indikator)) {
      const r = results[4];
      if (r.status === 'fulfilled') {
        const items = r.value.data.data || r.value.data;
        if (Array.isArray(items)) {
          sourceDropdowns.indikator = items.map((item: any) => ({
            value: item.ID ?? item.INDIKATOR_SUB_ID ?? item.INDIKATOR_ID,
            label:
              item.NAMA_INDIKATOR_SUB ||
              item.NAMA_INDIKATOR ||
              item.label ||
              String(item.ID),
            INDIKATOR_UTAMA_ID:
              item.MSTR_INDIKATOR_UTAMA_ID ?? item.INDIKATOR_UTAMA_ID,
          }));
        }
      }
    }

    setDropdowns((prev: any) => ({
      ...prev,
      ...sourceDropdowns,
    }));

    try {
      const resAktifitasUtama = await api.get(
        '/api/master-list-aktifitas-utama',
      );
      const items = resAktifitasUtama.data.data || resAktifitasUtama.data;
      setDropdowns((prev: any) => ({
        ...prev,
        aktifitas_utama: Array.isArray(items)
          ? items.map((item: any) => ({
              value: item.ID,
              label: item.NAMA_AKTIFITAS_UTAMA || item.NAMA || String(item.ID),
            }))
          : [],
      }));
    } catch (e) {
      console.error('Gagal load aktifitas utama:', e);
    }

    try {
      const resAktifitasPendukung = await api.get(
        '/api/master-list-aktifitas-pendukung',
      );
      const items =
        resAktifitasPendukung.data.data || resAktifitasPendukung.data;
      setDropdowns((prev: any) => ({
        ...prev,
        aktifitas_pendukung: Array.isArray(items)
          ? items.map((item: any) => ({
              value: item.ID,
              label:
                item.NAMA_AKTIFITAS_PENDUKUNG || item.NAMA || String(item.ID),
              INDIKATOR_SUB_ID: item.INDIKATOR_SUB_ID,
            }))
          : [],
      }));
    } catch (e) {
      console.error('Gagal load aktifitas pendukung:', e);
    }
  };

  useEffect(() => {
    let result = data;
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        d =>
          d.NAMA_BIDANG?.toLowerCase().includes(term) ||
          d.NAMA_PROGRAM?.toLowerCase().includes(term) ||
          d.NAMA_INDIKATOR?.toLowerCase().includes(term) ||
          d.NAMA_INDIKATOR_UTAMA?.toLowerCase().includes(term),
      );
    }
    if (filterBidang)
      result = result.filter(d => d.BIDANG_ID.toString() === filterBidang);
    if (filterProgram)
      result = result.filter(d => d.PROGRAM_ID.toString() === filterProgram);
    if (filterIndikatorUtama)
      result = result.filter(
        d => d.INDIKATOR_UTAMA_ID.toString() === filterIndikatorUtama,
      );
    if (filterSubIndikator)
      result = result.filter(
        d => d.INDIKATOR_ID.toString() === filterSubIndikator,
      );

    setFilteredData(result);
    setCurrentPage(1); // Reset to page 1 when filter changes
  }, [
    search,
    filterBidang,
    filterProgram,
    filterIndikatorUtama,
    filterSubIndikator,
    data,
  ]);

  const handleOpenForm = (openMode: 'add' | 'edit', item?: any) => {
    setFormMode(openMode);
    setCurrentStep(1);
    if (openMode === 'edit' && item) {
      setCurrentId(item.CAPAIAN_ID);
      setFormData({
        PERIODE_ID: item.PERIODE_ID?.toString() || '',
        BIDANG_ID: item.BIDANG_ID?.toString() || '',
        PROGRAM_ID: item.PROGRAM_ID?.toString() || '',
        INDIKATOR_UTAMA_ID: item.INDIKATOR_UTAMA_ID?.toString() || '',
        INDIKATOR_SUB_ID: item.INDIKATOR_ID?.toString() || '',
        INDIKATOR_KINERJA: item.INDIKATOR_KINERJA || '',
        TARGET_KINERJA: item.TARGET_KINERJA?.toString() || '',
        SATUAN_TARGET: item.SATUAN_TARGET || '',
        OUTPUT_KINERJA: item.OUTPUT_KINERJA || '',
      });
      setDetails([] as RencanaDetailRow[]);
    } else {
      setCurrentId(null);
      setFormData({
        PERIODE_ID: '',
        BIDANG_ID: '',
        PROGRAM_ID: '',
        INDIKATOR_UTAMA_ID: '',
        INDIKATOR_SUB_ID: '',
        INDIKATOR_KINERJA: '',
        TARGET_KINERJA: '',
        SATUAN_TARGET: '',
        OUTPUT_KINERJA: '',
      });
      setDetails([
        {
          TIPE_AKTIFITAS: 'UTAMA',
          NAMA_AKTIFITAS: '',
          LIST_AKTIFITAS_UTAMA_ID: '',
          LIST_AKTIFITAS_PENDUKUNG_ID: '',
          TARGET: '',
          BOBOT_TARGET: '',
        },
      ]);
    }
    setIsFormOpen(true);
  };

  const handleAddDetailRow = () => {
    setDetails(prev => [
      ...prev,
      {
        TIPE_AKTIFITAS: 'UTAMA',
        NAMA_AKTIFITAS: '',
        LIST_AKTIFITAS_UTAMA_ID: '',
        LIST_AKTIFITAS_PENDUKUNG_ID: '',
        TARGET: '',
        BOBOT_TARGET: '',
      },
    ]);
  };

  const handleRemoveDetailRow = (index: number) => {
    setDetails(prev => prev.filter((_, i) => i !== index));
  };

  const handleDetailChange = (
    index: number,
    field: keyof RencanaDetailRow,
    value: any,
  ) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        PERIODE_ID: Number(formData.PERIODE_ID),
        BIDANG_ID: Number(formData.BIDANG_ID),
        INDIKATOR_SUB_ID: Number(formData.INDIKATOR_SUB_ID),
        INDIKATOR_KINERJA: formData.INDIKATOR_KINERJA,
        TARGET_KINERJA: Number(formData.TARGET_KINERJA),
        SATUAN_TARGET: formData.SATUAN_TARGET,
        OUTPUT_KINERJA:
          formData.OUTPUT_KINERJA.trim() === ''
            ? null
            : formData.OUTPUT_KINERJA,
      };

      if (formMode === 'add') {
        if (details.length === 0) {
          alert('Minimal tambahkan 1 jenis kegiatan');
          setIsSubmitting(false);
          return;
        }
        payload.DETAIL = details.map(d => ({
          TIPE_AKTIFITAS: d.TIPE_AKTIFITAS,
          LIST_AKTIFITAS_UTAMA_ID:
            d.TIPE_AKTIFITAS === 'UTAMA'
              ? d.LIST_AKTIFITAS_UTAMA_ID
                ? Number(d.LIST_AKTIFITAS_UTAMA_ID)
                : null
              : null,
          LIST_AKTIFITAS_PENDUKUNG_ID:
            d.TIPE_AKTIFITAS === 'PENDUKUNG'
              ? d.LIST_AKTIFITAS_PENDUKUNG_ID
                ? Number(d.LIST_AKTIFITAS_PENDUKUNG_ID)
                : null
              : null,
          TARGET: Number(d.TARGET),
          BOBOT_TARGET: parseFloat(d.BOBOT_TARGET) || 0,
        }));
        await api.post('/api/rencana-kegiatan', payload);
      } else {
        await api.put(`/api/rencana-kegiatan/${currentId}`, payload);
      }
      setIsFormOpen(false);
      fetchData();
      Toast.fire({
        icon: 'success',
        title: 'Data berhasil disimpan',
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Terjadi kesalahan.',
        confirmButtonColor: '#059669',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Rencana Kegiatan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola perancangan program kerja Bapperrida
          </p>
        </div>
        <button
          onClick={() => handleOpenForm('add')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Rencana Baru
        </button>
      </div>

      <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari program / indikator..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors shadow-sm"
              />
            </div>
            <select
              value={filterBidang}
              onChange={e => setFilterBidang(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Bidang</option>
              {dropdowns.bidang?.map((b: any) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <select
              value={filterProgram}
              onChange={e => setFilterProgram(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Program</option>
              {dropdowns.program?.map((p: any) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th
                  scope="col"
                  className="w-16 px-6 py-4 text-xs font-bold tracking-wider text-center uppercase text-slate-500"
                >
                  No
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-slate-500"
                >
                  Periode
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-slate-500"
                >
                  Bidang & Program
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-slate-500"
                >
                  Indikator
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-xs font-bold tracking-wider text-center uppercase text-slate-500"
                >
                  Realisasi / Target
                </th>
                <th
                  scope="col"
                  className="w-44 px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-slate-500"
                >
                  Capaian
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-xs font-bold tracking-wider text-right uppercase text-slate-500"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 font-medium text-center text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 rounded-full border-emerald-500 border-t-transparent animate-spin"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 font-medium text-center text-slate-500"
                  >
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={item.CAPAIAN_ID}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-center text-slate-900">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {item.NAMA_PERIODE || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="mb-1 text-sm font-bold text-slate-900 line-clamp-1">
                        {item.NAMA_BIDANG || '-'}
                      </div>
                      <div className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200 line-clamp-1">
                        {item.NAMA_PROGRAM || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="mb-1 text-sm font-bold text-emerald-700 line-clamp-1">
                        {item.NAMA_INDIKATOR_UTAMA || '-'}
                      </div>
                      <div className="text-xs font-medium text-slate-600 line-clamp-1">
                        {item.NAMA_INDIKATOR || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-black text-slate-800">
                        <span className="text-emerald-600">{Number(item.REALISASI) || 0}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span>{Number(item.TARGET) || 0}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        U: {item.TOTAL_KEGIATAN_UTAMA ?? 0} &nbsp;|&nbsp; P: {item.TOTAL_KEGIATAN_PENDUKUNG ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          <span>Progress</span>
                          <span
                            className={
                              Number(item.PERSENTASE) >= 100
                                ? 'text-emerald-600'
                                : 'text-slate-700'
                            }
                          >
                            {item.PERSENTASE || 0}%
                          </span>
                        </div>
                        <div className="w-full h-2 overflow-hidden border rounded-full bg-slate-100 border-slate-200/50">
                          <div
                            className="h-full transition-all duration-500 rounded-full bg-emerald-500"
                            style={{
                              width: `${Math.min(Number(item.PERSENTASE || 0), 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-[10px] text-slate-400 tabular-nums">
                          Bobot: <span className="font-bold text-slate-600">{Number(item.BOBOT_REALISASI || 0).toFixed(4)}</span>
                          <span className="mx-1">/</span>
                          {Number(item.BOBOT_TARGET || 0).toFixed(4)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/rencana-kegiatan/detail/${item.CAPAIAN_ID}`,
                            )
                          }
                          className="p-2 transition-colors bg-white border rounded-lg shadow-sm hover:bg-emerald-50 text-emerald-600 border-emerald-200"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Edit button disabled per request 
                        <button 
                          onClick={() => handleOpenForm("edit", item)} 
                          className="p-2 text-blue-600 transition-colors bg-white border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        */}
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: 'Hapus data diblokir',
                              text: 'Hapus data utama dinonaktifkan sementara dari UI. Parent ID ini terhubung dengan realisasi.',
                              icon: 'info',
                              confirmButtonColor: '#059669',
                            });
                          }}
                          className="p-2 text-red-500 transition-colors bg-white border border-red-200 rounded-lg shadow-sm hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Rendering */}
        {!loading && filteredData.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen &&
        (() => {
          const totalSteps = formMode === 'add' ? 3 : 2;
          const stepLabels =
            formMode === 'add'
              ? ['Informasi Dasar', 'Detail Kegiatan', 'Daftar Aktifitas']
              : ['Informasi Dasar', 'Detail Kegiatan'];

          const step1Valid =
            !!formData.PERIODE_ID &&
            !!formData.BIDANG_ID &&
            !!formData.PROGRAM_ID &&
            !!formData.INDIKATOR_UTAMA_ID &&
            !!formData.INDIKATOR_SUB_ID;

          const step2Valid =
            !!formData.INDIKATOR_KINERJA &&
            !!formData.TARGET_KINERJA &&
            !!formData.SATUAN_TARGET;

          const canProceed = currentStep === 1 ? step1Valid : step2Valid;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="flex flex-col w-full max-w-lg overflow-hidden bg-white shadow-xl rounded-2xl max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                  <h2 className="text-lg font-bold text-slate-900">
                    {formMode === 'add'
                      ? 'Tambah Rencana Kegiatan'
                      : 'Edit Rencana Kegiatan'}
                  </h2>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-1 bg-white border rounded-full shadow-sm text-slate-400 hover:text-slate-600 border-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 py-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center">
                    {stepLabels.map((label, i) => (
                      <React.Fragment key={i}>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                              currentStep > i + 1
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : currentStep === i + 1
                                  ? 'bg-white border-emerald-500 text-emerald-600'
                                  : 'bg-white border-slate-300 text-slate-400'
                            }`}
                          >
                            {currentStep > i + 1 ? '✓' : i + 1}
                          </div>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wide whitespace-nowrap ${
                              currentStep === i + 1
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                        {i < stepLabels.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-2 mb-3 transition-colors ${
                              currentStep > i + 1
                                ? 'bg-emerald-400'
                                : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Step Content */}
                <div className="p-6 space-y-4 overflow-y-auto">
                  {/* Step 1: Informasi Dasar */}
                  {currentStep === 1 && (
                    <>
                      <div>
                        <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                          Periode
                        </label>
                        <select
                          value={formData.PERIODE_ID}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              PERIODE_ID: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 text-sm font-medium bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Pilih Periode...</option>
                          {dropdowns.periode?.map((p: any) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                          Bidang
                        </label>
                        <select
                          value={formData.BIDANG_ID}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              BIDANG_ID: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 text-sm font-medium bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Pilih Bidang...</option>
                          {dropdowns.bidang?.map((b: any) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                          Program
                        </label>
                        <select
                          value={formData.PROGRAM_ID}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              PROGRAM_ID: e.target.value,
                              INDIKATOR_UTAMA_ID: '',
                              INDIKATOR_SUB_ID: '',
                            })
                          }
                          className="w-full px-4 py-2 text-sm font-medium bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Pilih Program...</option>
                          {dropdowns.program?.map((p: any) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.PROGRAM_ID && (
                        <div>
                          <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                            Indikator Utama
                          </label>
                          <select
                            value={formData.INDIKATOR_UTAMA_ID}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                INDIKATOR_UTAMA_ID: e.target.value,
                                INDIKATOR_SUB_ID: '',
                              })
                            }
                            className="w-full px-4 py-2 text-sm font-medium bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">Pilih Indikator Utama...</option>
                            {dropdowns.indikator_utama
                              ?.filter(
                                (i: any) =>
                                  String(i.PROGRAM_ID) ===
                                  String(formData.PROGRAM_ID),
                              )
                              .map((i: any) => (
                                <option key={i.value} value={i.value}>
                                  {i.label}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                      {formData.INDIKATOR_UTAMA_ID && (
                        <div>
                          <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                            Sub Indikator
                          </label>
                          <select
                            value={formData.INDIKATOR_SUB_ID}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                INDIKATOR_SUB_ID: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 text-sm font-medium bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">Pilih Sub Indikator...</option>
                            {dropdowns.indikator
                              ?.filter(
                                (i: any) =>
                                  String(i.INDIKATOR_UTAMA_ID) ===
                                  String(formData.INDIKATOR_UTAMA_ID),
                              )
                              .map((i: any) => (
                                <option key={i.value} value={i.value}>
                                  {i.label}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {/* Step 2: Detail Kegiatan */}
                  {currentStep === 2 && (
                    <>
                      <div>
                        <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                          Indikator Kinerja
                        </label>
                        <input
                          type="text"
                          value={formData.INDIKATOR_KINERJA}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              INDIKATOR_KINERJA: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 text-sm font-medium bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                            Target Kinerja
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={formData.TARGET_KINERJA}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                TARGET_KINERJA: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 text-sm font-medium bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                            Satuan Target
                          </label>
                          <input
                            type="text"
                            value={formData.SATUAN_TARGET}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                SATUAN_TARGET: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 text-sm font-medium bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                          Output Kinerja{' '}
                          <span className="font-normal normal-case text-slate-400">
                            (opsional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={formData.OUTPUT_KINERJA}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              OUTPUT_KINERJA: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 text-sm font-medium bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Step 3: Daftar Aktifitas (add mode only) */}
                  {currentStep === 3 && formMode === 'add' && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold uppercase text-slate-700">
                          Daftar Detail Aktifitas
                        </p>
                        <button
                          type="button"
                          onClick={handleAddDetailRow}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tambah
                        </button>
                      </div>
                      <div className="space-y-3">
                        {details.map((detail, index) => (
                          <div
                            key={index}
                            className="relative p-4 space-y-3 border bg-slate-50 rounded-xl border-slate-100"
                          >
                            {details.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDetailRow(index)}
                                className="absolute top-0 right-0 p-1 text-red-500 transform bg-white border border-red-200 rounded-full shadow-sm translate-x-1/3 -translate-y-1/3 hover:bg-red-50"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                                  Tipe
                                </label>
                                <select
                                  value={detail.TIPE_AKTIFITAS}
                                  onChange={e => {
                                    const newDetails = [...details];
                                    newDetails[index] = {
                                      ...newDetails[index],
                                      TIPE_AKTIFITAS: e.target.value as
                                        | 'UTAMA'
                                        | 'PENDUKUNG',
                                      LIST_AKTIFITAS_UTAMA_ID: '',
                                      LIST_AKTIFITAS_PENDUKUNG_ID: '',
                                      NAMA_AKTIFITAS: '',
                                    };
                                    setDetails(newDetails);
                                  }}
                                  className="w-full px-3 py-2 text-sm font-medium bg-white border rounded-lg border-slate-200 focus:ring-2 focus:ring-emerald-500"
                                >
                                  <option value="UTAMA">UTAMA</option>
                                  <option value="PENDUKUNG">PENDUKUNG</option>
                                </select>
                              </div>
                              <div>
                                <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                                  {detail.TIPE_AKTIFITAS === 'UTAMA'
                                    ? 'Pilih Aktifitas Utama'
                                    : 'Pilih Aktifitas Pendukung'}
                                </label>
                                {detail.TIPE_AKTIFITAS === 'UTAMA' ? (
                                  <select
                                    value={detail.LIST_AKTIFITAS_UTAMA_ID}
                                    onChange={e => {
                                      const selected =
                                        dropdowns.aktifitas_utama?.find(
                                          (a: any) =>
                                            String(a.value) ===
                                            String(e.target.value),
                                        );
                                      const newDetails = [...details];
                                      newDetails[index] = {
                                        ...newDetails[index],
                                        LIST_AKTIFITAS_UTAMA_ID: e.target.value,
                                        LIST_AKTIFITAS_PENDUKUNG_ID: '',
                                        NAMA_AKTIFITAS: selected?.label || '',
                                      };
                                      setDetails(newDetails);
                                    }}
                                    className="w-full px-3 py-2 text-sm font-medium bg-white border rounded-lg border-slate-200 focus:ring-2 focus:ring-emerald-500"
                                  >
                                    <option value="">Pilih...</option>
                                    {dropdowns.aktifitas_utama?.map(
                                      (a: any) => (
                                        <option key={a.value} value={a.value}>
                                          {a.label}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                ) : (
                                  <select
                                    value={detail.LIST_AKTIFITAS_PENDUKUNG_ID}
                                    onChange={e => {
                                      const selected =
                                        dropdowns.aktifitas_pendukung?.find(
                                          (a: any) =>
                                            String(a.value) ===
                                            String(e.target.value),
                                        );
                                      const newDetails = [...details];
                                      newDetails[index] = {
                                        ...newDetails[index],
                                        LIST_AKTIFITAS_UTAMA_ID: '',
                                        LIST_AKTIFITAS_PENDUKUNG_ID:
                                          e.target.value,
                                        NAMA_AKTIFITAS: selected?.label || '',
                                      };
                                      setDetails(newDetails);
                                    }}
                                    className="w-full px-3 py-2 text-sm font-medium bg-white border rounded-lg border-slate-200 focus:ring-2 focus:ring-emerald-500"
                                  >
                                    <option value="">Pilih...</option>
                                    {dropdowns.aktifitas_pendukung
                                      ?.filter((a: any) =>
                                        a.INDIKATOR_SUB_ID
                                          ? String(a.INDIKATOR_SUB_ID) ===
                                            String(formData.INDIKATOR_SUB_ID)
                                          : true,
                                      )
                                      .map((a: any) => (
                                        <option key={a.value} value={a.value}>
                                          {a.label}
                                        </option>
                                      ))}
                                  </select>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                                Nama Aktifitas
                              </label>
                              <input
                                type="text"
                                value={detail.NAMA_AKTIFITAS}
                                onChange={e =>
                                  handleDetailChange(
                                    index,
                                    'NAMA_AKTIFITAS',
                                    e.target.value,
                                  )
                                }
                                placeholder="Terisi otomatis dari pilihan di atas"
                                className="w-full px-3 py-2 text-sm font-medium bg-white border rounded-lg border-slate-200 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                                  Target
                                </label>
                                <input
                                  required
                                  type="number"
                                  min={0}
                                  value={detail.TARGET}
                                  onChange={e =>
                                    handleDetailChange(
                                      index,
                                      'TARGET',
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm font-medium bg-white border rounded-lg border-slate-200 focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block mb-2 text-xs font-bold uppercase text-slate-700">
                                  Bobot Target
                                </label>
                                <input
                                  required
                                  type="number"
                                  min={0}
                                  step="0.0001"
                                  value={detail.BOBOT_TARGET}
                                  onChange={e =>
                                    handleDetailChange(
                                      index,
                                      'BOBOT_TARGET',
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm font-medium bg-white border rounded-lg border-slate-200 focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep === 1) setIsFormOpen(false);
                      else setCurrentStep(s => s - 1);
                    }}
                    className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 text-sm shadow-sm transition-colors"
                  >
                    {currentStep === 1 ? 'Batal' : '← Kembali'}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">
                      {currentStep} / {totalSteps}
                    </span>
                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(s => s + 1)}
                        disabled={!canProceed}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-sm transition-colors"
                      >
                        Lanjut →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2 min-w-[120px] justify-center disabled:opacity-70"
                      >
                        {isSubmitting && (
                          <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                        )}
                        Simpan Data
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
