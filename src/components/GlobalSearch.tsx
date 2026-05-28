import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Building2, Calendar, Loader2 } from 'lucide-react';
import api from '../api';

interface UserResult { id: number; firstName: string; lastName: string; status: string; }
interface CommunityResult { id: number; name: string; status: string; }
interface EventResult { id: number; title: string; startDate: string; }

interface Results {
    users: UserResult[];
    communities: CommunityResult[];
    events: EventResult[];
}

export default function GlobalSearch() {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState('');
    const [debounced, setDebounced] = useState('');
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<Results>({ users: [], communities: [], events: [] });

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setOpen(true);
            }
            if (e.key === 'Escape') {
                setOpen(false);
                inputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        if (debounced.length < 2) {
            setResults({ users: [], communities: [], events: [] });
            return;
        }
        const q = debounced.toLowerCase();
        let cancelled = false;
        setIsLoading(true);

        Promise.allSettled([
            api.get('/users'),
            api.get(`/communities?search=${encodeURIComponent(debounced)}`),
            api.get('/events'),
        ]).then(([uRes, cRes, eRes]) => {
            if (cancelled) return;
            const users: UserResult[] = uRes.status === 'fulfilled' && Array.isArray(uRes.value.data)
                ? uRes.value.data
                    .filter((u: UserResult) => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q))
                    .slice(0, 5)
                : [];
            const communities: CommunityResult[] = cRes.status === 'fulfilled' && Array.isArray(cRes.value.data)
                ? cRes.value.data.slice(0, 5)
                : [];
            const events: EventResult[] = eRes.status === 'fulfilled' && Array.isArray(eRes.value.data)
                ? eRes.value.data
                    .filter((ev: EventResult) => ev.title?.toLowerCase().includes(q))
                    .slice(0, 5)
                : [];
            setResults({ users, communities, events });
        }).finally(() => {
            if (!cancelled) setIsLoading(false);
        });

        return () => { cancelled = true; };
    }, [debounced]);

    const close = () => {
        setOpen(false);
        setQuery('');
    };

    const goToUser = (_id: number) => { close(); navigate('/dashboard/users'); };
    const goToCommunity = (_id: number) => { close(); navigate('/dashboard/communities'); };
    const goToEvent = (_id: number) => { close(); navigate('/dashboard/events'); };

    const empty = !isLoading && debounced.length >= 2
        && results.users.length === 0 && results.communities.length === 0 && results.events.length === 0;

    return (
        <div ref={containerRef} className="relative w-[420px]">
            <div className="flex items-center bg-white border border-gray-100 rounded-full px-5 py-2.5 shadow-sm">
                <Search size={18} className="text-gray-300" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder="Sistemde ara..."
                    className="bg-transparent border-none outline-none ml-3 text-sm text-gray-700 w-full placeholder-gray-400 font-medium"
                />
                <kbd className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Ctrl K</kbd>
            </div>

            {open && (query.length > 0 || isLoading) && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[480px] overflow-y-auto">
                    {debounced.length < 2 && (
                        <div className="py-8 text-center text-xs text-gray-400">En az 2 karakter yaz…</div>
                    )}
                    {isLoading && (
                        <div className="py-8 flex items-center justify-center text-gray-400">
                            <Loader2 className="animate-spin h-5 w-5" />
                        </div>
                    )}
                    {empty && (
                        <div className="py-8 text-center text-sm text-gray-400">"{debounced}" için sonuç yok.</div>
                    )}

                    {results.users.length > 0 && (
                        <div>
                            <div className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 flex items-center gap-2">
                                <Users size={12} /> Kullanıcılar
                            </div>
                            {results.users.map(u => (
                                <button
                                    key={`u-${u.id}`}
                                    onClick={() => goToUser(u.id)}
                                    className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 text-left text-sm"
                                >
                                    <span className="font-medium text-gray-800">{u.firstName} {u.lastName}</span>
                                    <span className="text-xs text-gray-400">{u.status}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {results.communities.length > 0 && (
                        <div>
                            <div className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 flex items-center gap-2">
                                <Building2 size={12} /> Topluluklar
                            </div>
                            {results.communities.map(c => (
                                <button
                                    key={`c-${c.id}`}
                                    onClick={() => goToCommunity(c.id)}
                                    className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 text-left text-sm"
                                >
                                    <span className="font-medium text-gray-800">{c.name}</span>
                                    <span className="text-xs text-gray-400">{c.status}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {results.events.length > 0 && (
                        <div>
                            <div className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 flex items-center gap-2">
                                <Calendar size={12} /> Etkinlikler
                            </div>
                            {results.events.map(ev => (
                                <button
                                    key={`e-${ev.id}`}
                                    onClick={() => goToEvent(ev.id)}
                                    className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 text-left text-sm"
                                >
                                    <span className="font-medium text-gray-800 truncate">{ev.title}</span>
                                    <span className="text-xs text-gray-400">{new Date(ev.startDate).toLocaleDateString('tr-TR')}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
