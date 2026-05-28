import api from '../api';

export interface AdminUser {
    id: number;
    fullName: string;
    profileImageUrl?: string | null;
}

export interface JwtClaims {
    sub?: string;
    email?: string;
    role?: string;
    exp?: number;
}

export interface UserProfile {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string | null;
    phone?: string | null;
    biography?: string | null;
    department?: string | null;
}

const NAMEID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export function getCurrentUser(): AdminUser | null {
    const raw = localStorage.getItem('sksAdminUser');
    if (!raw) return null;
    try {
        return JSON.parse(raw) as AdminUser;
    } catch {
        return null;
    }
}

export function getJwtClaims(): JwtClaims | null {
    const token = localStorage.getItem('sksAdminToken');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const raw = JSON.parse(payloadJson);
        return {
            sub: raw[NAMEID_CLAIM] ?? raw.sub ?? raw.nameid,
            email: raw[EMAIL_CLAIM] ?? raw.email,
            role: raw[ROLE_CLAIM] ?? raw.role,
            exp: raw.exp,
        };
    } catch {
        return null;
    }
}

export function getInitials(fullName: string | undefined | null): string {
    if (!fullName) return 'AD';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getRoleLabel(role: string | undefined | null): string {
    if (!role) return 'Yönetici';
    switch (role) {
        case 'SuperAdmin': return 'Süper Admin';
        case 'Admin': return 'Admin';
        case 'Student': return 'Öğrenci';
        default: return role;
    }
}

export async function fetchProfile(): Promise<UserProfile | null> {
    try {
        const res = await api.get('/users/me');
        return {
            id: res.data.id ?? res.data.Id,
            firstName: res.data.firstName ?? res.data.FirstName ?? '',
            lastName: res.data.lastName ?? res.data.LastName ?? '',
            email: res.data.email ?? res.data.Email ?? '',
            profileImageUrl: res.data.profileImageUrl ?? res.data.ProfileImageUrl ?? null,
            phone: res.data.phone ?? res.data.Phone ?? null,
            biography: res.data.biography ?? res.data.Biography ?? null,
            department: res.data.department ?? res.data.Department ?? null,
        };
    } catch {
        return null;
    }
}

export async function logout(): Promise<void> {
    const refreshToken = localStorage.getItem('sksAdminRefreshToken');
    if (refreshToken) {
        try {
            await api.post('/users/logout', { refreshToken });
        } catch {
            // local logout devam etsin
        }
    }
    localStorage.removeItem('sksAdminToken');
    localStorage.removeItem('sksAdminRefreshToken');
    localStorage.removeItem('sksAdminUser');
}

export function formatRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'şimdi';
    if (min < 60) return `${min} dk önce`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} sa önce`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day} gün önce`;
    const mo = Math.floor(day / 30);
    return `${mo} ay önce`;
}
