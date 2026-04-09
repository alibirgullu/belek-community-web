import { useEffect, useState } from 'react';
import api from '../api';
import { Loader2, Plus, CheckCircle, XCircle, Search } from 'lucide-react';

interface Community {
    id: number;
    name: string;
    status: string;
    createdAt: string;
    presidentName?: string;
    description?: string;
    categoryId?: number;
    categoryName?: string;
}

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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);

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
            
            // Konfeti patlat (Sadece onaylandığında)
            if (status === 'Active' && typeof (window as any).confetti === 'function') {
                (window as any).confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#E02020', '#FFFFFF', '#FFD700', '#4CAF50'] // Belek colors + celebration
                });
            }

            fetchCommunities();
        } catch (error: any) {
            console.error('Durum güncellenirken hata oluştu:', error.response?.data || error);
            alert(`Hata: ${error.response?.data?.Message || error.response?.data?.title || 'Bilinmeyen bir hata oluştu.'} (Kod: ${error.response?.status})`);
        }
    };

    const handleUpdateCategory = async (communityId: number, categoryId: number) => {
        try {
            await api.put(`/communities/${communityId}/category`, { categoryId });
            fetchCommunities();
        } catch (error: any) {
            console.error('Kategori güncellenirken hata oluştu:', error);
            alert('Kategori güncellenirken bir hata oluştu.');
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
                presidentEmail: newPresidentEmail || undefined
            });
            // Refresh list
            fetchCommunities();

            setIsAddModalOpen(false);
            setNewName('');
            setNewDesc('');
            setNewPresidentEmail('');
        } catch (error) {
            console.error("Error creating community", error);
            alert("Topluluk oluşturulurken bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
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
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Topluluk Adı</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Oluşturulma Tarihi</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin h-8 w-8 text-[#E02020] mx-auto" />
                                        <p className="mt-3 text-sm text-gray-500">Yükleniyor...</p>
                                    </td>
                                </tr>
                            ) : filteredCommunities.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredCommunities.map((community) => (
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
                                                    <button
                                                        onClick={() => handleUpdateStatus(community.id, 'Active')}
                                                        className="text-green-600 hover:text-green-700 transition-colors"
                                                        title="Onayla">
                                                        <CheckCircle className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(community.id, 'Rejected')}
                                                        className="text-[#E02020] hover:text-red-700 transition-colors"
                                                        title="Reddet">
                                                        <XCircle className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedCommunity(community);
                                                    setIsDetailsModalOpen(true);
                                                }}
                                                className="text-gray-700 hover:text-[#E02020] bg-gray-100 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent transition-all text-xs font-semibold"
                                            >
                                                Detaylar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Community Modal Overlay */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Yeni Topluluk Ekle</h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCommunity} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topluluk Adı</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Örn: Dağcılık Kulübü"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] bg-white text-gray-900 placeholder-gray-400 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kısa Açıklama (İsteğe Bağlı)</label>
                                <textarea
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Topluluğun amacı ve faaliyetleri..."
                                    rows={3}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] bg-white text-gray-900 placeholder-gray-400 transition-all font-medium resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Başkan E-Posta Adresi (İsteğe Bağlı)</label>
                                <input
                                    type="email"
                                    value={newPresidentEmail}
                                    onChange={(e) => setNewPresidentEmail(e.target.value)}
                                    placeholder="Örn: ogrenci@belek.edu.tr"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] bg-white text-gray-900 placeholder-gray-400 transition-all font-medium"
                                />
                                <p className="text-xs text-gray-500 mt-2 font-medium">Eğer doldurulursa bu kullanıcı topluluk başkanı olarak atanacaktır.</p>
                            </div>

                            <div className="pt-2 flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newName.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#E02020] to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:grayscale shadow-md"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Community Details Modal Overlay */}
            {isDetailsModalOpen && selectedCommunity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Topluluk Detayları</h3>
                            <button
                                onClick={() => {
                                    setIsDetailsModalOpen(false);
                                    setSelectedCommunity(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Genel Bilgiler</h4>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm font-medium">Topluluk Adı:</span>
                                        <span className="font-bold text-gray-900">{selectedCommunity.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm font-medium">Durum:</span>
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                            selectedCommunity.status === 'Active' 
                                            ? 'bg-green-100 text-green-700 border-green-200' 
                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {selectedCommunity.status === 'Active' ? 'Aktif' : 'Onay Bekliyor'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm font-medium">Topluluk Başkanı:</span>
                                        <span className="font-bold text-gray-900 border-b border-gray-200 pb-0.5">{selectedCommunity.presidentName || 'Henüz Atanmadı'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm font-medium">Kategori:</span>
                                        <select
                                            className="text-sm border border-gray-300 rounded-md px-2 py-1 outline-none text-gray-900 font-medium bg-white cursor-pointer"
                                            value={selectedCommunity.categoryId || ""}
                                            onChange={(e) => {
                                                const catId = Number(e.target.value);
                                                if (catId) {
                                                    setSelectedCommunity({...selectedCommunity, categoryId: catId});
                                                    handleUpdateCategory(selectedCommunity.id, catId);
                                                }
                                            }}
                                        >
                                            <option value="" disabled>Kategori Seç</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm font-medium">Oluşturulma:</span>
                                        <span className="text-gray-900 text-sm font-medium">{new Date(selectedCommunity.createdAt).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm font-medium">Sistem ID:</span>
                                        <span className="text-gray-400 font-mono text-sm">#{selectedCommunity.id}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedCommunity.description && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Açıklama & Danışman Bilgisi</h4>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedCommunity.description}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={() => {
                                        setIsDetailsModalOpen(false);
                                        setSelectedCommunity(null);
                                    }}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors w-full sm:w-auto"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
