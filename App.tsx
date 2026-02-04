
import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Role, User, Ticket, TicketStatus, Priority, 
  RequesterType, GRADES, SECTIONS, AppSettings, FieldType, CustomField 
} from './types';
import { db } from './services/mockDb';
import { 
  DashboardIcon, TicketIcon, UsersIcon, LogoutIcon, 
  PlusIcon, SearchIcon, CheckIcon, ChevronRightIcon
} from './components/Icons';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import { suggestSolution } from './services/geminiService';

const GMIS_LOGO_URL = "https://lh3.googleusercontent.com/d/1Gi0EJzM7Ng9R3QXwZaUUpBxdGE1P-LfI";

// --- Theme Management ---
const ThemeContext = createContext<{ settings: AppSettings, refresh: () => void }>({ 
  settings: db.getSettings(), 
  refresh: () => {} 
});

// --- Mock Notification Helper ---
const triggerMockNotification = (type: string, ticket: Ticket, settings: AppSettings, setToast: (m: string) => void) => {
  const { notifyOnCreation, notifyOnResolution, notifyOnStatusChange, notifyOnAssignment } = settings.notifications;
  
  let shouldNotify = false;
  let message = "";

  if (type === 'create' && notifyOnCreation) {
    shouldNotify = true;
    message = `Notification sent to ${ticket.createdBy.email}: Ticket ${ticket.id} created.`;
  } else if (type === 'close' && notifyOnResolution) {
    shouldNotify = true;
    message = `Notification sent to ${ticket.createdBy.email}: Ticket ${ticket.id} resolved.`;
  } else if (type === 'update' && notifyOnStatusChange) {
    shouldNotify = true;
    message = `Notification sent to ${ticket.createdBy.email}: Ticket ${ticket.id} status updated to ${ticket.status}.`;
  } else if (type === 'assign' && notifyOnAssignment) {
    shouldNotify = true;
    message = `Notification sent to assignee: Ticket ${ticket.id} assigned.`;
  }

  if (shouldNotify) {
    console.log(`[MAIL SERVER - ${settings.emailConfig.smtpHost}] ${message}`);
    setToast(message);
  }
};

// --- Utility Components ---

const Logo = ({ className = "h-12 w-auto" }) => (
  <img src={GMIS_LOGO_URL} alt="GMIS Logo" className={className} />
);

const Badge = ({ children, color = 'blue' }: { children?: React.ReactNode, color?: string }) => {
  const { settings } = useContext(ThemeContext);
  const colors: Record<string, string> = {
    blue: `bg-blue-50 text-blue-600 border-blue-100`,
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    orange: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${colors[color] || colors.slate}`}>{children}</span>;
};

const GlobalHeader = ({ hideAdminLink = false }) => {
  const { settings } = useContext(ThemeContext);
  return (
    <header className="bg-white/80 border-b border-slate-100 py-4 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl shadow-sm">
      <div className="flex items-center space-x-4">
        <Logo className="h-10 sm:h-12 w-auto" />
        <div className="hidden sm:flex flex-col">
          <h1 className="text-sm font-black text-slate-900 tracking-tighter uppercase leading-none">Gandhi Memorial Intercontinental School</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1">IT Support Portal</p>
        </div>
      </div>
      {!hideAdminLink && (
        <Link to="/portal" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-4 py-2 rounded-xl">
          Back to Main
        </Link>
      )}
    </header>
  );
};

// --- Portal / Login (Stacked Premium Card) ---

const PortalPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { settings } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.getUsers().find(u => u.email === email && u.password === password);
    if (user) onLogin(user);
    else setError('Invalid access credentials.');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-[#f8fafc] overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] animate-pulse pointer-events-none opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-100 rounded-full blur-[100px] pointer-events-none opacity-60"></div>

      <div className="max-w-xl w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[56px] shadow-[0_32px_80px_rgba(0,0,0,0.06)] border border-white overflow-hidden">
          
          <div className="bg-white p-12 text-center space-y-8 border-b border-slate-50">
            <Logo className="h-20 mx-auto" />
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tighter leading-tight text-slate-900">Need Support?</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">Students, Parents & Staff: Raise a ticket for any technical assistance required.</p>
            </div>
            <Link to="/submit" style={{ backgroundColor: settings.themeColor }} className="inline-flex items-center space-x-4 text-white px-10 py-5 rounded-[28px] font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all group uppercase tracking-widest">
              <span>Raise a Support Case</span>
              <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="p-12 space-y-10 bg-slate-50/30">
            <div className="text-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Technician / Admin Portal</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                 <input required className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder-slate-300" value={email} onChange={e => setEmail(e.target.value)} placeholder="Username / Email" />
              </div>
              <div className="space-y-2">
                 <input required type="password" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder-slate-300" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
              </div>
              {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{error}</p>}
              <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]">Terminal Login</button>
            </form>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-center space-x-4">
               <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">GMIS IT Infrastructure v2.5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Ticket Form (Shared for public and manual staff entry) ---

const TicketForm = ({ isManual = false, setGlobalToast }: { isManual?: boolean, setGlobalToast?: (m: string) => void }) => {
  const { settings } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>({
    name: '', email: '', title: '', category: settings.categories[0],
    description: '', priority: Priority.MEDIUM, requesterType: RequesterType.TEACHER,
    grade: GRADES[0], section: SECTIONS[0], customData: {}
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const showGradeSection = [RequesterType.STUDENT, RequesterType.PARENT].includes(formData.requesterType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `GMIS-${Math.floor(1000 + Math.random() * 8999)}`;
    const newTicket: Ticket = {
      ...formData, id, status: TicketStatus.OPEN,
      createdBy: { name: formData.name, email: formData.email },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      comments: []
    };
    db.saveTicket(newTicket);
    setTicketId(id);
    setIsSubmitted(true);
    
    // Trigger notification
    if (setGlobalToast) {
      triggerMockNotification('create', newTicket, settings, setGlobalToast);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`flex items-center justify-center p-6 ${isManual ? '' : 'min-h-screen bg-[#f8fafc]'}`}>
        <div className="max-w-md w-full text-center bg-white p-12 rounded-[56px] shadow-2xl border border-slate-50">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckIcon className="w-10 h-10" /></div>
          <h2 className="text-2xl font-black mb-4">Case {isManual ? 'Recorded' : 'Submitted'}</h2>
          <p className="text-slate-500 mb-10 text-sm leading-relaxed">Case ID <span className="font-bold text-slate-900">#{ticketId}</span> is now active. {isManual ? 'The staff workflow is live.' : 'Please check your email for status updates.'}</p>
          <button onClick={() => { if(isManual) navigate('/staff/tickets'); else setIsSubmitted(false); }} style={{ backgroundColor: settings.themeColor }} className="w-full text-white font-black py-4 rounded-2xl shadow-xl hover:opacity-90 transition-all uppercase tracking-widest">
            {isManual ? 'Return to Case Records' : 'Submit Another Request'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isManual ? '' : 'min-h-screen bg-[#f8fafc]'}`}>
      {!isManual && <GlobalHeader hideAdminLink={false} />}
      <div className={`max-w-4xl mx-auto w-full ${isManual ? '' : 'p-4 sm:p-10 pb-20'}`}>
        <div className={`bg-white ${isManual ? '' : 'rounded-[56px] shadow-2xl border border-white'} overflow-hidden animate-in slide-in-from-bottom-8 duration-500`}>
          {!isManual && (
            <div className="bg-slate-50 p-12 text-slate-900 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase">New Support Case</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Providing context helps us solve faster</p>
              </div>
              <Logo className="h-16 w-auto" />
            </div>
          )}
          <form onSubmit={handleSubmit} className={`${isManual ? 'space-y-8' : 'p-10 sm:p-14 space-y-12'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Requester Role</label>
                <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all" value={formData.requesterType} onChange={e => setFormData({...formData, requesterType: e.target.value as RequesterType})}>
                  {Object.values(RequesterType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Requester Full Name</label>
                <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder-slate-300" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
            </div>

            {showGradeSection && (
              <div className="grid grid-cols-2 gap-10 animate-in slide-in-from-top-4 duration-300">
                 <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade</label>
                 <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                 <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                 <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>{SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Requester Email</label>
              <input required type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder-slate-300" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. parent@example.com" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Category</label>
                <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urgency Level</label>
                <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})}>
                  {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Summary</label>
              <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder-slate-300" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. WiFi connectivity issue in Room 302" />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Description</label>
              <textarea required rows={5} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder-slate-300" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Provide device details, error codes, and exact location..." />
            </div>

            <button type="submit" style={{ backgroundColor: settings.themeColor }} className="w-full text-white font-black py-5 rounded-[28px] text-lg shadow-2xl hover:opacity-90 transition-all active:scale-[0.98] uppercase tracking-widest">
              {isManual ? 'Generate Official Record' : 'Transmit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- View: Dashboard ---

const StaffDashboard = () => {
  const navigate = useNavigate();
  const tickets = db.getTickets();
  
  const stats = {
    open: tickets.filter(t => t.status === TicketStatus.OPEN).length,
    inProgress: tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
    closed: tickets.filter(t => t.status === TicketStatus.CLOSED).length,
    critical: tickets.filter(t => t.priority === Priority.CRITICAL && t.status !== TicketStatus.CLOSED).length
  };

  const statusData = [
    { name: 'Incoming', value: stats.open, color: '#3b82f6', key: TicketStatus.OPEN },
    { name: 'In-Work', value: stats.inProgress, color: '#f59e0b', key: TicketStatus.IN_PROGRESS },
    { name: 'Resolved', value: stats.closed, color: '#10b981', key: TicketStatus.CLOSED },
  ];

  const trendData = [
    { day: 'Mon', count: 4 }, { day: 'Tue', count: 7 }, { day: 'Wed', count: 5 },
    { day: 'Thu', count: 12 }, { day: 'Fri', count: 9 }, { day: 'Sat', count: 2 }, { day: 'Sun', count: 3 }
  ];

  const categoryData = db.getSettings().categories.map(cat => ({
    name: cat,
    count: tickets.filter(t => t.category === cat).length
  }));

  const handleDrilldown = (type: string, val: string) => navigate(`/staff/tickets?${type}=${val}`);

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black tracking-tighter">Ops Center</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-3">Live Infrastructure Monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="Incoming Triage" val={stats.open} color="text-blue-600" onClick={() => handleDrilldown('status', TicketStatus.OPEN)} />
        <StatCard label="Critical Response" val={stats.critical} color="text-rose-600" onClick={() => handleDrilldown('priority', Priority.CRITICAL)} />
        <StatCard label="Resolved Cases" val={stats.closed} color="text-emerald-600" onClick={() => handleDrilldown('status', TicketStatus.CLOSED)} />
        <StatCard label="SLA Compliance" val={`${Math.round((stats.closed / Math.max(tickets.length, 1)) * 100)}%`} color="text-slate-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 rounded-[56px] shadow-sm border space-y-10">
           <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">Volume Trends</h3>
              <Badge color="blue">Last 7 Days</Badge>
           </div>
           <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={trendData}>
                 <defs>
                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} fontStyle="bold" />
                 <YAxis axisLine={false} tickLine={false} fontSize={11} />
                 <Tooltip />
                 <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white p-12 rounded-[56px] shadow-sm border flex flex-col items-center">
           <h3 className="text-2xl font-black w-full mb-10 text-center">Lifecycle</h3>
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={80} outerRadius={115} paddingAngle={12} dataKey="value" stroke="none" onClick={(p) => handleDrilldown('status', p.payload.key)}>
                    {statusData.map((e, i) => <Cell key={i} fill={e.color} className="cursor-pointer hover:opacity-75 transition-opacity outline-none" />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-10 space-y-4 w-full">
             {statusData.map(s => (
               <div key={s.name} onClick={() => handleDrilldown('status', s.key)} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl cursor-pointer hover:bg-slate-100 transition-all border group">
                 <div className="flex items-center space-x-4">
                   <div className="w-3 h-3 rounded-full" style={{backgroundColor: s.color}} />
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">{s.name}</span>
                 </div>
                 <span className="text-2xl font-black">{s.value}</span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, color, onClick }: any) => (
  <div onClick={onClick} className={`bg-white p-10 rounded-[48px] border transition-all shadow-sm ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-2xl active:scale-95' : ''}`}>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className={`text-6xl font-black mt-4 tracking-tighter ${color}`}>{val}</p>
  </div>
);

// --- View: Ticket List ---

const StaffTicketList = ({ setGlobalToast }: { setGlobalToast: (m: string) => void }) => {
  const [params] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [filters, setFilters] = useState({ 
    status: params.get('status') || 'ALL', 
    priority: params.get('priority') || 'ALL', 
    search: params.get('search') || '',
    category: params.get('category') || 'ALL',
    role: 'ALL'
  });

  useEffect(() => { setTickets(db.getTickets()); }, [showManualCreate]);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = filters.status === 'ALL' || t.status === filters.status;
      const matchPriority = filters.priority === 'ALL' || t.priority === filters.priority;
      const matchCategory = filters.category === 'ALL' || t.category === filters.category;
      const matchRole = filters.role === 'ALL' || t.requesterType === filters.role;
      const matchSearch = t.title.toLowerCase().includes(filters.search.toLowerCase()) || t.id.toLowerCase().includes(filters.search.toLowerCase()) || t.createdBy.name.toLowerCase().includes(filters.search.toLowerCase());
      return matchStatus && matchPriority && matchCategory && matchRole && matchSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, filters]);

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
           <h2 className="text-4xl font-black tracking-tighter">Case Records</h2>
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Active database terminal</p>
        </div>
        <button onClick={() => setShowManualCreate(true)} className="w-full sm:w-auto bg-slate-900 text-white px-8 py-5 rounded-[28px] font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center justify-center space-x-4 active:scale-95 hover:bg-slate-800 transition-all">
           <PlusIcon className="w-6 h-6" /><span>Manual Entry</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="bg-white p-8 rounded-[48px] shadow-sm border flex-1 space-y-8">
          <div className="relative">
            <SearchIcon className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
            <input className="w-full pl-18 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[32px] font-bold focus:ring-8 focus:ring-blue-50 outline-none transition-all text-lg" placeholder="Search Master ID, Title or Requester..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <FilterSelect label="Life Cycle" val={filters.status} options={[{v:'ALL', l:'All States'}, {v:TicketStatus.OPEN, l:'Incoming'}, {v:TicketStatus.IN_PROGRESS, l:'Active'}, {v:TicketStatus.CLOSED, l:'Resolved'}]} onChange={v => setFilters({...filters, status: v})} />
             <FilterSelect label="Urgency" val={filters.priority} options={[{v:'ALL', l:'All Priorities'}, ...Object.values(Priority).map(p => ({v:p, l:p}))]} onChange={v => setFilters({...filters, priority: v})} />
             <FilterSelect label="Service Queue" val={filters.category} options={[{v:'ALL', l:'All Departments'}, ...db.getSettings().categories.map(c => ({v:c, l:c}))]} onChange={v => setFilters({...filters, category: v})} />
             <FilterSelect label="Origin" val={filters.role} options={[{v:'ALL', l:'All Roles'}, ...Object.values(RequesterType).map(r => ({v:r, l:r}))]} onChange={v => setFilters({...filters, role: v})} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[56px] border shadow-sm overflow-hidden overflow-x-auto">
         <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b">
                 <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Profile</th>
                 <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requester Identity</th>
                 <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Urgency</th>
                 <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifecycle</th>
                 <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Chronology</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(t => {
                const date = new Date(t.createdAt);
                return (
                  <tr key={t.id} className="hover:bg-blue-50/40 cursor-pointer transition-all group" onClick={() => window.location.hash = `/staff/tickets/${t.id}`}>
                    <td className="px-12 py-10">
                      <p className="text-blue-600 font-black text-[11px] mb-2 tracking-widest">{t.id}</p>
                      <p className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">{t.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{t.category}</p>
                    </td>
                    <td className="px-12 py-10">
                      <p className="text-base font-bold text-slate-800">{t.createdBy.name}</p>
                      <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1">{t.requesterType} {t.grade ? `• Grade ${t.grade}-${t.section}` : ''}</p>
                    </td>
                    <td className="px-12 py-10 text-center">
                      <Badge color={t.priority === Priority.CRITICAL ? 'red' : t.priority === Priority.HIGH ? 'orange' : 'slate'}>{t.priority}</Badge>
                    </td>
                    <td className="px-12 py-10 text-center">
                      <Badge color={t.status === TicketStatus.OPEN ? 'blue' : t.status === TicketStatus.IN_PROGRESS ? 'orange' : 'green'}>{t.status}</Badge>
                    </td>
                    <td className="px-12 py-10 text-center">
                      <p className="text-xs font-black text-slate-500 uppercase">{date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
         </table>
         {filtered.length === 0 && <div className="p-32 text-center font-black uppercase text-slate-200 tracking-[1em] text-sm">System Result: Null</div>}
      </div>

      {showManualCreate && (
        <Modal title="Manual Case Entry" onClose={() => setShowManualCreate(false)}>
           <TicketForm isManual={true} setGlobalToast={setGlobalToast} />
        </Modal>
      )}
    </div>
  );
};

const FilterSelect = ({ label, val, options, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">{label}</label>
    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-xs uppercase outline-none transition-all hover:border-blue-200" value={val} onChange={e => onChange(e.target.value)}>
      {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

// --- Admin Settings ---

const AdminSettings = () => {
  const { settings, refresh } = useContext(ThemeContext);
  const [localSettings, setLocalSettings] = useState(settings);
  const save = (updated: AppSettings) => { setLocalSettings(updated); db.saveSettings(updated); refresh(); };

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in duration-700 pb-24">
      <div>
        <h2 className="text-4xl font-black tracking-tighter">System Orchestration</h2>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Brand and logic terminal</p>
      </div>

      {/* Visual Identity */}
      <div className="bg-white p-14 rounded-[56px] border shadow-sm space-y-12">
         <h3 className="text-2xl font-black">Visual Identity</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Accent Terminal Color</label>
               <div className="flex items-center space-x-8">
                  <input type="color" className="w-28 h-28 rounded-full border-4 border-white shadow-2xl cursor-pointer" value={localSettings.themeColor} onChange={e => save({...localSettings, themeColor: e.target.value})} />
                  <div className="flex-1 px-8 py-6 bg-slate-50 rounded-3xl font-mono text-lg border-2 border-slate-50 font-black uppercase text-slate-700">{localSettings.themeColor}</div>
               </div>
            </div>
            <div className="p-12 rounded-[40px] border border-slate-50 flex flex-col justify-center items-center bg-slate-50/50 relative overflow-hidden shadow-inner">
               <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: localSettings.themeColor }}></div>
               <p className="text-[9px] font-black uppercase text-slate-300 mb-8 tracking-[0.4em]">Live Preview</p>
               <button style={{ backgroundColor: localSettings.themeColor }} className="w-full py-5 rounded-[24px] text-white font-black text-xs uppercase shadow-2xl tracking-widest transition-all">Action Primary</button>
            </div>
         </div>
      </div>

      {/* Email Configuration */}
      <div className="bg-white p-14 rounded-[56px] border shadow-sm space-y-12">
         <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black">Email Terminal Config</h3>
            <Badge color="blue">SMTP Layer</Badge>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">SMTP Host</label>
               <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={localSettings.emailConfig.smtpHost} onChange={e => save({...localSettings, emailConfig: {...localSettings.emailConfig, smtpHost: e.target.value}})} />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Port</label>
               <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={localSettings.emailConfig.smtpPort} onChange={e => save({...localSettings, emailConfig: {...localSettings.emailConfig, smtpPort: e.target.value}})} />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sender Address</label>
               <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={localSettings.emailConfig.senderEmail} onChange={e => save({...localSettings, emailConfig: {...localSettings.emailConfig, senderEmail: e.target.value}})} />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sender Display Name</label>
               <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={localSettings.emailConfig.senderName} onChange={e => save({...localSettings, emailConfig: {...localSettings.emailConfig, senderName: e.target.value}})} />
            </div>
         </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white p-14 rounded-[56px] border shadow-sm space-y-12">
         <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black">Automated Workflows</h3>
            <Badge color="green">Active</Badge>
         </div>
         <div className="space-y-6">
            <ToggleOption label="Send notification on Case Creation" active={localSettings.notifications.notifyOnCreation} onClick={() => save({...localSettings, notifications: {...localSettings.notifications, notifyOnCreation: !localSettings.notifications.notifyOnCreation}})} />
            <ToggleOption label="Send notification on Status Transitions" active={localSettings.notifications.notifyOnStatusChange} onClick={() => save({...localSettings, notifications: {...localSettings.notifications, notifyOnStatusChange: !localSettings.notifications.notifyOnStatusChange}})} />
            <ToggleOption label="Send notification on Assignment updates" active={localSettings.notifications.notifyOnAssignment} onClick={() => save({...localSettings, notifications: {...localSettings.notifications, notifyOnAssignment: !localSettings.notifications.notifyOnAssignment}})} />
            <ToggleOption label="Send notification on Case Resolution" active={localSettings.notifications.notifyOnResolution} onClick={() => save({...localSettings, notifications: {...localSettings.notifications, notifyOnResolution: !localSettings.notifications.notifyOnResolution}})} />
         </div>
      </div>

      {/* Core Logic */}
      <div className="bg-white p-14 rounded-[56px] border shadow-sm space-y-12">
         <h3 className="text-2xl font-black">Core Logic</h3>
         <div className="space-y-10">
            <div className="p-12 border-4 border-dashed border-slate-50 rounded-[48px] bg-slate-50/30">
               <p className="text-[10px] font-black uppercase text-slate-400 mb-10 tracking-widest">Active Support Queues</p>
               <div className="flex flex-wrap gap-4">
                 {localSettings.categories.map(c => (
                   <span key={c} className="px-8 py-4 bg-white border border-slate-100 rounded-[20px] text-xs font-black flex items-center shadow-sm group hover:border-blue-200 transition-all">
                     {c} 
                     <button onClick={() => save({...localSettings, categories: localSettings.categories.filter(x => x !== c)})} className="ml-6 text-rose-300 hover:text-rose-600 transition-colors">✕</button>
                   </span>
                 ))}
                 <button onClick={() => { const n = prompt("Define new Service Queue:"); if(n) save({...localSettings, categories: [...localSettings.categories, n]}); }} className="px-8 py-4 bg-slate-900 text-white rounded-[20px] text-xs font-black shadow-2xl hover:bg-blue-600 transition-all">+ Add Queue</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const ToggleOption = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <div onClick={onClick} className="flex items-center justify-between p-6 bg-slate-50/50 border border-slate-100 rounded-3xl cursor-pointer hover:bg-white hover:shadow-lg transition-all group">
    <span className="text-sm font-black text-slate-700 group-hover:text-slate-900">{label}</span>
    <div className={`w-14 h-8 rounded-full relative transition-all ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
       <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${active ? 'left-7' : 'left-1'}`} />
    </div>
  </div>
);

const StaffTicketDetail = ({ setGlobalToast }: any) => {
  const ticketId = window.location.hash.split('/').pop();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [aiNotes, setAiNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<User[]>([]);
  const { settings } = useContext(ThemeContext);

  useEffect(() => {
    if (ticketId) {
      const found = db.getTicketById(ticketId);
      if (found) setTicket(found);
      setStaff(db.getUsers().filter(u => u.role !== Role.TEACHER));
    }
  }, [ticketId]);

  const runAi = async () => {
    if(!ticket) return;
    setLoading(true);
    const n = await suggestSolution(ticket);
    setAiNotes(n || 'Recommendation protocol offline.');
    setLoading(false);
  };

  const update = (st: TicketStatus) => {
    if(!ticket) return;
    const u = {...ticket, status: st, updatedAt: new Date().toISOString()};
    db.saveTicket(u); setTicket(u);
    
    // Notification logic
    const type = st === TicketStatus.CLOSED ? 'close' : 'update';
    triggerMockNotification(type, u, settings, setGlobalToast);
    setGlobalToast(`Status optimized: ${st}`);
  };

  const assign = (id: string) => {
    if(!ticket) return;
    const u = {...ticket, assignedTo: id};
    db.saveTicket(u); setTicket(u);
    triggerMockNotification('assign', u, settings, setGlobalToast);
    setGlobalToast("Case ownership assigned.");
  };

  if(!ticket) return <div className="p-32 text-center font-black animate-pulse text-slate-300 uppercase tracking-[0.5em]">Querying Database...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-32 animate-in slide-in-from-right-12 duration-600">
       <div className="lg:col-span-2 space-y-12">
          <div className="bg-white p-16 lg:p-24 rounded-[64px] shadow-sm border border-slate-50 relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-14">
                  <div className="space-y-3">
                     <p className="text-[11px] font-black text-blue-600 tracking-widest uppercase">{ticket.id}</p>
                     <h2 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">{ticket.title}</h2>
                  </div>
                  <Badge color={ticket.priority === Priority.CRITICAL ? 'red' : 'blue'}>{ticket.priority}</Badge>
               </div>
               
               <div className="p-12 bg-slate-50/50 border border-slate-50 rounded-[40px] mb-14 shadow-inner">
                  <p className="text-2xl leading-relaxed font-medium text-slate-700 whitespace-pre-wrap tracking-tight">{ticket.description}</p>
               </div>
               
               <div className="pt-14 border-t border-slate-50">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-10 mb-12">
                     <h3 className="text-3xl font-black">AI Diagnosis Protocol</h3>
                     <button onClick={runAi} disabled={loading} className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest shadow-2xl disabled:opacity-50 hover:scale-[1.02] transition-all">
                        {loading ? 'Processing...' : 'Execute Analysis'}
                     </button>
                  </div>
                  {aiNotes && (
                    <div className="p-12 bg-emerald-50 border border-emerald-100 rounded-[48px] text-emerald-900 font-medium whitespace-pre-wrap text-lg leading-relaxed shadow-inner animate-in zoom-in-95">
                       <div className="flex items-center space-x-4 mb-6">
                          <CheckIcon className="w-8 h-8 text-emerald-500" />
                          <span className="text-[11px] font-black uppercase tracking-widest">Recommended Actions</span>
                       </div>
                       {aiNotes}
                    </div>
                  )}
               </div>
             </div>
          </div>
       </div>
       
       <div className="space-y-12">
          <div className="bg-white p-14 rounded-[56px] shadow-sm border space-y-12">
             <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Lifecycle Management</h3>
             <div className="space-y-10">
                <div className="space-y-3">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Assigned Terminal</p>
                   <select className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-sm transition-all focus:ring-8 focus:ring-blue-50 outline-none" value={ticket.assignedTo || ''} onChange={e => assign(e.target.value)}>
                      <option value="">Pending Assignment...</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
                <div className="space-y-4">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Case Transition</p>
                   <div className="flex flex-col gap-4">
                      {ticket.status !== TicketStatus.CLOSED && <button onClick={() => update(TicketStatus.CLOSED)} className="w-full py-6 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest rounded-[28px] shadow-2xl hover:bg-emerald-700 transition-all active:scale-95">Finalize Case</button>}
                      {ticket.status === TicketStatus.OPEN && <button onClick={() => update(TicketStatus.IN_PROGRESS)} className="w-full py-6 bg-amber-50 text-amber-700 border border-amber-100 rounded-[28px] font-black text-[11px] uppercase tracking-widest hover:bg-amber-100 transition-all">Engage Process</button>}
                      {ticket.status === TicketStatus.CLOSED && <button onClick={() => update(TicketStatus.OPEN)} className="w-full py-6 bg-slate-100 text-slate-500 border border-slate-200 rounded-[28px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">Recall Case</button>}
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- User Management & Layout ---

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: Role.SUPPORT, password: 'password' });

  useEffect(() => { setUsers(db.getUsers()); }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const u = { ...newUser, id: Math.random().toString(36).substr(2, 9) };
    db.saveUser(u);
    setUsers([...users, u]);
    setShowAdd(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
         <div>
            <h2 className="text-4xl font-black tracking-tighter">Technician Network</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Managing system permissions</p>
         </div>
         <button onClick={() => setShowAdd(true)} className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-[28px] font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center justify-center space-x-4 active:scale-95 hover:bg-slate-800 transition-all">
           <PlusIcon className="w-6 h-6" /><span>Register Staff</span>
         </button>
      </div>

      <div className="bg-white rounded-[56px] border shadow-sm overflow-hidden">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-slate-50 border-b">
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</th>
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Email</th>
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Access Tier</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-12 py-7 font-black text-slate-800">{u.name}</td>
                  <td className="px-12 py-7 text-sm font-medium text-slate-400">{u.email}</td>
                  <td className="px-12 py-7 text-center"><Badge color={u.role === Role.ADMIN ? 'red' : 'blue'}>{u.role}</Badge></td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>

      {showAdd && (
        <Modal title="Technician Onboarding" onClose={() => setShowAdd(false)}>
           <form onSubmit={handleRegister} className="space-y-10">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity</label>
                 <input required className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold outline-none focus:ring-8 focus:ring-blue-50 transition-all" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Technician Name" />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Address</label>
                 <input required type="email" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold outline-none focus:ring-8 focus:ring-blue-50 transition-all" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="username@gmis.sch.id" />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permission Cluster</label>
                 <select className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold outline-none" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                    <option value={Role.SUPPORT}>Operations Technician</option>
                    <option value={Role.ADMIN}>System Administrator</option>
                 </select>
              </div>
              <button className="w-full bg-slate-900 text-white font-black py-6 rounded-[32px] shadow-2xl hover:bg-slate-800 transition-all text-sm uppercase tracking-widest">Initialize Access</button>
           </form>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-2xl rounded-[64px] shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="px-14 py-12 border-b flex justify-between items-center bg-slate-50/30">
        <h3 className="text-3xl font-black tracking-tighter uppercase">{title}</h3>
        <button onClick={onClose} className="w-14 h-14 rounded-full hover:bg-white hover:shadow-xl flex items-center justify-center text-slate-300 transition-all border border-transparent hover:border-slate-100">✕</button>
      </div>
      <div className="p-14 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const StaffLayout = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const currentPath = window.location.hash.split('?')[0];
  const [toast, setToast] = useState<string | null>(null);

  const SidebarItem = ({ to, icon: Icon, label }: any) => {
    const isActive = currentPath.includes(to);
    return (
      <Link to={to} className={`flex items-center space-x-5 px-8 py-6 rounded-[28px] transition-all ${isActive ? 'bg-slate-900 text-white shadow-2xl scale-[1.03]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
        <Icon className="w-6 h-6" />
        <span className="font-black text-[12px] uppercase tracking-widest">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <aside className="w-88 border-r bg-white hidden lg:flex flex-col p-10 space-y-4 shrink-0">
        <SidebarItem to="/staff/dashboard" icon={DashboardIcon} label="Dashboard" />
        <SidebarItem to="/staff/tickets" icon={TicketIcon} label="Case Records" />
        {user.role === Role.ADMIN && <SidebarItem to="/staff/users" icon={UsersIcon} label="Technicians" />}
        {user.role === Role.ADMIN && <SidebarItem to="/staff/settings" icon={CheckIcon} label="System Config" />}
        
        <div className="mt-auto pt-10 border-t flex flex-col space-y-8">
          <div className="flex items-center space-x-5 p-6 bg-slate-50 rounded-[36px] border border-slate-100 shadow-inner">
             <div className="w-14 h-14 rounded-[20px] bg-white shadow-md flex items-center justify-center font-black text-blue-600 text-xl">{user.name.charAt(0)}</div>
             <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black uppercase text-slate-900 truncate tracking-tight">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.role}</p>
             </div>
          </div>
          <button onClick={onLogout} className="flex items-center space-x-4 text-rose-500 font-black text-[12px] uppercase tracking-widest p-6 hover:bg-rose-50 rounded-[28px] transition-all group">
            <LogoutIcon className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t z-[60] flex justify-around p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[40px]">
         <Link to="/staff/dashboard" className="p-4 bg-slate-50 rounded-3xl"><DashboardIcon className="w-8 h-8 text-slate-400" /></Link>
         <Link to="/staff/tickets" className="p-4 bg-slate-50 rounded-3xl"><TicketIcon className="w-8 h-8 text-slate-400" /></Link>
         <button onClick={onLogout} className="p-4 bg-rose-50 rounded-3xl"><LogoutIcon className="w-8 h-8 text-rose-400" /></button>
      </div>

      <main className="flex-1 overflow-y-auto p-8 sm:p-14 pb-32 lg:pb-14 bg-slate-50/40">
         <div className="max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/dashboard" element={<StaffDashboard />} />
              <Route path="/tickets" element={<StaffTicketList setGlobalToast={setToast} />} />
              <Route path="/tickets/:id" element={<StaffTicketDetail setGlobalToast={setToast} />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/settings" element={<AdminSettings />} />
            </Routes>
         </div>
      </main>
      {toast && <NotificationToast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());

  useEffect(() => { 
    const s = localStorage.getItem('logged_user'); 
    if (s) setUser(JSON.parse(s)); 
    setSettings(db.getSettings());
  }, []);

  const refreshSettings = () => setSettings(db.getSettings());

  const handleLogin = (u: User) => { 
    setUser(u); 
    localStorage.setItem('logged_user', JSON.stringify(u)); 
    window.location.hash = '/staff/dashboard'; 
  };
  
  const handleLogout = () => { 
    setUser(null); 
    localStorage.removeItem('logged_user'); 
    window.location.hash = '/portal'; 
  };

  return (
    <ThemeContext.Provider value={{ settings, refresh: refreshSettings }}>
      <HashRouter>
        <div className="h-full flex flex-col bg-[#f8fafc] text-slate-900">
          <Routes>
            <Route path="/" element={<Navigate to="/portal" />} />
            <Route path="/portal" element={<PortalPage onLogin={handleLogin} />} />
            <Route path="/submit" element={<TicketForm setGlobalToast={(m) => console.log(m)} />} />
            <Route path="/staff/*" element={user ? <StaffLayout user={user} onLogout={handleLogout} /> : <Navigate to="/portal" />} />
          </Routes>
        </div>
      </HashRouter>
    </ThemeContext.Provider>
  );
};

const NotificationToast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed bottom-32 lg:bottom-14 right-14 z-[100] animate-in slide-in-from-right-10 duration-400">
      <div className="bg-slate-900 text-white px-12 py-7 rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.3)] flex items-center space-x-6 border border-white/5 ring-12 ring-black/5">
        <div className="w-4 h-4 rounded-full bg-blue-400 animate-pulse" />
        <p className="text-sm font-black tracking-tight max-w-xs">{message}</p>
        <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity p-2 text-xl">✕</button>
      </div>
    </div>
  );
};

export default App;
