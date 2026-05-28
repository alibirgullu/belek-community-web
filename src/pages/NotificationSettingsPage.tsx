import { useEffect, useState } from 'react';
import api from '../api';
import { Loader2, CheckCircle, Clock } from 'lucide-react';

export default function NotificationSettingsPage() {
    const [expiryDays, setExpiryDays] = useState(2);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        api.get('/notifications/settings')
            .then(r => setExpiryDays(r.data?.expiryDays ?? r.data?.ExpiryDays ?? 2))
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMsg(null);
        try {
            const res = await api.put('/notifications/settings', { expiryDays });
            setMsg(res.data?.message ?? 'Ayarlar kaydedildi.');
            setTimeout(() => setMsg(null), 4000);
        } catch (err: any) {
            setMsg(err.response?.data?.message ?? 'Kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bildirim Tercihleri</h1>
                <p className="text-sm text-gray-500 mt-1">Genel duyuruların görünürlük süresini ayarla.</p>
            </div>

            <div className="bg-white rounded-[20px] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-[#E30613]" />
                    <h3 className="font-bold text-gray-900">Duyuru Görünürlük Süresi</h3>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                    Gönderilen global duyurular uygulamada kaç gün görünsün? Süresi dolanlar otomatik gizlenir.
                </p>

                {msg && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                        <CheckCircle size={16} /> {msg}
                    </div>
                )}

                {isLoading ? (
                    <Loader2 className="animate-spin h-6 w-6 text-[#E30613]" />
                ) : (
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            min={1} max={30}
                            value={expiryDays}
                            onChange={(e) => setExpiryDays(Math.min(30, Math.max(1, Number(e.target.value))))}
                            className="w-24 rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E02020]/50 focus:border-[#E02020] text-gray-900 font-bold text-center text-lg"
                        />
                        <span className="text-gray-500 text-sm">gün <span className="text-gray-400">(1–30 arası)</span></span>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="ml-auto flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                            Kaydet
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
