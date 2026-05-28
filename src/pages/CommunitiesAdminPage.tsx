import { useEffect, useState } from 'react';
import api from '../api';
import { toast } from 'sonner';
import { Loader2, Plus, CheckCircle, XCircle, Search, Users as UsersIcon, UserPlus, Info, Trash2, Upload, ImageIcon } from 'lucide-react';

interface Community {
    id: number;
    name: string;
    status: string;
    createdAt: string;
    presidentName?: string;
    description?: string;
    categoryId?: number;
    categoryName?: string;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
}

interface Member {
    id: number;
    userId: number;
    fullName: string;
    profileImageUrl?: string | null;
    role: string;
    joinedAt: string;
}

interface PendingMember {
    userId: number;
    fullName: string;
    profileImageUrl?: string | null;
    requestedAt: string;
}

interface RoleOption { id: number; name: string; }

type DetailTab = 'general' | 'members' | 'pending';

const ROLE_NAMES = ['Başkan', 'Admin', 'Üye'];

export default function CommunitiesAdminPage() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPresidentEmail, setNewPresidentEmail] = useState('');
    const [newLogoUrl, setNewLogoUrl] = useState('');
    const [newCoverUrl, setNewCoverUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isSavingImages, setIsSavingImages] = useState(false);

    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);

    const [detailTab, setDetailTab] = useState<DetailTab>('general');
    const [members, setMembers] = useState<Member[]>([]);
    const [pending, setPending] = useState<PendingMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [pendingError, setPendingError] = useState<string | null>(null);

    useEffect(() => {
        fetchCommunities();
        fetchCategories();

        if (!document.getElementById('confetti-script')) {
            const script = document.createElement('script');
            script.id = 'confetti-script';
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/communities/categories');
            setCategories(response.data);
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    };

    const fetchCommunities = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/communities');
            setCommunities(response.data);
        } catch (err) {
            console.error('Failed to load communities', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await api.put(`/communities/${id}/status`, { status });
            if (status === 'Active' && typeof (window as any).confetti === 'function') {
                (window as any).confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#E02020', '#FFFFFF', '#FFD700', '#4CAF50']
                });
            }
            toast.success(status === 'Active' ? 'Topluluk onaylandı.' : 'Topluluk güncellendi.');
            fetchCommunities();
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.response?.data?.Message || 'Bilinmeyen hata.');
        }
    };

    const handleUpdateCategory = async (communityId: number, categoryId: number) => {
        try {
            await api.put(`/communities/${communityId}/category`, { categoryId });
            toast.success('Kategori güncellendi.');
            fetchCommunities();
        } catch {
            toast.error('Kategori güncellenirken bir hata oluştu.');
        }
    };

    const handleCreateCommunity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setIsSubmitting(true);
        try {
            await api.post('/communities', {
                name: newName,
                description: newDesc,
                presidentEmail: newPresidentEmail || undefined,
                logoUrl: newLogoUrl || null,
                coverImageUrl: newCoverUrl || null,
            });
            toast.success('Topluluk oluşturuldu.');
            fetchCommunities();
            setIsAddModalOpen(false);
            setNewName('');
            setNewDesc('');
            setNewPresidentEmail('');
            setNewLogoUrl('');
            setNewCoverUrl('');
        } catch {
            toast.error('Topluluk oluşturulurken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveImages = async (logoUrl: string, coverImageUrl: string) => {
        if (!selectedCommunity) return;
        setIsSavingImages(true);
        try {
            await api.put(`/communities/${selectedCommunity.id}`, {
                categoryId: selectedCommunity.categoryId ?? 1,
                name: selectedCommunity.name,
                description: selectedCommunity.description ?? '',
                logoUrl: logoUrl || null,
                coverImageUrl: coverImageUrl || null,
                status: selectedCommunity.status,
            });
            setSelectedCommunity({ ...selectedCommunity, logoUrl, coverImageUrl });
            toast.success('Görseller güncellendi.');
            fetchCommunities();
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Görseller güncellenemedi.');
        } finally {
            setIsSavingImages(false);
        }
    };

    const openDetails = (c: Community) => {
        setSelectedCommunity(c);
        setIsDetailsModalOpen(true);
        setDetailTab('general');
        setMembers([]);
        setPending([]);
        setMembersError(null);
        setPendingError(null);
    };

    const closeDetails = () => {
        setIsDetailsModalOpen(false);
        setSelectedCommunity(null);
    };

    const loadMembers = async (communityId: number) => {
        setMembersLoading(true);
        setMembersError(null);
        try {
            const res = await api.get(`/communities/${communityId}/members`);
            setMembers(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setMembersError(err.response?.data?.message ?? err.response?.data?.Message ?? 'Üyeler yüklenemedi.');
        } finally {
            setMembersLoading(false);
        }
    };

    const loadPending = async (communityId: number) => {
        setPendingLoading(true);
        setPendingError(null);
        try {
            const res = await api.get(`/communities/${communityId}/members/pending`);
            setPending(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setPendingError(err.response?.data?.message ?? err.response?.data?.Message ?? 'Bekleyen üyeler yüklenemedi.');
        } finally {
            setPendingLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedCommunity) return;
        if (detailTab === 'members') loadMembers(selectedCommunity.id);
        if (detailTab === 'pending') loadPending(selectedCommunity.id);
    }, [detailTab, selectedCommunity]);

    const handleChangeRole = async (cid: number, userId: number, roleName: string) => {
        try {
            await api.put(`/communities/${cid}/members/${userId}/role/${encodeURIComponent(roleName)}`);
            toast.success('Rol güncellendi.');
            loadMembers(cid);
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Rol güncellenemedi.');
        }
    };

    const handleRemoveMember = async (cid: number, userId: number, name: string) => {
        if (!confirm(`${name} kullanıcısını topluluktan çıkarmak istediğine emin misin?`)) return;
        try {
            await api.delete(`/communities/${cid}/members/${userId}`);
            toast.success(`${name} topluluktan çıkarıldı.`);
            loadMembers(cid);
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Çıkarılamadı.');
        }
    };

    const handleApprovePending = async (cid: number, userId: number) => {
        try {
            await api.put(`/communities/${cid}/members/${userId}/approve`);
            toast.success('Üye onaylandı.');
            loadPending(cid);
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Onaylanamadı.');
        }
    };

    const handleRejectPending = async (cid: number, userId: number) => {
        try {
            await api.put(`/communities/${cid}/members/${userId}/reject`);
            toast.success('Üyelik reddedildi.');
            loadPending(cid);
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Reddedilemedi.');
        }
    };

    const filteredCommunities = communities.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 font-inter tracking-tight">Topluluk Yönetimi</h2>
                    <p className="text-gray-500 text-sm mt-1">Sistemdeki tüm toplulukları buradan inceleyip yönetebilirsiniz.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-[#E02020] to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                    <Plus size={20} />
                    <span className="font-medium">Yeni Ekle</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden text-gray-900">
                <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-gray-50/80">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Topluluk ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none text-gray-900 placeholder-gray-400"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Topluluk Adı</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Oluşturulma</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin h-8 w-8 text-[#E02020] mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredCommunities.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : filteredCommunities.map((community) => (
                                <tr key={community.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{community.name}</div>
                                        <div className="text-xs text-gray-400 mt-1 font-mono">ID: {community.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${community.status === 'Active'
                                            ? 'bg-green-100 text-green-700 border-green-200'
                                            : community.status === 'Pending'
                                                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                : 'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}>
                                            {community.status === 'Active' ? 'Aktif'
                                                : community.status === 'Pending' ? 'Onay Bekliyor'
                                                    : community.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(community.createdAt).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        {community.status === 'Pending' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(community.id, 'Active')} className="text-green-600 hover:text-green-700" title="Onayla">
                                                    <CheckCircle className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleUpdateStatus(community.id, 'Rejected')} className="text-[#E02020] hover:text-red-700" title="Reddet">
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => openDetails(community)}
                                            className="text-gray-700 hover:text-[#E02020] bg-gray-100 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent transition-all text-xs font-semibold"
                                        >
                                            Detaylar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Community Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Yeni Topluluk Ekle</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCommunity} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topluluk Adı</label>
                                <input
                                    type="text" required value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Örn: Dağcılık Kulübü"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] bg-white text-gray-900 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kısa Açıklama</label>
                                <textarea
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] bg-white text-gray-900 font-medium resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Başkan E-Posta</label>
                                <input
                                    type="email" value={newPresidentEmail}
                                    onChange={(e) => setNewPresidentEmail(e.target.value)}
                                    placeholder="ogrenci@belek.edu.tr"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] bg-white text-gray-900 font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <ImageUploader label="Logo" value={newLogoUrl} onChange={setNewLogoUrl} aspectClass="aspect-square" />
                                <ImageUploader label="Kapak Görseli" value={newCoverUrl} onChange={setNewCoverUrl} aspectClass="aspect-square" />
                            </div>
                            <div className="pt-2 flex space-x-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold">
                                    İptal
                                </button>
                                <button type="submit" disabled={isSubmitting || !newName.trim()} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#E02020] to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-bold disabled:opacity-50 flex items-center justify-center">
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsModalOpen && selectedCommunity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{selectedCommunity.name}</h3>
                            <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={22} />
                            </button>
                        </div>

                        <div className="flex border-b border-gray-100 flex-shrink-0">
                            {([
                                { id: 'general' as DetailTab, label: 'Genel', icon: Info },
                                { id: 'members' as DetailTab, label: 'Üyeler', icon: UsersIcon },
                                { id: 'pending' as DetailTab, label: 'Bekleyenler', icon: UserPlus },
                            ]).map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setDetailTab(t.id)}
                                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                                        detailTab === t.id ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <t.icon size={14} /> {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {detailTab === 'general' && (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3 text-sm">
                                        <Row label="Durum" value={
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                                selectedCommunity.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                            }`}>
                                                {selectedCommunity.status === 'Active' ? 'Aktif' : 'Onay Bekliyor'}
                                            </span>
                                        } />
                                        <Row label="Başkan" value={<span className="font-bold text-gray-900">{selectedCommunity.presidentName || 'Henüz Atanmadı'}</span>} />
                                        <Row label="Kategori" value={
                                            <select
                                                className="text-sm border border-gray-300 rounded-md px-2 py-1 outline-none text-gray-900 font-medium bg-white"
                                                value={selectedCommunity.categoryId || ''}
                                                onChange={(e) => {
                                                    const catId = Number(e.target.value);
                                                    if (catId) {
                                                        setSelectedCommunity({ ...selectedCommunity, categoryId: catId });
                                                        handleUpdateCategory(selectedCommunity.id, catId);
                                                    }
                                                }}
                                            >
                                                <option value="" disabled>Kategori Seç</option>
                                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        } />
                                        <Row label="Oluşturulma" value={<span className="text-gray-900 font-medium">{new Date(selectedCommunity.createdAt).toLocaleDateString('tr-TR')}</span>} />
                                        <Row label="Sistem ID" value={<span className="text-gray-400 font-mono">#{selectedCommunity.id}</span>} />
                                    </div>

                                    {selectedCommunity.description && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Açıklama</h4>
                                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{selectedCommunity.description}</div>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Görseller</h4>
                                            {isSavingImages && <Loader2 size={12} className="animate-spin text-[#E30613]" />}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <ImageUploader
                                                label="Logo"
                                                value={selectedCommunity.logoUrl ?? ''}
                                                onChange={(url) => handleSaveImages(url, selectedCommunity.coverImageUrl ?? '')}
                                                aspectClass="aspect-square"
                                            />
                                            <ImageUploader
                                                label="Kapak"
                                                value={selectedCommunity.coverImageUrl ?? ''}
                                                onChange={(url) => handleSaveImages(selectedCommunity.logoUrl ?? '', url)}
                                                aspectClass="aspect-video"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {detailTab === 'members' && (
                                membersLoading ? (
                                    <div className="py-12 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#E30613]" /></div>
                                ) : membersError ? (
                                    <div className="bg-red-50 border-l-4 border-[#E30613] p-3 rounded-lg text-sm text-red-800">{membersError}</div>
                                ) : members.length === 0 ? (
                                    <div className="text-center text-sm text-gray-400 py-12">Henüz aktif üye yok.</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {members.map(m => (
                                            <li key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                                                <Avatar name={m.fullName} url={m.profileImageUrl} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 truncate">{m.fullName}</div>
                                                    <div className="text-xs text-gray-400">Katılım: {new Date(m.joinedAt).toLocaleDateString('tr-TR')}</div>
                                                </div>
                                                <select
                                                    value={ROLE_NAMES.includes(m.role) ? m.role : ROLE_NAMES[ROLE_NAMES.length - 1]}
                                                    onChange={(e) => handleChangeRole(selectedCommunity.id, m.userId, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-[#E02020]/50 bg-white font-medium text-gray-700"
                                                >
                                                    {ROLE_NAMES.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                                <button
                                                    onClick={() => handleRemoveMember(selectedCommunity.id, m.userId, m.fullName)}
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                                                    title="Çıkar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )
                            )}

                            {detailTab === 'pending' && (
                                pendingLoading ? (
                                    <div className="py-12 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#E30613]" /></div>
                                ) : pendingError ? (
                                    <div className="bg-red-50 border-l-4 border-[#E30613] p-3 rounded-lg text-sm text-red-800">{pendingError}</div>
                                ) : pending.length === 0 ? (
                                    <div className="text-center text-sm text-gray-400 py-12">Bekleyen üye yok.</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {pending.map(p => (
                                            <li key={p.userId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                                                <Avatar name={p.fullName} url={p.profileImageUrl} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 truncate">{p.fullName}</div>
                                                    <div className="text-xs text-gray-400">İstek: {new Date(p.requestedAt).toLocaleDateString('tr-TR')}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleApprovePending(selectedCommunity.id, p.userId)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                                                >
                                                    <CheckCircle size={12} /> Onayla
                                                </button>
                                                <button
                                                    onClick={() => handleRejectPending(selectedCommunity.id, p.userId)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                                                >
                                                    <XCircle size={12} /> Reddet
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )
                            )}
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
            <span className="text-gray-500 text-sm font-medium">{label}</span>
            {value}
        </div>
    );
}

function ImageUploader({
    label,
    value,
    onChange,
    aspectClass = 'aspect-square',
    folder = 'communities',
}: {
    label: string;
    value: string;
    onChange: (url: string) => void;
    aspectClass?: string;
    folder?: string;
}) {
    const [uploading, setUploading] = useState(false);
    const handleUpload = async (file: File) => {
        const form = new FormData();
        form.append('file', file);
        form.append('folder', folder);
        setUploading(true);
        try {
            const res = await api.post('/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            const url = res.data?.url ?? res.data?.Url;
            if (url) onChange(url);
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Yükleme başarısız.');
        } finally {
            setUploading(false);
        }
    };
    return (
        <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">{label}</label>
            <div className={`relative ${aspectClass} bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden group`}>
                {value ? (
                    <>
                        <img src={value} alt="" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 backdrop-blur text-red-500 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Kaldır"
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={28} />
                        <span className="text-[10px] uppercase tracking-wider mt-1">Görsel yok</span>
                    </div>
                )}
            </div>
            <label className="mt-2 inline-flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 border border-gray-200">
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {uploading ? 'Yükleniyor…' : value ? 'Değiştir' : 'Yükle'}
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
                />
            </label>
        </div>
    );
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
    const initials = name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div className="h-9 w-9 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
            {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
    );
}

// RoleOption tipini kullan
export type _RoleOption = RoleOption;
