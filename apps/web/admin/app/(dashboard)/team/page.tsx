'use client';

import { useEffect, useState } from 'react';

type Admin = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export default function TeamPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'admin' });
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admins');
      const data = await res.json();
      if (res.ok) setAdmins(data.admins);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAdmins([data.admin, ...admins]);
      setShowInvite(false);
      setInviteForm({ email: '', name: '', role: 'admin' });
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Team Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your team members and their access levels.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-bold hover:scale-[1.02] transition-transform"
        >
          Invite Member
        </button>
      </div>

      {showInvite && (
        <div className="mb-6 p-6 bg-card border border-white/5 rounded-2xl shadow-sm relative overflow-hidden">
          <h2 className="text-lg font-bold mb-4">Invite New Admin</h2>
          {inviteError && <div className="mb-4 text-red-400 text-sm">{inviteError}</div>}
          <form onSubmit={handleInvite} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Name</label>
              <input 
                required 
                type="text" 
                value={inviteForm.name}
                onChange={e => setInviteForm({...inviteForm, name: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                placeholder="John Doe" 
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Email</label>
              <input 
                required 
                type="email" 
                value={inviteForm.email}
                onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                placeholder="john@chowvest.com" 
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Role</label>
              <select 
                value={inviteForm.role}
                onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
              >
                <option value="admin" className="bg-background">Admin</option>
                <option value="super_admin" className="bg-background">Super Admin</option>
              </select>
            </div>
            <button 
              disabled={inviteLoading}
              className="bg-accent text-black px-6 py-3 rounded-xl font-bold disabled:opacity-50 h-[48px]"
            >
              {inviteLoading ? 'Sending...' : 'Send Invite'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowInvite(false)}
              className="text-muted-foreground hover:text-white px-4 py-3 font-medium"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="p-4 pl-6">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 pr-6">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No team members found.</td></tr>
              ) : admins.map(admin => (
                <tr key={admin.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4 pl-6 font-bold">{admin.name}</td>
                  <td className="p-4 text-muted-foreground">{admin.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${admin.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {admin.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm pr-6">{new Date(admin.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
