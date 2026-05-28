import { useEffect, useState } from 'react';
import api from '../api';
import { Loader2, Smartphone, Monitor, Tablet, LogOut, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '../lib/auth';

interface Device {
    id: number;
    deviceType?: string | null;
    deviceName?: string | null;
    lastActiveAt: string;
    createdAt: string;
    isActive: boolean;
}

function iconFor(type?: string | null) {
    const t = (type ?? '').toLowerCase();
    if (t.includes('ios') || t.includes('android') || t.includes('mobile')) return <Smartphone size={18} />;
    if (t.includes('tablet') || t.includes('ipad')) return <Tablet size={18} />;
    return <Monitor size={18} />;
}

export default function ActiveSessionsPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [revoking, setRevoking] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/users/me/devices');
            setDevices(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? 'Cihazlar yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (d: Device) => {
        if (!confirm(`"${d.deviceName ?? 'Cihaz'}" kaydını silmek istediğine emin misin?`)) return;
        try {
            await api.delete(`/users/me/devices/${d.id}`);
            setDevices(prev => prev.filter(x => x.id !== d.id));
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? 'Silinemedi.');
        }
    };

    const handleRevokeOthers = async () => {
        if (!confirm('Mevcut cihaz dışındaki tüm oturumlar sonlandırılacak. Devam et?')) return;
        setRevoking(true);
        setSuccessMsg(null);
        setErrorMsg(null);
        try {
            const refreshToken = localStorage.getItem('sksAdminRefreshToken');
            const res = await api.delete('/users/me/sessions', { data: { refreshToken } });
            const count = res.data?.revokedCount ?? res.data?.RevokedCount ?? 0;
            setSuccessMsg(`${count} oturum sonlandırıldı.`);
            setTimeout(() => setSuccessMsg(null), 5000);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? 'İşlem başarısız.');
        } finally {
            setRevoking(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Aktif Oturumlar</h1>
                <p className="text-sm text-gray-500 mt-1">Hesabına bağlı cihazları ve oturumları buradan yönet.</p>
            </div>

            {successMsg && (
                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg flex items-start gap-2 text-sm text-green-800">
                    <CheckCircle size={16} className="mt-0.5" /> <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="bg-red-50 border-l-4 border-[#E30613] p-3 rounded-lg flex items-start gap-2 text-sm text-red-800">
                    <AlertCircle size={16} className="mt-0.5" /> <span>{errorMsg}</span>
                </div>
            )}

            <div className="bg-white rounded-[20px] p-6 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900">Diğer her yerden çıkış yap</h3>
                    <p className="text-sm text-gray-500 mt-1">Bu tarayıcı dışındaki tüm aktif oturumları sonlandırır.</p>
                </div>
                <button
                    onClick={handleRevokeOthers}
                    disabled={revoking}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                    {revoking ? <Loader2 className="animate-spin h-4 w-4" /> : <LogOut size={14} />}
                    Sonlandır
                </button>
            </div>

            <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Kayıtlı Cihazlar</h3>
                </div>
                {isLoading ? (
                    <div className="py-12 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#E30613]" /></div>
                ) : devices.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">Kayıtlı cihaz yok.</div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {devices.map(d => (
                            <li key={d.id} className="flex items-center gap-3 px-6 py-4 group">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${d.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {iconFor(d.deviceType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-gray-900 truncate">
                                        {d.deviceName || 'İsimsiz Cihaz'} <span className="text-xs text-gray-400 font-normal">({d.deviceType || 'Bilinmiyor'})</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Son aktif: {formatRelativeTime(d.lastActiveAt)} · Kayıt: {new Date(d.createdAt).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                                {d.isActive && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded">Aktif</span>
                                )}
                                <button
                                    onClick={() => handleDelete(d)}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Sil"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
