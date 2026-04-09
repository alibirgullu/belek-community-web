import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Users, MessageSquare, LayoutDashboard, UserCog, Search, Bell, Settings } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('sksAdminToken');
        localStorage.removeItem('sksAdminUser');
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

                <nav className="flex-1 space-y-2 mt-4">
                    <button onClick={() => navigate('/dashboard')} className={getMenuStyles('/dashboard')}>
                        <LayoutDashboard size={20} className={location.pathname === '/dashboard' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Kontrol Paneli</span>
                    </button>
                    <button onClick={() => navigate('/dashboard/communities')} className={getMenuStyles('/dashboard/communities')}>
                        <Users size={20} className={location.pathname === '/dashboard/communities' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Topluluklar</span>
                    </button>
                    <button onClick={() => navigate('/dashboard/announcements')} className={getMenuStyles('/dashboard/announcements')}>
                        <MessageSquare size={20} className={location.pathname === '/dashboard/announcements' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Duyurular</span>
                    </button>
                    <button onClick={() => navigate('/dashboard/users')} className={getMenuStyles('/dashboard/users')}>
                        <UserCog size={20} className={location.pathname === '/dashboard/users' ? 'text-[#E30613]' : 'text-gray-400'} />
                        <span>Kullanıcılar</span>
                    </button>
                </nav>

                {/* Profile Box Bottom */}
                <div className="p-4 mb-4">
                    <div className="border border-gray-200 rounded-xl max-w-full bg-white flex items-center justify-between p-3 shadow-sm group">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center bg-[#E30613] rounded-lg shadow-sm">
                                <span className="text-white font-bold text-sm">AD</span>
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-bold text-gray-900">Sistem Yöneticisi</span>
                                <span className="text-xs text-gray-400 font-medium">Süper Admin</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-gray-800 transition-colors">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA] relative">
                {/* Top Header */}
                <header className="h-[88px] bg-[#F8F9FA] flex items-center justify-between px-10 sticky top-0 z-10 pt-4">
                    {/* Search Bar */}
                    <div className="flex items-center bg-white border border-gray-100 rounded-full px-5 py-2.5 w-[420px] shadow-sm">
                        <Search size={18} className="text-gray-300" />
                        <input 
                            type="text" 
                            placeholder="Sistemde ara..." 
                            className="bg-transparent border-none outline-none ml-3 text-sm text-gray-700 w-full placeholder-gray-400 font-medium"
                        />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-6">
                        <button className="text-gray-400 hover:text-gray-800 transition-colors relative">
                            <Bell size={22} />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-[#E30613] rounded-full"></span>
                        </button>
                        <button className="text-gray-400 hover:text-gray-800 transition-colors">
                            <Settings size={22} />
                        </button>
                        <div className="h-9 w-9 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center">
                            <img src="https://ui-avatars.com/api/?name=Admin+User&background=E30613&color=fff&size=100" alt="Avatar" className="w-full h-full object-cover" />
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
