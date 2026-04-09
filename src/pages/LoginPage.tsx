import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, AtSign, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/users/login', { email, password });

            if (response.data.token) {
                localStorage.setItem('sksAdminToken', response.data.token);
                localStorage.setItem('sksAdminUser', JSON.stringify({
                    id: response.data.userId,
                    fullName: response.data.fullName,
                    profileImageUrl: response.data.profileImage
                }));
                navigate('/dashboard');
            } else {
                setError(response.data.message || 'Giriş başarısız.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.reason || 'Sunucuya bağlanılamadı.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, #B90B0B 0%, #3A0000 100%)' }}>
            
            {/* Top Right Shield */}
            <div className="absolute top-6 right-8 text-white/50">
                <ShieldCheck size={28} />
            </div>

            {/* Empty space for vertical centering */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
                
                <div className="bg-white rounded-[32px] p-10 sm:p-14 shadow-2xl w-full max-w-[500px]">
                    <div className="text-center mb-10">
                        <h2 className="text-[28px] font-extrabold text-gray-900 tracking-tight">SKS Yönetim Paneli</h2>
                        <p className="text-[15px] font-medium text-gray-500 mt-2">Lütfen admin bilgilerinizi giriniz</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-center">
                                <p className="text-sm font-bold text-[#CC0000]">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 pl-1">
                                E-Posta Adresi
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <AtSign className="h-[18px] w-[18px] text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border-0 rounded-2xl text-[15px] font-medium text-gray-900 focus:ring-2 focus:ring-[#CC0000] transition-colors"
                                    placeholder="admin@sks.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 pl-1 mt-6">
                                Şifre
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-[18px] w-[18px] text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border-0 rounded-2xl text-[15px] font-medium text-gray-900 focus:ring-2 focus:ring-[#CC0000] transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center py-4 px-4 bg-[#CC0000] text-white rounded-2xl text-[15px] font-bold shadow-lg shadow-red-900/20 hover:bg-[#a30000] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    <>
                                        <span>Giriş Yap</span>
                                        <ArrowRight size={18} className="ml-2" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <a href="#" className="flex items-center text-sm font-bold text-[#CC0000] hover:text-[#a30000] transition-colors">
                                Şifremi Unuttum <ArrowRight size={14} className="ml-1" />
                            </a>
                        </div>
                    </form>
                </div>

                <div className="mt-12 flex items-center space-x-2 opacity-60">
                    <span className="w-2 h-2 rounded-full bg-white opacity-50"></span>
                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Tüm Erişimler Kayıt Altına Alınmaktadır</span>
                </div>
            </div>

            {/* Bottom Footer Area */}
            <div className="pb-8 px-10 flex flex-col md:flex-row justify-between items-center text-white/50 text-xs font-medium">
                <div>v2.2 © SKS Management Panel</div>
                <div className="flex space-x-6 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-colors">Support</a>
                </div>
            </div>

        </div>
    );
}
