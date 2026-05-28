import { useEffect, useState } from 'react';
import api from '../api';
import { Loader2, Upload, CheckCircle, AlertCircle, User } from 'lucide-react';
import { fetchProfile, getInitials, type UserProfile } from '../lib/auth';

export default function ProfileSettingsPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [phone, setPhone] = useState('');
    const [biography, setBiography] = useState('');
    const [department, setDepartment] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        (async () => {
            const p = await fetchProfile();
            if (p) {
                setProfile(p);
                setPhone(p.phone ?? '');
                setBiography(p.biography ?? '');
                setDepartment(p.department ?? '');
                setProfileImageUrl(p.profileImageUrl ?? '');
            }
            setIsLoading(false);
        })();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg(null);
        setErrorMsg(null);
        setIsSaving(true);
        try {
            await api.put('/users/me', { phone, biography, department, profileImageUrl: profileImageUrl || null });
            setSuccessMsg('Profil güncellendi.');
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? 'Kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpload = async (file: File) => {
        const form = new FormData();
        form.append('file', file);
        form.append('folder', 'profiles');
        setUploading(true);
        setErrorMsg(null);
        try {
            const res = await api.post('/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            const url = res.data?.url ?? res.data?.Url;
            if (url) setProfileImageUrl(url);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message ?? 'Yükleme başarısız.');
        } finally {
            setUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="py-16 flex items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-[#E30613]" />
            </div>
        );
    }

    const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profil Ayarları</h1>
                <p className="text-sm text-gray-500 mt-1">Hesap bilgilerini ve görünüm tercihlerini buradan düzenle.</p>
            </div>

            <div className="bg-white rounded-[20px] p-6 shadow-sm">
                <form onSubmit={handleSave} className="space-y-5">
                    {successMsg && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg flex items-start gap-2 text-sm text-green-800">
                            <CheckCircle size={16} className="mt-0.5" /> <span>{successMsg}</span>
                        </div>
                    )}
                    {errorMsg && (
                        <div className="bg-red-50 border-l-4 border-[#E30613] p-3 rounded-lg flex items-start gap-2 text-sm text-red-800">
                            <AlertCircle size={16} className="mt-0.5" /> <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-5">
                        <div className="h-20 w-20 rounded-2xl bg-[#E30613] flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span>{getInitials(fullName)}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200">
                                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                {uploading ? 'Yükleniyor...' : 'Resim Yükle'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                                />
                            </label>
                            <p className="text-xs text-gray-400 mt-1">PNG/JPG, en fazla 5MB önerilir.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ReadOnlyField label="Ad Soyad" value={fullName} />
                        <ReadOnlyField label="E-Posta" value={profile?.email ?? ''} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Telefon</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Departman</label>
                        <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Biyografi</label>
                        <textarea
                            value={biography}
                            onChange={(e) => setBiography(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] outline-none resize-none"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-[#E30613] hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md disabled:opacity-50"
                        >
                            {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-[20px] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <User size={16} className="text-gray-400" />
                    <h3 className="font-bold text-gray-900">Hesap Güvenliği</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">Şifre değişikliği için "Şifremi Unuttum" akışı kullanılır — kayıtlı e-postana sıfırlama linki gönderilir.</p>
                <button
                    onClick={async () => {
                        if (!profile?.email) return;
                        try {
                            await api.post('/users/forgot-password', { email: profile.email });
                            setSuccessMsg('Sıfırlama e-postası gönderildi.');
                            setTimeout(() => setSuccessMsg(null), 5000);
                        } catch (err: any) {
                            setErrorMsg(err.response?.data?.message ?? 'Gönderilemedi.');
                        }
                    }}
                    className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-5 py-2 rounded-xl text-sm font-semibold"
                >
                    Şifre Sıfırlama Maili Gönder
                </button>
            </div>
        </div>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                type="text"
                value={value}
                disabled
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
            />
        </div>
    );
}
