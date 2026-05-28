import { useNavigate } from 'react-router-dom';
import { UserCog, BellRing, FileText, LogOut } from 'lucide-react';
import { getJwtClaims, logout } from '../lib/auth';

interface Props {
    onClose: () => void;
}

export default function SettingsDropdown({ onClose }: Props) {
    const navigate = useNavigate();
    const claims = getJwtClaims();
    const isSuperAdmin = claims?.role === 'SuperAdmin';

    const go = (path: string) => {
        onClose();
        navigate(path);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
            <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ayarlar</h3>
            </div>
            <div className="py-1">
                <button
                    onClick={() => go('/dashboard/settings/profile')}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <UserCog size={16} className="text-gray-400" />
                    Profil Ayarları
                </button>
                <button
                    onClick={() => go('/dashboard/settings/notifications')}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <BellRing size={16} className="text-gray-400" />
                    Bildirim Tercihleri
                </button>
                {isSuperAdmin && (
                    <button
                        onClick={() => go('/dashboard/logs')}
                        className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <FileText size={16} className="text-gray-400" />
                        Sistem Logları
                    </button>
                )}
            </div>
            <div className="border-t border-gray-100 py-1">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-[#E30613] hover:bg-red-50"
                >
                    <LogOut size={16} />
                    Çıkış Yap
                </button>
            </div>
        </div>
    );
}
