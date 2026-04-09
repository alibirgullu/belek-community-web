import React, { useState, useEffect } from 'react';
import { UserX, UserCheck, Shield, Search } from 'lucide-react';
import api from '../api';

interface User {
    id: number;
    firstName: string;
    lastName: string;
    status: string;
}

export default function UsersAdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleStatus = async (userId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        try {
            await api.put(`/users/${userId}/status`, { status: newStatus });
            fetchUsers(); // Refresh list
        } catch (err: any) {
            alert(err.response?.data?.message || 'Durum güncellenirken hata oluştu.');
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
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] sm:text-sm transition-all shadow-sm"
                        placeholder="İsim veya soyisim ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="bg-red-900/20 border-l-4 border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 relative">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="h-40 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E02020]" />
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
                                                <button
                                                    onClick={() => handleToggleStatus(user.id, user.status)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                        user.status === 'Active'
                                                            ? 'bg-red-50 text-red-600 hover:bg-[#E02020] hover:text-white border border-transparent hover:shadow-md'
                                                            : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-transparent hover:shadow-md'
                                                        }`}
                                                >
                                                    {user.status === 'Active' ? (
                                                        <><UserX size={16} /> Askıya Al</>
                                                    ) : (
                                                        <><UserCheck size={16} /> Aktifleştir</>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
