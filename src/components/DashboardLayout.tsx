import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Users, MessageSquare, LayoutDashboard, UserCog, Bell, Settings, Calendar, Folder, Image } from 'lucide-react';
import api from '../api';
import { fetchProfile, getCurrentUser, getInitials, getJwtClaims, getRoleLabel, logout, type UserProfile } from '../lib/auth';
import NotificationDropdown from './NotificationDropdown';
import SettingsDropdown from './SettingsDropdown';
import ProfileDropdown from './ProfileDropdown';
import GlobalSearch from './GlobalSearch';

type OpenDropdown = 'bell' | 'settings' | 'profile' | null;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const cached = getCurrentUser();
    const claims = getJwtClaims();
    const fullName = profile
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : cached?.fullName ?? 'Kullanıcı';
    const profileImage = profile?.profileImageUrl ?? cached?.profileImageUrl;
    const role = claims?.role;

    useEffect(() => {
        let cancelled = false;
        fetchProfile().then(p => { if (!cancelled && p) setProfile(p); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let active = true;
        const fetchUnread = async () => {
            try {
                const res = await api.get('/notifications/unread-count');
                if (active) setUnreadCount(res.data?.unreadCount ?? res.data?.UnreadCount ?? 0);
            } catch {
                /* sessiz */
            }
        };
        fetchUnread();
        const id = setInterval(fetchUnread, 30000);
        return () => { active = false; clearInterval(id); };
    }, [location.pathname]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!headerRef.current?.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const getMenuStyles = (path: string) => {
        const isActive = location.pathname === path;
        return `w-full flex items-center space-x-3 px-6 py-3 font-medium transition-colors ${
            isActive
                ? 'bg-[#E30613]/5 text-[#E30613] border-l-4 border-[#E30613]'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-l-4 border-transparent'
        }`;
    };

    const toggle = (d: OpenDropdown) => setOpenDropdown(prev => (prev === d ? null : d));

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-100 flex flex-col z-20 shadow-sm relative">
                <div className="p-6 pb-8 pt-8 px-8">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">
                            <span className="text-[#E30613]">SKS</span> Admin
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Yönetim Paneli
                        </p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 mt-4 overflow-y-auto">
                    <button onClick={() => navigate('/dashboard')} className={getMenuStyles('/dashboard')}>
                        <LayoutDashboard size={20} className={location.pathname === '/dashboard' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Kontrol Paneli</span>
                    </button>
                    <button onClick={() => navigate('/dashboard/communities')} className={getMenuStyles('/dashboard/communities')}>
                        <Users size={20} className={location.pathname === '/dashboard/communities' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Topluluklar</span>
                    </button>
                    <button onClick={() => navigate('/dashboard/categories')} className={getMenuStyles('/dashboard/categories')}>
                        <Folder size={20} className={location.pathname === '/dashboard/categories' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Kategoriler</span>
                    </button>
                    <button onClick={() => navigate('/dashboard/events')} className={getMenuStyles('/dashboard/events')}>
                        <Calendar size={20} className={location.pathname === '/dashboard/events' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Etkinlikler</span>
                    </button>
                    <button onClick={() => navigate('/dashboard/announcements')} className={getMenuStyles('/dashboard/announcements')}>
                        <MessageSquare size={20} className={location.pathname === '/dashboard/announcements' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Duyurular</span>
                    </button>
                    <button onClick={() => navigate('/dashboard/users')} className={getMenuStyles('/dashboard/users')}>
                        <UserCog size={20} className={location.pathname === '/dashboard/users' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Kullanıcılar</span>
                    </button>
                    <button onClick={() => navigate('/dashboard/files')} className={getMenuStyles('/dashboard/files')}>
                        <Image size={20} className={location.pathname === '/dashboard/files' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Dosyalar</span>
                    </button>
                </nav>

                {/* Profile Box Bottom */}
                <div className="p-4 mb-4">
                    <div className="border border-gray-200 rounded-xl max-w-full bg-white flex items-center justify-between p-3 shadow-sm group">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 flex items-center justify-center bg-[#E30613] rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                                {profileImage ? (
                                    <img src={profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold text-sm">{getInitials(fullName)}</span>
                                )}
                            </div>
                            <div className="flex flex-col text-left min-w-0">
                                <span className="text-sm font-bold text-gray-900 truncate">{fullName}</span>
                                <span className="text-xs text-gray-400 font-medium">{getRoleLabel(role)}</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} title="Çıkış" className="text-gray-400 hover:text-gray-800 transition-colors flex-shrink-0">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA] relative">
                {/* Top Header */}
                <header ref={headerRef} className="h-[88px] bg-[#F8F9FA] flex items-center justify-between px-10 sticky top-0 z-10 pt-4">
                    <GlobalSearch />

                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <button
                                onClick={() => toggle('bell')}
                                className="text-gray-400 hover:text-gray-800 transition-colors relative"
                            >
                                <Bell size={22} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#E30613] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {openDropdown === 'bell' && (
                                <NotificationDropdown onClose={() => setOpenDropdown(null)} />
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => toggle('settings')}
                                className="text-gray-400 hover:text-gray-800 transition-colors"
                            >
                                <Settings size={22} />
                            </button>
                            {openDropdown === 'settings' && (
                                <SettingsDropdown onClose={() => setOpenDropdown(null)} />
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => toggle('profile')}
                                className="h-9 w-9 rounded-full bg-[#E30613] overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
                            >
                                {profileImage ? (
                                    <img src={profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-xs font-bold">{getInitials(fullName)}</span>
                                )}
                            </button>
                            {openDropdown === 'profile' && (
                                <ProfileDropdown onClose={() => setOpenDropdown(null)} />
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto px-10 pb-10 pt-6 relative z-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
