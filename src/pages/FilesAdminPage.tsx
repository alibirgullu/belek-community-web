import { useEffect, useState } from 'react';
import api from '../api';
import { toast } from 'sonner';
import { Loader2, Trash2, Image as ImageIcon, ChevronRight, AlertCircle } from 'lucide-react';

interface FileItem {
    publicId: string;
    url: string;
    format: string;
    bytes: number;
    width: number;
    height: number;
    folder?: string | null;
    createdAt: string;
}

interface ListResponse {
    items: FileItem[];
    nextCursor?: string | null;
}

const FOLDERS = ['', 'general', 'profiles', 'announcements', 'events'];

function humanSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FilesAdminPage() {
    const [items, setItems] = useState<FileItem[]>([]);
    const [folder, setFolder] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const load = async (reset: boolean) => {
        if (reset) {
            setIsLoading(true);
            setItems([]);
        } else {
            setLoadingMore(true);
        }
        setErrorMsg(null);
        try {
            const params = new URLSearchParams();
            if (folder) params.append('folder', folder);
            params.append('maxResults', '40');
            if (!reset && nextCursor) params.append('nextCursor', nextCursor);
            const res = await api.get<ListResponse>(`/files?${params.toString()}`);
            const incoming = res.data?.items ?? [];
            setItems(prev => reset ? incoming : [...prev, ...incoming]);
            setNextCursor(res.data?.nextCursor ?? null);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? 'Listelenemedi (Cloudinary yapılandırması kontrol et).');
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => { load(true); /* eslint-disable-next-line */ }, [folder]);

    const handleDelete = async (it: FileItem) => {
        if (!confirm(`"${it.publicId}" dosyasını silmek istediğine emin misin?`)) return;
        try {
            await api.delete(`/files?publicId=${encodeURIComponent(it.publicId)}`);
            setItems(prev => prev.filter(x => x.publicId !== it.publicId));
            toast.success('Dosya silindi.');
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Silinemedi.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dosyalar</h1>
                <p className="text-sm text-gray-500 mt-1">Cloudinary'ye yüklenmiş görselleri buradan listele ve temizle.</p>
            </div>

            <div className="bg-white rounded-[20px] p-4 shadow-sm flex flex-wrap items-center gap-2">
                {FOLDERS.map(f => (
                    <button
                        key={f || 'all'}
                        onClick={() => setFolder(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            folder === f ? 'bg-[#E30613] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {f || 'Tümü'}
                    </button>
                ))}
                <span className="ml-auto text-xs text-gray-400 font-semibold">{items.length} dosya</span>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border-l-4 border-[#E30613] p-3 rounded-lg flex items-start gap-2 text-sm text-red-800">
                    <AlertCircle size={16} className="mt-0.5" /> <span>{errorMsg}</span>
                </div>
            )}

            <div className="bg-white rounded-[20px] p-6 shadow-sm">
                {isLoading ? (
                    <div className="py-12 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#E30613]" /></div>
                ) : items.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">Bu klasörde dosya yok.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {items.map(it => (
                            <div key={it.publicId} className="group relative border border-gray-100 rounded-2xl overflow-hidden bg-gray-50">
                                <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
                                    {it.url ? (
                                        <img src={it.url} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <ImageIcon size={32} className="text-gray-300" />
                                    )}
                                </div>
                                <div className="p-2.5">
                                    <div className="text-[11px] font-semibold text-gray-700 truncate" title={it.publicId}>{it.publicId.split('/').pop()}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-between">
                                        <span>{humanSize(it.bytes)} · {it.format}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(it)}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 backdrop-blur text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    title="Sil"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {nextCursor && !isLoading && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => load(false)}
                            disabled={loadingMore}
                            className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-5 py-2 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 disabled:opacity-50"
                        >
                            {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                            Daha Fazla Yükle
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
