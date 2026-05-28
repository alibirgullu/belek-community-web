import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, KeyRound, Smartphone, LogOut } from 'lucide-react';
import { fetchProfile, getCurrentUser, getInitials, getJwtClaims, getRoleLabel, logout, type UserProfile } from '../lib/auth';

interface Props {
    onClose: () => void;
}

export default function ProfileDropdown({ onClose }: Props) {
    const navigate = useNavigate();
    const cached = getCurrentUser();
    const claims = getJwtClaims();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchProfile().then(p => { if (!cancelled) setProfile(p); });
        return () => { cancelled = true; };
    }, []);

    const fullName = profile
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : cached?.fullName ?? 'Kullanıcı';
    const email = profile?.email ?? claims?.email ?? '';
    const role = claims?.role;
    const profileImage = profile?.profileImageUrl ?? cached?.profileImageUrl;

    const go = (path: string) => {
        onClose();
        navigate(path);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-[#E30613] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {profileImage ? (
                        <img src={profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span>{getInitials(fullName)}</span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-900 truncate">{fullName}</div>
                    {email && <div className="text-xs text-gray-500 truncate">{email}</div>}
                    {role && (
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[#E30613] bg-red-50 px-2 py-0.5 rounded">
                            {getRoleLabel(role)}
                        </span>
                    )}
                </div>
            </div>
            <div className="py-1">
                <button
                    onClick={() => go('/dashboard/settings/profile')}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <User size={16} className="text-gray-400" />
                    Profilim
                </button>
                <button
                    onClick={() => go('/dashboard/settings/profile#password')}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <KeyRound size={16} className="text-gray-400" />
                    Hesap Ayarları
                </button>
                <button
                    onClick={() => go('/dashboard/settings/sessions')}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <Smartphone size={16} className="text-gray-400" />
                    Aktif Oturumlar
                </button>
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
