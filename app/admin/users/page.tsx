import React from 'react';
import type { Prisma } from '@prisma/client';
import { getUsersList } from '@/app/actions/admin';
import { 
    Calendar, 
    Shield, 
    MoreVertical,
    Search,
    ChevronLeft,
    ChevronRight,
    Box
} from 'lucide-react';

type UserWithCount = Prisma.UserGetPayload<{
    include: { _count: { select: { models: true } } };
}>;

export default async function UsersManagement() {
    const users: UserWithCount[] = await getUsersList();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Direct Users</h1>
                    <p className="text-white/40 mt-1 text-sm">Manage access, roles, and view individual contributions.</p>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="rounded-lg bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-64"
                    />
                </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-md overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="text-white/40 border-b border-white/5 bg-white/2">
                        <tr>
                            <th className="px-6 py-4 font-semibold">User</th>
                            <th className="px-6 py-4 font-semibold">Role</th>
                            <th className="px-6 py-4 font-semibold">Joined</th>
                            <th className="px-6 py-4 font-semibold">Models</th>
                            <th className="px-6 py-4 font-semibold"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((user) => (
                            <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xs font-bold font-mono">
                                            {user.name?.charAt(0) || user.email?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white group-hover:text-blue-400 transition-colors">{user.name || 'Anonymous'}</p>
                                            <p className="text-xs text-white/40">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                                        user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                                    }`}>
                                        <Shield className="h-2.5 w-2.5" />
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-white/40">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Box className="h-3.5 w-3.5" />
                                        {user._count?.models ?? 0}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 text-white/20 hover:text-white transition-colors">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/2">
                    <p className="text-xs text-white/40 italic">Showing {users.length} registered accounts</p>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-20" disabled><ChevronLeft className="h-4 w-4" /></button>
                        <button className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-20" disabled><ChevronRight className="h-4 w-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
