import { useEffect, useState } from 'react';
import api from '../api';
import { Loader2, Plus, Pencil, Trash2, X, Check, Folder } from 'lucide-react';

interface Category { id: number; name: string; }

export default function CategoriesAdminPage() {
    const [items, setItems] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/communities/categories');
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch {
            /* sessiz */
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        if (!newName.trim()) return;
        setAdding(true);
        try {
            const res = await api.post('/communities/categories', { name: newName.trim() });
            setItems(prev => [...prev, { id: res.data.id, name: res.data.name }]);
            setNewName('');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? err.response?.data?.Message ?? 'Eklenemedi.');
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (c: Category) => {
        setEditingId(c.id);
        setEditName(c.name);
        setErrorMsg(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEdit = async (id: number) => {
        if (!editName.trim()) return;
        setErrorMsg(null);
        try {
            const res = await api.put(`/communities/categories/${id}`, { name: editName.trim() });
            setItems(prev => prev.map(c => c.id === id ? { id: res.data.id, name: res.data.name } : c));
            cancelEdit();
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? err.response?.data?.Message ?? 'Güncellenemedi.');
        }
    };

    const handleDelete = async (c: Category) => {
        if (!confirm(`"${c.name}" kategorisini silmek istediğine emin misin?`)) return;
        setErrorMsg(null);
        try {
            await api.delete(`/communities/categories/${c.id}`);
            setItems(prev => prev.filter(x => x.id !== c.id));
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? err.response?.data?.Message ?? 'Silinemedi.');
        }
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kategoriler</h1>
                <p className="text-sm text-gray-500 mt-1">Topluluk kategorilerini buradan yönet. Topluluklar bu kategorilerle filtrelenir.</p>
            </div>

            <div className="bg-white rounded-[20px] p-6 shadow-sm">
                <form onSubmit={handleAdd} className="flex items-center gap-2 mb-5">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Yeni kategori adı..."
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                    />
                    <button
                        type="submit"
                        disabled={adding || !newName.trim()}
                        className="inline-flex items-center gap-2 bg-[#E30613] hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md disabled:opacity-50 transition-colors"
                    >
                        {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Ekle
                    </button>
                </form>

                {errorMsg && (
                    <div className="mb-4 bg-red-50 border-l-4 border-[#E30613] p-3 rounded-lg text-sm text-red-800">
                        {errorMsg}
                    </div>
                )}

                {isLoading ? (
                    <div className="py-12 flex items-center justify-center">
                        <Loader2 className="animate-spin h-8 w-8 text-[#E30613]" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">Henüz kategori yok.</div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {items.map(c => (
                            <li key={c.id} className="flex items-center justify-between py-3 group">
                                {editingId === c.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            autoFocus
                                            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') cancelEdit(); }}
                                            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                                        />
                                        <button onClick={() => saveEdit(c.id)} className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"><Check size={14} /></button>
                                        <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                                <Folder size={14} className="text-[#E30613]" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                                            <span className="text-xs text-gray-400 font-mono">#{c.id}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(c)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                                                title="Düzenle"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c)}
                                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                                                title="Sil"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
