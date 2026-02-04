
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Role, User, Ticket, TicketStatus, Priority, 
  RequesterType, GRADES, SECTIONS, AppSettings, FieldType, CustomField 
} from './types';
import { db } from './services/mockDb';
import { 
  DashboardIcon, TicketIcon, UsersIcon, LogoutIcon, 
  PlusIcon, SearchIcon, CheckIcon
} from './components/Icons';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { suggestSolution } from './services/geminiService';

const GMIS_LOGO_URL = "https://lh3.googleusercontent.com/d/1Gi0EJzM7Ng9R3QXwZaUUpBxdGE1P-LfI";

// --- Custom Components ---

const Logo = ({ className = "h-12 w-auto" }) => (
  <img src={GMIS_LOGO_URL} alt="GMIS Logo" className={className} />
);

const Badge = ({ children, color = 'blue' }: { children?: React.ReactNode, color?: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    red: 'bg-rose-50 text-rose-600 border border-rose-100',
    orange: 'bg-amber-50 text-amber-600 border border-amber-100',
    slate: 'bg-slate-50 text-slate-600 border border-slate-200',
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${colors[color]}`}>{children}</span>;
};

const GlobalHeader = ({ showLogin = false }) => {
  const settings = db.getSettings();
  return (
    <header className="bg-white border-b border-slate-100 py-4 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/95">
      <div className="flex items-center space-x-4">
        <Logo className="h-10 sm:h-12 w-auto" />
        <div className="hidden sm:flex flex-col">
          <h1 className="text-sm font-black text-slate-900 tracking-tighter uppercase leading-none">Gandhi Memorial Intercontinental School</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1">IT Support Portal</p>
        </div>
      </div>
      {showLogin && (
        <Link to="/staff-login" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-4 py-2 rounded-xl">
          Admin / Technician
        </Link>
      )}
    </header>
  );
};

const NotificationToast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-10">
      <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 border border-slate-800">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <p className="text-xs font-bold">{message}</p>
        <button onClick={onClose} className="opacity-50 hover:opacity-100">✕</button>
      </div>
    </div>
  );
};

// --- Dynamic Form System ---

const TicketForm = ({ onComplete }: { onComplete?: () => void }) => {
  const settings = db.getSettings();
  const [formData, setFormData] = useState<any>({
    name: '', email: '', title: '', category: settings.categories[0],
    description: '', priority: Priority.MEDIUM, requesterType: RequesterType.TEACHER,
    grade: GRADES[0], section: SECTIONS[0], customData: {}
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `T-${Math.floor(1000 + Math.random() * 8999)}`;
    const newTicket: Ticket = {
      ...formData, id, status: TicketStatus.OPEN,
      createdBy: { name: formData.name, email: formData.email },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      comments: []
    };
    db.saveTicket(newTicket);
    setTicketId(id);
    setIsSubmitted(true);
    if (onComplete) onComplete();
  };

  const updateCustom = (fieldId: string, val: any) => {
    setFormData({ ...formData, customData: { ...formData.customData, [fieldId]: val } });
  };

  if (isSubmitted && !onComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full text-center bg-white p-12 rounded-[40px] shadow-2xl">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckIcon className="w-10 h-10" /></div>
          <h2 className="text-2xl font-black mb-4">Request Logged Successfully</h2>
          <p className="text-slate-500 mb-10 text-sm">Your Ticket ID is <span className="font-bold text-slate-900">#{ticketId}</span>. The IT team has been notified via dashboard alert.</p>
          <button onClick={() => setIsSubmitted(false)} className="w-full bg-[#0870b8] text-white font-bold py-4 rounded-2xl shadow-xl">Submit New Ticket</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-4 sm:p-10 pb-20">
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Submit IT Ticket</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Gandhi Memorial IT Services</p>
          </div>
          <Logo className="h-16 w-auto grayscale invert" />
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">My Role</label>
              <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.requesterType} onChange={e => setFormData({...formData, requesterType: e.target.value as RequesterType})}>
                {Object.values(RequesterType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          </div>

          {[RequesterType.STUDENT, RequesterType.PARENT].includes(formData.requesterType) && (
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade</label>
               <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
               <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>{SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email for Notifications</label>
            <input required type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
              <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})}>
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Summary</label>
            <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Description</label>
            <textarea required rows={4} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          {/* Render Dynamic Admin Fields */}
          {settings.customFields.map((field: CustomField) => (
            <div key={field.id} className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label} {field.required && '*'}</label>
              {field.type === FieldType.SHORT_TEXT && (
                <input required={field.required} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" onChange={e => updateCustom(field.id, e.target.value)} />
              )}
              {field.type === FieldType.DROPDOWN && (
                <select required={field.required} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" onChange={e => updateCustom(field.id, e.target.value)}>
                  <option value="">Select Option...</option>
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {field.type === FieldType.MULTIPLE_CHOICE && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {field.options?.map(o => (
                    <label key={o} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
                      <input type="radio" name={field.id} value={o} required={field.required} onChange={e => updateCustom(field.id, e.target.value)} />
                      <span className="text-sm font-bold text-slate-700">{o}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button type="submit" className="w-full bg-[#0870b8] text-white font-black py-5 rounded-[32px] text-lg shadow-2xl hover:bg-slate-900 transition-all">Submit Support Request</button>
        </form>
      </div>
    </div>
  );
};

// --- View: Login ---

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.getUsers().find(u => u.email === email && u.password === password);
    if (user) onLogin(user);
    else setError('Invalid Credentials.');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <GlobalHeader />
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12">
          <div className="text-center mb-10">
            <Logo className="h-20 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-900">Admin / Technician Login</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">IT Infrastructure Access</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold" value={email} onChange={e => setEmail(e.target.value)} placeholder="Username / Email" />
            <input required type="password" className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
            {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
            <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98]">Enter Portal</button>
          </form>
        </div>
        <div className="max-w-md w-full bg-blue-600 p-10 rounded-[40px] text-center text-white shadow-2xl">
           <h3 className="text-xl font-black mb-2">Technical Assistance</h3>
           <p className="text-blue-100 text-sm mb-8 leading-relaxed">Students & Staff: If you need a repair or account fix, please use our public form.</p>
           <Link to="/" className="inline-block w-full bg-white text-blue-600 font-black py-4 rounded-2xl hover:bg-blue-50 transition-all">Submit Support Ticket</Link>
        </div>
      </div>
    </div>
  );
};

// --- View: Staff Layout ---

const StaffLayout = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [searchParams] = useSearchParams();
  const currentPath = window.location.hash.split('?')[0];
  const [toast, setToast] = useState<string | null>(null);

  const SidebarItem = ({ to, icon: Icon, label }: any) => {
    const isActive = currentPath.includes(to);
    return (
      <Link to={to} className={`flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all ${isActive ? 'bg-[#0870b8] text-white shadow-xl shadow-blue-900/10' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
        <Icon className="w-5 h-5" />
        <span className="font-black text-[11px] uppercase tracking-widest">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] flex-col">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r bg-white hidden lg:flex flex-col p-8 space-y-3">
          <SidebarItem to="/staff/dashboard" icon={DashboardIcon} label="Dashboard" />
          <SidebarItem to="/staff/tickets" icon={TicketIcon} label="Case Log" />
          {user.role === Role.ADMIN && <SidebarItem to="/staff/users" icon={UsersIcon} label="Technicians" />}
          {user.role === Role.ADMIN && <SidebarItem to="/staff/settings" icon={CheckIcon} label="Form Settings" />}
          <div className="mt-auto pt-8 border-t">
            <button onClick={onLogout} className="flex items-center space-x-2 text-rose-500 font-black text-[10px] uppercase tracking-widest"><LogoutIcon className="w-4 h-4" /><span>Logout</span></button>
          </div>
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-around p-4">
           <Link to="/staff/dashboard" className="flex flex-col items-center"><DashboardIcon className="w-6 h-6 text-slate-400" /></Link>
           <Link to="/staff/tickets" className="flex flex-col items-center"><TicketIcon className="w-6 h-6 text-slate-400" /></Link>
           <button onClick={onLogout} className="flex flex-col items-center"><LogoutIcon className="w-6 h-6 text-rose-400" /></button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-10 pb-24 lg:pb-10">
          <div className="max-w-7xl mx-auto">
             <Routes>
               <Route path="/dashboard" element={<StaffDashboard />} />
               <Route path="/tickets" element={<StaffTicketList />} />
               <Route path="/tickets/:id" element={<StaffTicketDetail currentUserId={user.id} setGlobalToast={setToast} />} />
               <Route path="/users" element={<UserManagement />} />
               <Route path="/settings" element={<AdminSettings />} />
             </Routes>
          </div>
        </main>
      </div>
      {toast && <NotificationToast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

// --- Staff Views (Concise Logic) ---

const StaffDashboard = () => {
  const navigate = useNavigate();
  const tickets = db.getTickets();
  const open = tickets.filter(t => t.status === TicketStatus.OPEN).length;
  const inProgress = tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length;
  const closed = tickets.filter(t => t.status === TicketStatus.CLOSED).length;

  const statusData = [
    { name: 'Open', value: open, color: '#3b82f6', status: TicketStatus.OPEN },
    { name: 'In Progress', value: inProgress, color: '#f59e0b', status: TicketStatus.IN_PROGRESS },
    { name: 'Closed', value: closed, color: '#10b981', status: TicketStatus.CLOSED },
  ];

  const categoryData = db.getSettings().categories.map(cat => ({
    name: cat,
    count: tickets.filter(t => t.category === cat).length
  }));

  const handleDrilldown = (status: string) => navigate(`/staff/tickets?status=${status}`);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => handleDrilldown(TicketStatus.OPEN)} className="bg-white p-8 rounded-[32px] border cursor-pointer hover:border-blue-500 transition-all shadow-sm">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">New Requests</p>
           <p className="text-4xl font-black mt-2 text-blue-600">{open}</p>
        </div>
        <div onClick={() => navigate('/staff/tickets?priority=CRITICAL')} className="bg-white p-8 rounded-[32px] border cursor-pointer hover:border-rose-500 transition-all shadow-sm">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Critical Alarms</p>
           <p className="text-4xl font-black mt-2 text-rose-600">{tickets.filter(t => t.priority === Priority.CRITICAL && t.status !== TicketStatus.CLOSED).length}</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border shadow-sm">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Resolved</p>
           <p className="text-4xl font-black mt-2 text-emerald-600">{closed}</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border shadow-sm">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Avg Response</p>
           <p className="text-4xl font-black mt-2 text-slate-900">42m</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-sm border">
          <h3 className="text-xl font-black tracking-tighter mb-10">Departmental Distribution</h3>
          <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" onClick={(data) => data && navigate(`/staff/tickets?search=${data.activeLabel}`)}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={140} fontSize={10} fontStyle="bold" axisLine={false} tickLine={false} />
                   <Tooltip cursor={{fill: '#f8fafc'}} />
                   <Bar dataKey="count" fill="#0870b8" radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-10 rounded-[40px] shadow-sm border flex flex-col items-center">
           <h3 className="text-xl font-black tracking-tighter mb-10 w-full">System Health</h3>
           <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={statusData} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" onClick={(p) => handleDrilldown(p.payload.status)}>
                       {statusData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" className="cursor-pointer" />)}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-8 space-y-2 w-full">
              {statusData.map(s => (
                <div key={s.name} onClick={() => handleDrilldown(s.status)} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border hover:border-blue-300 cursor-pointer transition-all">
                   <div className="flex items-center space-x-3"><div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.name}</span></div>
                   <span className="text-sm font-black">{s.value}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const StaffTicketList = () => {
  const [params] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState({ 
    status: params.get('status') || 'ALL', 
    priority: params.get('priority') || 'ALL', 
    search: params.get('search') || '' 
  });

  useEffect(() => { setTickets(db.getTickets()); }, []);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = filters.status === 'ALL' || t.status === filters.status;
      const matchPriority = filters.priority === 'ALL' || t.priority === filters.priority;
      const matchSearch = t.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                          t.id.toLowerCase().includes(filters.search.toLowerCase()) ||
                          t.category.toLowerCase().includes(filters.search.toLowerCase()) ||
                          t.createdBy.name.toLowerCase().includes(filters.search.toLowerCase());
      return matchStatus && matchPriority && matchSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, filters]);

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-white p-8 rounded-[32px] shadow-sm border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
          <input className="w-full pl-16 pr-6 py-4 bg-slate-50 border rounded-2xl font-bold" placeholder="Universal Filter (Name, ID, Room...)" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
        </div>
        <select className="px-6 py-4 bg-slate-50 border rounded-2xl font-black text-[10px] uppercase" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
           <option value="ALL">All States</option>
           <option value={TicketStatus.OPEN}>Opened</option>
           <option value={TicketStatus.IN_PROGRESS}>Working</option>
           <option value={TicketStatus.CLOSED}>Closed</option>
        </select>
        <select className="px-6 py-4 bg-slate-50 border rounded-2xl font-black text-[10px] uppercase" value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
           <option value="ALL">All Priorities</option>
           {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden">
         <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                 <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Case Profile</th>
                 <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                 <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Severity</th>
                 <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 cursor-pointer transition-all" onClick={() => window.location.hash = `/staff/tickets/${t.id}`}>
                  <td className="px-10 py-8">
                    <p className="text-[#0870b8] font-black text-[10px] mb-1">{t.id}</p>
                    <p className="text-sm font-bold text-slate-900">{t.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{t.category}</p>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-sm font-bold">{t.createdBy.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.requesterType} {t.grade ? `| Gr ${t.grade}-${t.section}` : ''}</p>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <Badge color={t.priority === Priority.CRITICAL ? 'red' : t.priority === Priority.HIGH ? 'orange' : 'slate'}>{t.priority}</Badge>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <Badge color={t.status === TicketStatus.OPEN ? 'blue' : t.status === TicketStatus.IN_PROGRESS ? 'orange' : 'green'}>{t.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

const StaffTicketDetail = ({ currentUserId, setGlobalToast }: any) => {
  const ticketId = window.location.hash.split('/').pop();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [aiTip, setAiTip] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (ticketId) {
      const found = db.getTicketById(ticketId);
      if (found) setTicket(found);
    }
  }, [ticketId]);

  const generateAi = async () => {
    if (!ticket) return;
    setLoadingAi(true);
    const tip = await suggestSolution(ticket);
    setAiTip(tip || '');
    setLoadingAi(false);
  };

  const updateStatus = (st: TicketStatus) => {
    if (!ticket) return;
    const upd = { ...ticket, status: st, updatedAt: new Date().toISOString() };
    db.saveTicket(upd); setTicket(upd);
    setGlobalToast(`Case marked as ${st}. User emailed.`);
  };

  if (!ticket) return <div className="p-20 text-center font-black animate-pulse">Retreiving Secure Records...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32 animate-in slide-in-from-right-10">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-[40px] shadow-sm border p-12 sm:p-16">
           <div className="flex justify-between items-start mb-12">
             <div><p className="text-[11px] font-black text-blue-600 mb-2">{ticket.id}</p><h2 className="text-4xl font-black tracking-tighter">{ticket.title}</h2></div>
             <Badge color={ticket.priority === Priority.CRITICAL ? 'red' : 'blue'}>{ticket.priority}</Badge>
           </div>
           <div className="bg-slate-50 p-8 rounded-3xl mb-12"><p className="text-lg leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">{ticket.description}</p></div>
           
           {/* Custom Form Field Data Display */}
           {ticket.customData && Object.keys(ticket.customData).length > 0 && (
             <div className="grid grid-cols-2 gap-4 mb-12">
               {Object.entries(ticket.customData).map(([id, val]) => {
                 const field = db.getSettings().customFields.find(f => f.id === id);
                 return (
                   <div key={id} className="p-4 border rounded-2xl bg-slate-50/50">
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{field?.label || 'Meta Info'}</p>
                     <p className="text-sm font-bold">{val as string}</p>
                   </div>
                 );
               })}
             </div>
           )}

           <div className="pt-10 border-t flex flex-col space-y-8">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">Smart IT Diagnosis</h3>
                <button onClick={generateAi} disabled={loadingAi} className="text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg disabled:opacity-50 transition-all active:scale-95">
                  {loadingAi ? 'AI Analyzing...' : 'Generate AI Troubleshooting'}
                </button>
             </div>
             {aiTip && <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-900 font-medium whitespace-pre-wrap text-sm leading-loose shadow-inner animate-in zoom-in-95">{aiTip}</div>}
           </div>
        </div>
      </div>
      <div className="space-y-8">
        <div className="bg-white p-10 rounded-[40px] shadow-sm border">
           <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Technician Console</h3>
           <div className="space-y-4">
              <button onClick={() => updateStatus(TicketStatus.IN_PROGRESS)} className="w-full py-4 bg-amber-50 text-amber-700 border rounded-2xl font-black text-[10px] uppercase">Mark In-Progress</button>
              <button onClick={() => updateStatus(TicketStatus.CLOSED)} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Complete Case</button>
              <button onClick={() => updateStatus(TicketStatus.OPEN)} className="w-full py-4 bg-slate-50 text-slate-400 border rounded-2xl font-black text-[10px] uppercase">Reset to Open</button>
           </div>
        </div>
        <div className="bg-white p-10 rounded-[40px] shadow-sm border">
           <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Contact Info</h3>
           <div className="space-y-6">
              <div><p className="text-[9px] font-black text-slate-300 uppercase mb-1">User</p><p className="text-sm font-bold">{ticket.createdBy.name}</p></div>
              <div><p className="text-[9px] font-black text-slate-300 uppercase mb-1">Channel</p><p className="text-sm font-bold text-blue-600 underline">{ticket.createdBy.email}</p></div>
              <div><p className="text-[9px] font-black text-slate-300 uppercase mb-1">Category</p><p className="text-sm font-bold">{ticket.category}</p></div>
           </div>
        </div>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());
  const [newField, setNewField] = useState<CustomField>({ id: '', label: '', type: FieldType.SHORT_TEXT, required: false });

  const save = (updated: AppSettings) => { setSettings(updated); db.saveSettings(updated); };

  const addField = () => {
    const field = { ...newField, id: Math.random().toString(36).substr(2, 9) };
    save({ ...settings, customFields: [...settings.customFields, field] });
    setNewField({ id: '', label: '', type: FieldType.SHORT_TEXT, required: false });
  };

  const addCategory = () => {
    const name = prompt("Enter category name:");
    if (name) save({ ...settings, categories: [...settings.categories, name] });
  };

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in duration-500">
      <div><h2 className="text-3xl font-black tracking-tighter">System Orchestration</h2><p className="text-[10px] uppercase font-black text-slate-400 mt-2">Customize the form & IT Logic</p></div>

      <div className="bg-white p-10 rounded-[40px] border shadow-sm space-y-8">
        <h3 className="text-xl font-black">Case Categories</h3>
        <div className="flex flex-wrap gap-3">
          {settings.categories.map(c => <span key={c} className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold border flex items-center">{c} <button onClick={() => save({...settings, categories: settings.categories.filter(x => x !== c)})} className="ml-2 text-rose-400">✕</button></span>)}
          <button onClick={addCategory} className="bg-[#0870b8] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-100">+ Add</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[40px] border shadow-sm space-y-10">
        <h3 className="text-xl font-black">Public Form Builder</h3>
        <div className="space-y-6">
           {settings.customFields.map(f => (
             <div key={f.id} className="p-6 bg-slate-50 border rounded-[32px] flex justify-between items-center">
                <div><p className="text-sm font-black">{f.label}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.type.replace('_', ' ')} • {f.required ? 'Required' : 'Optional'}</p></div>
                <button onClick={() => save({...settings, customFields: settings.customFields.filter(x => x.id !== f.id)})} className="text-rose-500 font-black text-xs">Remove</button>
             </div>
           ))}
           <div className="p-10 border-2 border-dashed rounded-[40px] bg-slate-50/50 space-y-6">
              <p className="text-xs font-black uppercase text-slate-400 text-center mb-4">Add New Dynamic Field</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input className="px-6 py-4 bg-white border rounded-2xl font-bold" placeholder="Field Question (e.g. Room Number)" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} />
                <select className="px-6 py-4 bg-white border rounded-2xl font-bold" value={newField.type} onChange={e => setNewField({...newField, type: e.target.value as FieldType})}>
                  {Object.values(FieldType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {newField.type !== FieldType.SHORT_TEXT && (
                <input className="w-full px-6 py-4 bg-white border rounded-2xl font-bold" placeholder="Options (comma separated)" onChange={e => setNewField({...newField, options: e.target.value.split(',').map(x => x.trim())})} />
              )}
              <button onClick={addField} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95">Add Field to Request Form</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const users = db.getUsers();
  return (
    <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden animate-in fade-in duration-500">
       <div className="p-10 border-b flex justify-between items-center"><h2 className="text-2xl font-black">Authorized Technicians</h2></div>
       <table className="w-full text-left">
          <thead><tr className="bg-slate-50"><th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th><th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Privilege</th></tr></thead>
          <tbody className="divide-y">{users.map(u => (<tr key={u.id} className="hover:bg-slate-50"><td className="px-10 py-6 font-bold">{u.name}</td><td className="px-10 py-6"><Badge color={u.role === Role.ADMIN ? 'red' : 'blue'}>{u.role}</Badge></td></tr>))}</tbody>
       </table>
    </div>
  );
};

// --- App Root ---

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { const s = localStorage.getItem('logged_user'); if (s) setUser(JSON.parse(s)); }, []);
  const handleLogin = (u: User) => { setUser(u); localStorage.setItem('logged_user', JSON.stringify(u)); window.location.hash = '/staff/dashboard'; };
  const handleLogout = () => { setUser(null); localStorage.removeItem('logged_user'); window.location.hash = '/'; };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<div className="h-full overflow-y-auto"><GlobalHeader showLogin={true} /><TicketForm /></div>} />
        <Route path="/staff-login" element={user ? <Navigate to="/staff/dashboard" /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/staff/*" element={user ? <StaffLayout user={user} onLogout={handleLogout} /> : <Navigate to="/staff-login" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
