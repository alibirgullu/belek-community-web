import { Construction } from 'lucide-react';

interface Props {
    title: string;
    phase?: string;
}

export default function PlaceholderPage({ title, phase }: Props) {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
            </div>
            <div className="bg-white rounded-[20px] p-16 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <Construction className="h-8 w-8 text-[#E30613]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Yapım aşamasında</h2>
                <p className="text-sm text-gray-500 max-w-md">
                    Bu sayfa henüz yapım aşamasındadır.
                    {phase && <> Yakında <span className="font-semibold text-gray-700">{phase}</span> ile birlikte gelecek.</>}
                </p>
            </div>
        </div>
    );
}
