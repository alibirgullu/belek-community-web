import { useState, useEffect } from 'react';
import { UserX, UserCheck, Shield, Search, Eye, X, Smartphone, Monitor, Tablet, LogOut, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api';
import { toast } from 'sonner';
import { formatRelativeTime } from '../lib/auth';

interface User {
    id: number;
    firstName: string;
    lastName: string;
    status: string;
}

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
    if (t.includes('ios') || t.includes('android') || t.includes('mobile')) return <Smartphone size={16} />;
    if (t.includes('tablet') || t.includes('ipad')) return <Tablet size={16} />;
    return <Monitor size={16} />;
}

export default function UsersAdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [detailUser, setDetailUser] = useState<User | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [devicesLoading, setDevicesLoading] = useState(false);
    const [devicesError, setDevicesError] = useState<string | null>(null);
    const [revoking, setRevoking] = useState(false);
    const [drawerMsg, setDrawerMsg] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Kullanıcılar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleToggleStatus = async (userId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        try {
            await api.put(`/users/${userId}/status`, { status: newStatus });
            toast.success(newStatus === 'Active' ? 'Kullanıcı aktifleştirildi.' : 'Kullanıcı askıya alındı.');
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Durum güncellenirken hata oluştu.');
        }
    };

    const openDetails = async (u: User) => {
        setDetailUser(u);
        setDevices([]);
        setDevicesError(null);
        setDrawerMsg(null);
        setDevicesLoading(true);
        try {
            const res = await api.get(`/users/${u.id}/devices`);
            setDevices(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setDevicesError(err.response?.data?.message ?? 'Cihazlar yüklenemedi.');
        } finally {
            setDevicesLoading(false);
        }
    };

    const closeDetails = () => {
        setDetailUser(null);
        setDevices([]);
        setDrawerMsg(null);
    };

    const handleForceLogout = async () => {
        if (!detailUser) return;
        if (!confirm(`${detailUser.firstName} ${detailUser.lastName} kullanıcısının tüm aktif oturumları sonlandırılacak. Devam et?`)) return;
        setRevoking(true);
        setDrawerMsg(null);
        try {
            const res = await api.delete(`/users/${detailUser.id}/sessions`);
            const count = res.data?.revokedCount ?? res.data?.RevokedCount ?? 0;
            setDrawerMsg(`${count} oturum sonlandırıldı.`);
        } catch (err: any) {
            setDrawerMsg(err.response?.data?.message ?? 'İşlem başarısız.');
        } finally {
            setRevoking(false);
        }
    };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                    <Shield className="text-[#E02020]" />
                    Kullanıcı Yönetimi
                </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden p-6">
                <div className="mb-6 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] sm:text-sm transition-all shadow-sm"
                        placeholder="İsim veya soyisim ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-[#E30613] p-3 rounded-lg mb-6 text-sm text-red-800">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="h-40 flex items-center justify-center">
                        <Loader2 className="animate-spin h-8 w-8 text-[#E02020]" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-sm font-semibold text-gray-500 bg-gray-50">
                                    <th className="p-4 rounded-tl-lg font-medium">ID</th>
                                    <th className="p-4 font-medium">Ad Soyad</th>
                                    <th className="p-4 font-medium">Durum</th>
                                    <th className="p-4 text-right rounded-tr-lg font-medium">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">
                                            Sonuç bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="p-4 font-mono text-gray-400">#{user.id}</td>
                                            <td className="p-4 font-medium text-gray-900">
                                                {user.firstName} {user.lastName}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                                    user.status === 'Active'
                                                        ? 'bg-green-100 text-green-700 border-green-200'
                                                        : 'bg-red-100 text-red-700 border-red-200'
                                                }`}>
                                                    {user.status === 'Active' ? 'Aktif' : 'Askıya Alındı'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => openDetails(user)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all"
                                                    >
                                                        <Eye size={14} /> Detay
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(user.id, user.status)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                            user.status === 'Active'
                                                                ? 'bg-red-50 text-red-600 hover:bg-[#E02020] hover:text-white border border-transparent hover:shadow-md'
                                                                : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-transparent hover:shadow-md'
                                                            }`}
                                                    >
                                                        {user.status === 'Active' ? (
                                                            <><UserX size={14} /> Askıya Al</>
                                                        ) : (
                                                            <><UserCheck size={14} /> Aktifleştir</>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Drawer */}
            {detailUser && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={closeDetails}>
                    <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{detailUser.firstName} {detailUser.lastName}</h3>
                                <p className="text-xs text-gray-500 font-mono">#{detailUser.id}</p>
                            </div>
                            <button onClick={closeDetails} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                                <Row label="Ad Soyad" value={<span className="font-bold text-gray-900">{detailUser.firstName} {detailUser.lastName}</span>} />
                                <Row label="Durum" value={
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                        detailUser.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                                    }`}>
                                        {detailUser.status === 'Active' ? 'Aktif' : 'Askıya Alındı'}
                                    </span>
                                } />
                                <Row label="ID" value={<span className="text-gray-400 font-mono">#{detailUser.id}</span>} />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Kayıtlı Cihazlar</h4>
                                    <button
                                        onClick={handleForceLogout}
                                        disabled={revoking}
                                        className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                                    >
                                        {revoking ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                                        Zorla Çıkış
                                    </button>
                                </div>

                                {drawerMsg && (
                                    <div className="mb-3 bg-green-50 border-l-4 border-green-500 p-2.5 rounded-lg flex items-start gap-2 text-xs text-green-800">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0" /> <span>{drawerMsg}</span>
                                    </div>
                                )}

                                {devicesError && (
                                    <div className="mb-3 bg-red-50 border-l-4 border-[#E30613] p-2.5 rounded-lg flex items-start gap-2 text-xs text-red-800">
                                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> <span>{devicesError}</span>
                                    </div>
                                )}

                                {devicesLoading ? (
                                    <div className="py-8 flex items-center justify-center"><Loader2 className="animate-spin h-6 w-6 text-[#E30613]" /></div>
                                ) : devices.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">Kayıtlı cihaz yok.</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {devices.map(d => (
                                            <li key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${d.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {iconFor(d.deviceType)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 truncate">
                                                        {d.deviceName || 'İsimsiz'} <span className="text-xs text-gray-400 font-normal">({d.deviceType || '?'})</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">
                                                        Son aktif: {formatRelativeTime(d.lastActiveAt)}
                                                    </div>
                                                </div>
                                                {d.isActive && (
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-1.5 py-0.5 rounded">Aktif</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</span>
            {value}
        </div>
    );
}
