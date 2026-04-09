import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Users, UserCog, AlertCircle, Loader2, Download, Plus, TrendingUp, Bell, CheckCircle2 } from 'lucide-react';

interface DashboardActivity {
    title: string;
    description: string;
    type: string;
    timeAgo: string;
    createdAt: string;
}

interface DashboardOverviewStats {
    totalCommunities: number;
    activeStudents: number;
    pendingApprovals: number;
    monthlyGrowth: string;
    recentActivities: DashboardActivity[];
}

export default function DashboardOverview() {
    const [stats, setStats] = useState<DashboardOverviewStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/dashboard/overview');
                setStats(response.data);
            } catch (err: any) {
                console.error('Failed to fetch dashboard overview', err);
                setError('İstatistikler yüklenirken bir hata oluştu.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="animate-spin h-10 w-10 text-[#E30613]" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="bg-red-50 border-l-4 border-[#E30613] p-4 rounded-xl">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-[#E30613]" />
                    <p className="ml-3 text-sm text-red-900">{error || 'Veri bulunamadı.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                <div>
                    <h2 className="text-[28px] font-extrabold text-gray-900 tracking-tight">Sisteme Genel Bakış</h2>
                    <p className="text-gray-500 font-medium text-sm mt-1">Hoş geldiniz, bugün sistem genelindeki istatistikler burada.</p>
                </div>
                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-[#E30613] text-[#E30613] font-bold text-sm rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                    >
                        <Download size={16} />
                        <span>Rapor Al</span>
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard/communities')}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-[#E30613] text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-colors shadow-md shadow-red-200"
                    >
                        <Plus size={16} />
                        <span>Yeni Topluluk</span>
                    </button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card 1 */}
                <div className="bg-white rounded-[20px] p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-44">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4">
                        <Users className="text-[#E30613]" size={20} />
                    </div>
                    <div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">TOPLAM TOPLULUK</h3>
                        <p className="text-4xl font-black text-gray-900 leading-none">{stats.totalCommunities}</p>
                    </div>
                    <div className="text-xs text-gray-400 font-medium mt-3">Sistemdeki Aktif Topluluklar</div>
                    <Users size={120} className="absolute -bottom-6 -right-6 text-gray-50 opacity-50" />
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-[20px] p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-44">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4">
                        <UserCog className="text-[#E30613]" size={20} />
                    </div>
                    <div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">AKTİF ÖĞRENCİ</h3>
                        <p className="text-4xl font-black text-gray-900 leading-none">{stats.activeStudents}</p>
                    </div>
                    <div className="text-xs text-gray-400 font-medium mt-3">Sistemdeki tüm onaylı kullanıcılar</div>
                    <UserCog size={120} className="absolute -bottom-6 -right-6 text-gray-50 opacity-50" />
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-[20px] p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-44">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4">
                        <AlertCircle className="text-[#E30613]" size={20} />
                    </div>
                    <div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">BEKLEYEN ONAYLAR</h3>
                        <p className="text-4xl font-black text-gray-900 leading-none">{stats.pendingApprovals}</p>
                    </div>
                    <div className="text-xs text-gray-400 font-medium mt-3">Onay bekleyen topluluklar</div>
                    <AlertCircle size={120} className="absolute -bottom-6 -right-6 text-gray-50 opacity-50" />
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Activities (Left 2 Col) */}
                <div className="lg:col-span-2 bg-white rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900">Son Aktiviteler</h3>
                        <button className="text-[#E30613] text-sm font-bold hover:underline">Tümünü Gör</button>
                    </div>

                    <div className="space-y-8">
                        {stats.recentActivities.length > 0 ? stats.recentActivities.map((act, idx) => (
                            <div key={idx} className="flex gap-4 relative">
                                <div className="mt-1">
                                    {act.type === 'CommunityApplication' ? (
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                           <Plus size={16} className="text-blue-500" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                           <CheckCircle2 size={16} className="text-green-500" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{act.title}</h4>
                                    <p className="text-sm text-gray-500 font-medium mt-0.5">{act.description}</p>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 block">{act.timeAgo}</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 italic">Henüz bir aktivite bulunmuyor.</p>
                        )}
                    </div>
                </div>

                {/* Right Column (Notifications + Growth) */}
                <div className="space-y-6">
                    {/* Announcement Banner */}
                    <div className="bg-[#B90B0B] rounded-[20px] p-8 shadow-md relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-white text-xl font-bold mb-3">Duyuru Yayınla</h3>
                            <p className="text-white/80 text-sm font-medium mb-6 leading-relaxed">
                                Tüm topluluk başkanlarına ve öğrencilere anlık bildirim gönderin.
                            </p>
                            <button 
                                onClick={() => navigate('/dashboard/announcements')}
                                className="w-full bg-white text-[#B90B0B] font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Yeni Duyuru Oluştur
                            </button>
                        </div>
                        <Bell size={160} className="absolute -right-10 top-0 text-white opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    {/* Growth Card */}
                    <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-50 flex items-center relative overflow-hidden">
                       <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mr-5">
                           <TrendingUp className="text-[#E30613]" size={24} />
                       </div>
                       <div>
                           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">AYLIK BÜYÜME</h4>
                           <span className="text-2xl font-black text-gray-900">{stats.monthlyGrowth}</span>
                       </div>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
