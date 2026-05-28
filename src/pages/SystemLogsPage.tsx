import { useEffect, useState } from 'react';
import api from '../api';
import { Loader2, FileText, AlertCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface SystemLog {
    id: number;
    platformUserId?: number | null;
    action: string;
    details?: string | null;
    ipAddress?: string | null;
    createdAt: string;
}

interface LogsResponse {
    total: number;
    page: number;
    pageSize: number;
    items: SystemLog[];
}

const PAGE_SIZE = 50;

export default function SystemLogsPage() {
    const [items, setItems] = useState<SystemLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');
    const [userIdFilter, setUserIdFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const load = async (p: number) => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const params = new URLSearchParams();
            params.append('page', String(p));
            params.append('pageSize', String(PAGE_SIZE));
            if (actionFilter.trim()) params.append('action', actionFilter.trim());
            if (userIdFilter.trim()) params.append('userId', userIdFilter.trim());
            const res = await api.get<LogsResponse>(`/dashboard/system-logs?${params.toString()}`);
            setItems(res.data?.items ?? []);
            setTotal(res.data?.total ?? 0);
            setPage(res.data?.page ?? p);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? 'Loglar yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(1); /* eslint-disable-next-line */ }, []);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const handleExportCsv = () => {
        const header = ['id', 'createdAt', 'platformUserId', 'action', 'details', 'ipAddress'];
        const rows = items.map(l => [
            l.id,
            l.createdAt,
            l.platformUserId ?? '',
            csvEscape(l.action),
            csvEscape(l.details ?? ''),
            csvEscape(l.ipAddress ?? ''),
        ].join(','));
        const csv = [header.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-page${page}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sistem Logları</h1>
                    <p className="text-sm text-gray-500 mt-1">Sistemde yapılan kritik aksiyonların kaydı.</p>
                </div>
                <button
                    onClick={handleExportCsv}
                    disabled={items.length === 0}
                    className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 disabled:opacity-50"
                >
                    <Download size={14} /> CSV İndir
                </button>
            </div>

            <div className="bg-white rounded-[20px] p-4 shadow-sm flex flex-wrap items-center gap-2">
                <input
                    type="text"
                    placeholder="Aksiyon (ör: CommunityApproved)"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-[#E02020]/50 outline-none w-64"
                />
                <input
                    type="number"
                    placeholder="Kullanıcı ID"
                    value={userIdFilter}
                    onChange={(e) => setUserIdFilter(e.target.value)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-[#E02020]/50 outline-none w-32"
                />
                <button
                    onClick={() => load(1)}
                    className="bg-[#E30613] hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                    Filtrele
                </button>
                <span className="ml-auto text-xs text-gray-400 font-semibold">{total} kayıt</span>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border-l-4 border-[#E30613] p-3 rounded-lg flex items-start gap-2 text-sm text-red-800">
                    <AlertCircle size={16} className="mt-0.5" /> <span>{errorMsg}</span>
                </div>
            )}

            <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="py-12 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#E30613]" /></div>
                ) : items.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                        <FileText size={32} className="text-gray-300" />
                        Henüz log yok.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">Tarih</th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">Kullanıcı</th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">Aksiyon</th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">Detay</th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-6 py-3">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(l => (
                                    <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                                        <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap font-mono text-xs">
                                            {new Date(l.createdAt).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-700">
                                            {l.platformUserId ? <span className="font-mono">#{l.platformUserId}</span> : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-6 py-3 text-sm">
                                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                                {l.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-700 max-w-md truncate" title={l.details ?? ''}>
                                            {l.details ?? '—'}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-400 font-mono text-xs">{l.ipAddress ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Sayfa {page} / {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => load(page - 1)}
                                disabled={page <= 1}
                                className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 disabled:opacity-40"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => load(page + 1)}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 disabled:opacity-40"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function csvEscape(s: string) {
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}
