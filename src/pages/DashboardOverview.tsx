import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Users, UserCog, AlertCircle, Loader2, Download, Plus, TrendingUp, Bell, CheckCircle2, PieChart as PieIcon, BarChart3, Trophy, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

interface CategoryEntry { category: string; count: number; }
interface MonthlyEntry { year: number; month: number; label: string; members: number; events: number; }
interface TopCommunity { id: number; name: string; memberCount: number; categoryName: string; }
interface TopEvent { id: number; title: string; communityName: string; participantCount: number; startDate: string; }

interface Statistics {
    categoryDistribution: CategoryEntry[];
    monthlyTrends: MonthlyEntry[];
    topCommunities: TopCommunity[];
    topEvents: TopEvent[];
}

const PIE_COLORS = ['#E30613', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'];

export default function DashboardOverview() {
    const [stats, setStats] = useState<DashboardOverviewStats | null>(null);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [overviewRes, statsRes] = await Promise.allSettled([
                    api.get('/dashboard/overview'),
                    api.get('/dashboard/statistics'),
                ]);
                if (overviewRes.status === 'fulfilled') setStats(overviewRes.value.data);
                else setError('İstatistikler yüklenirken bir hata oluştu.');
                if (statsRes.status === 'fulfilled') setStatistics(statsRes.value.data);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
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
            {/* Header */}
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
                <StatCard icon={<Users className="text-[#E30613]" size={20} />} bgIcon={<Users size={120} />} label="TOPLAM TOPLULUK" value={stats.totalCommunities} sub="Sistemdeki Aktif Topluluklar" />
                <StatCard icon={<UserCog className="text-[#E30613]" size={20} />} bgIcon={<UserCog size={120} />} label="AKTİF ÖĞRENCİ" value={stats.activeStudents} sub="Sistemdeki tüm onaylı kullanıcılar" />
                <StatCard icon={<AlertCircle className="text-[#E30613]" size={20} />} bgIcon={<AlertCircle size={120} />} label="BEKLEYEN ONAYLAR" value={stats.pendingApprovals} sub="Onay bekleyen topluluklar" />
            </div>

            {/* Charts Row */}
            {statistics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Pie Chart */}
                    <div className="bg-white rounded-[20px] p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <PieIcon size={16} className="text-gray-400" />
                            <h3 className="font-bold text-gray-900">Kategori Dağılımı</h3>
                        </div>
                        {statistics.categoryDistribution.length === 0 ? (
                            <div className="h-56 flex items-center justify-center text-sm text-gray-400">Veri yok.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={statistics.categoryDistribution}
                                        dataKey="count"
                                        nameKey="category"
                                        outerRadius={80}
                                        label={(e: any) => e.category}
                                        labelLine={false}
                                    >
                                        {statistics.categoryDistribution.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Line Chart */}
                    <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 size={16} className="text-gray-400" />
                            <h3 className="font-bold text-gray-900">Son 6 Ay — Üye & Etkinlik Trendi</h3>
                        </div>
                        {statistics.monthlyTrends.length === 0 ? (
                            <div className="h-56 flex items-center justify-center text-sm text-gray-400">Veri yok.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={statistics.monthlyTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Line type="monotone" dataKey="members" name="Yeni Üye" stroke="#E30613" strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="events" name="Etkinlik" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            )}

            {/* Leaderboards */}
            {statistics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-[20px] p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy size={16} className="text-yellow-500" />
                            <h3 className="font-bold text-gray-900">En Aktif Topluluklar</h3>
                        </div>
                        {statistics.topCommunities.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400">Veri yok.</div>
                        ) : (
                            <ul className="space-y-2">
                                {statistics.topCommunities.map((c, i) => (
                                    <li key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                        <span className="w-7 h-7 rounded-full bg-red-50 text-[#E30613] flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                                            <div className="text-xs text-gray-400">{c.categoryName}</div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">{c.memberCount} <span className="text-xs font-normal text-gray-400">üye</span></span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-white rounded-[20px] p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar size={16} className="text-blue-500" />
                            <h3 className="font-bold text-gray-900">En Çok Katılım Alan Etkinlikler</h3>
                        </div>
                        {statistics.topEvents.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400">Veri yok.</div>
                        ) : (
                            <ul className="space-y-2">
                                {statistics.topEvents.map((e, i) => (
                                    <li key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                        <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate">{e.title}</div>
                                            <div className="text-xs text-gray-400">{e.communityName} · {new Date(e.startDate).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">{e.participantCount}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Activities + Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900">Son Aktiviteler</h3>
                        <button onClick={() => navigate('/dashboard/notifications')} className="text-[#E30613] text-sm font-bold hover:underline">Tümünü Gör</button>
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

                <div className="space-y-6">
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

function StatCard({ icon, bgIcon, label, value, sub }: { icon: React.ReactNode; bgIcon: React.ReactNode; label: string; value: number; sub: string; }) {
    return (
        <div className="bg-white rounded-[20px] p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-44">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4">{icon}</div>
            <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</h3>
                <p className="text-4xl font-black text-gray-900 leading-none">{value}</p>
            </div>
            <div className="text-xs text-gray-400 font-medium mt-3">{sub}</div>
            <div className="absolute -bottom-6 -right-6 text-gray-50 opacity-50">{bgIcon}</div>
        </div>
    );
}
