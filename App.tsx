
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
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { suggestSolution } from './services/geminiService';

const GMIS_LOGO_URL = "https://lh3.googleusercontent.com/d/1Gi0EJzM7Ng9R3QXwZaUUpBxdGE1P-LfI";

// --- Theme & Settings Context ---
const ThemeContext = createContext<{ settings: AppSettings, refresh: () => void }>({ 
  settings: db.getSettings(), 
  refresh: () => {} 
});

// --- Mock Notification Engine ---
const triggerNotification = (type: 'create' | 'update' | 'assign' | 'close', ticket: Ticket, settings: AppSettings, setToast: (m: string) => void) => {
  const { notifications, emailConfig } = settings;
  let message = "";
  let shouldSend = false;

  switch (type) {
    case 'create':
      if (notifications.notifyOnCreation) {
        shouldSend = true;
        message = `MAIL SENT: [#${ticket.id}] New Support Case registered for ${ticket.createdBy.name}. Notification dispatched via ${emailConfig.smtpHost}.`;
      }
      break;
    case 'assign':
      if (notifications.notifyOnAssignment) {
        shouldSend = true;
        message = `INTERNAL ALERT: Case [#${ticket.id}] has been assigned to a technician. Staff notified.`;
      }
      break;
    case 'update':
      if (notifications.notifyOnStatusChange) {
        shouldSend = true;
        message = `STATUS UPDATE: [#${ticket.id}] transitioned to ${ticket.status}. Submitter notified at ${ticket.createdBy.email}.`;
      }
      break;
    case 'close':
      if (notifications.notifyOnResolution) {
        shouldSend = true;
        message = `CASE RESOLVED: [#${ticket.id}] Resolution confirmed. Closing notification sent via ${emailConfig.senderName}.`;
      }
      break;
  }

  if (shouldSend) {
    setToast(message);
    console.log(`%c[SMTP RELAY: ${emailConfig.smtpHost}] %c${message}`, "color: #3b82f6; font-weight: bold", "color: #64748b");
  }
};

// --- Shared Components ---

const Logo = ({ className = "h-12 w-auto" }) => (
  <img src={GMIS_LOGO_URL} alt="GMIS Logo" className={className} />
);

const Badge = ({ children, color = 'blue' }: { children?: React.ReactNode, color?: string }) => {
  const colors: Record<string, string> = {
    blue: `bg-blue-50 text-blue-600 border-blue-100`,
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    orange: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return <span className={`px-2 py-0.5 rounded text-[9px] lg:text-[10px] font-black uppercase tracking-widest border ${colors[color] || colors.slate}`}>{children}</span>;
};

const GlobalHeader = ({ hidePortalLink = false }) => {
  return (
    <header className="bg-white/80 border-b border-slate-100 py-3 lg:py-4 px-4 lg:px-10 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl shadow-sm">
      <div className="flex items-center space-x-3 lg:space-x-4">
        <Logo className="h-8 lg:h-12 w-auto" />
        <div className="flex flex-col">
          <h1 className="text-[10px] lg:text-sm font-black text-slate-900 tracking-tighter uppercase leading-none">Gandhi Memorial</h1>
          <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 tracking-[0.1em] mt-0.5">IT Support Portal</p>
        </div>
      </div>
      {!hidePortalLink && (
        <Link to="/portal" className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all border border-slate-200 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl">
          Portal
        </Link>
      )}
    </header>
  );
};

// --- View: Login & Portal ---

const PortalPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { settings } = useContext(ThemeContext);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.getUsers().find(u => u.email === email && u.password === password);
    if (user) onLogin(user);
    else setError('Invalid access credentials.');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 lg:p-6 bg-[#f8fafc] overflow-y-auto">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[100px] pointer-events-none opacity-40"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[80px] pointer-events-none opacity-40"></div>

      <div className="max-w-xl w-full relative z-10 animate-in fade-in zoom-in-95 duration-700 py-10">
        <div className="bg-white rounded-[40px] lg:rounded-[56px] shadow-[0_32px_80px_rgba(0,0,0,0.06)] border border-white overflow-hidden">
          
          <div className="bg-white p-8 lg:p-14 text-center space-y-6 lg:space-y-10 border-b border-slate-50">
            <Logo className="h-16 lg:h-24 mx-auto" />
            <div className="space-y-3 lg:space-y-4">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tighter leading-tight text-slate-900">Need Support?</h2>
              <p className="text-slate-500 text-xs lg:text-sm font-medium leading-relaxed max-w-xs mx-auto"> Gandhi Memorial Intercontinental School staff and students can raise technical cases here.</p>
            </div>
            <Link to="/submit" style={{ backgroundColor: settings.themeColor }} className="inline-flex items-center space-x-3 lg:space-x-4 text-white px-8 lg:px-12 py-4 lg:py-6 rounded-[24px] lg:rounded-[32px] font-black text-xs lg:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all group uppercase tracking-widest">
              <span>Raise Support Case</span>
              <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="p-8 lg:p-14 space-y-8 lg:space-y-12 bg-slate-50/30">
            <div className="text-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Staff Login</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 lg:space-y-6">
              <input required className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder-slate-300 text-sm" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email / ID" />
              <input required type="password" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder-slate-300 text-sm" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
              {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{error}</p>}
              <button className="w-full bg-slate-900 text-white font-black py-4 lg:py-5 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98] text-sm uppercase tracking-widest">Secure Login</button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
               <span className="text-[8px] lg:text-[9px] font-bold text-slate-300 uppercase tracking-widest">GMIS IT OPERATIONS v2.5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Ticket Form (Shared) ---

const TicketForm = ({ isManual = false, onComplete, setGlobalToast }: { isManual?: boolean, onComplete?: () => void, setGlobalToast?: (m: string) => void }) => {
  const { settings } = useContext(ThemeContext);
  const [formData, setFormData] = useState<any>({
    name: '', email: '', title: '', category: settings.categories[0],
    description: '', priority: Priority.MEDIUM, requesterType: RequesterType.TEACHER,
    grade: GRADES[0], section: SECTIONS[0], customData: {},
    studentName: '' // Initialize student name
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const showGradeSection = [RequesterType.STUDENT, RequesterType.PARENT].includes(formData.requesterType);
  const showStudentName = formData.requesterType === RequesterType.PARENT;

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
    
    if (setGlobalToast) {
      triggerNotification('create', newTicket, settings, setGlobalToast);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-6 ${isManual ? '' : 'min-h-screen bg-[#f8fafc]'}`}>
        <div className={`max-w-md w-full bg-white ${isManual ? '' : 'p-12 rounded-[56px] shadow-2xl border'} space-y-6`}>
           <div className="w-16 h-16 lg:w-20 lg:h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto"><CheckIcon className="w-10 h-10" /></div>
           <h2 className="text-2xl font-black">Success</h2>
           <p className="text-slate-500 text-sm">Case [#${ticketId}] has been successfully recorded. Notifications have been dispatched.</p>
           <button 
             onClick={() => isManual && onComplete ? onComplete() : setIsSubmitted(false)} 
             style={{ backgroundColor: settings.themeColor }} 
             className="w-full py-4 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs"
           >
             {isManual ? 'Return to Dashboard' : 'Raise Another Request'}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isManual ? '' : 'min-h-screen bg-[#f8fafc]'}`}>
      {!isManual && <GlobalHeader />}
      <div className={`max-w-4xl mx-auto w-full ${isManual ? '' : 'p-4 lg:p-10 pb-20'}`}>
        <div className={`bg-white ${isManual ? '' : 'rounded-[40px] lg:rounded-[56px] shadow-2xl border border-white'} overflow-hidden`}>
          {!isManual && (
            <div className="bg-slate-50 p-8 lg:p-12 text-slate-900 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase">Support Request</h2>
                <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Submit details for technical assistance</p>
              </div>
              <Logo className="h-12 lg:h-16 w-auto" />
            </div>
          )}
          <form onSubmit={handleSubmit} className={`${isManual ? 'space-y-6' : 'p-8 lg:p-14 space-y-8'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity</label>
                <select className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" value={formData.requesterType} onChange={e => setFormData({...formData, requesterType: e.target.value as RequesterType})}>
                  {Object.values(RequesterType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input required className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none placeholder-slate-300" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
              </div>
            </div>

            {showStudentName && (
              <div className="space-y-2 animate-in slide-in-from-top-4">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Name</label>
                <input required className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none placeholder-slate-300" value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} placeholder="e.g. Jane Doe" />
              </div>
            )}

            {showGradeSection && (
              <div className="grid grid-cols-2 gap-6 lg:gap-10 animate-in slide-in-from-top-4">
                 <div className="space-y-2"><label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade</label>
                 <select className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                 <div className="space-y-2"><label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                 <select className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>{SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
              <input required type="email" className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none placeholder-slate-300" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="staff@gmis.sch.id" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <select className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                <select className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})}>
                  {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Dynamic Custom Fields */}
            {settings.customFields && settings.customFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                {settings.customFields.map(field => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                    {field.type === FieldType.DROPDOWN ? (
                      <select 
                        required={field.required}
                        className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none"
                        value={formData.customData[field.id] || ''}
                        onChange={e => setFormData({...formData, customData: {...formData.customData, [field.id]: e.target.value}})}
                      >
                        <option value="">Select Option...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input 
                        required={field.required}
                        className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none placeholder-slate-300"
                        value={formData.customData[field.id] || ''}
                        onChange={e => setFormData({...formData, customData: {...formData.customData, [field.id]: e.target.value}})}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Summary</label>
              <input required className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none placeholder-slate-300" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Printer in Room 201 not responding" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Description</label>
              <textarea required rows={4} className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none placeholder-slate-300" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Please provide specific details..." />
            </div>

            <button type="submit" style={{ backgroundColor: settings.themeColor }} className="w-full text-white font-black py-4 lg:py-5 rounded-[24px] lg:rounded-[28px] text-sm lg:text-lg shadow-2xl hover:opacity-90 transition-all active:scale-[0.98] uppercase tracking-widest">
              {isManual ? 'Register Case' : 'Transmit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- View: Dashboard & Staff Portal ---

const StaffDashboard = () => {
  const navigate = useNavigate();
  const tickets = db.getTickets();
  
  const stats = {
    open: tickets.filter(t => t.status === TicketStatus.OPEN).length,
    active: tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
    resolved: tickets.filter(t => t.status === TicketStatus.CLOSED).length,
    critical: tickets.filter(t => t.priority === Priority.CRITICAL && t.status !== TicketStatus.CLOSED).length
  };

  const statusData = [
    { name: 'Incoming', value: stats.open, color: '#3b82f6', key: TicketStatus.OPEN },
    { name: 'Active', value: stats.active, color: '#f59e0b', key: TicketStatus.IN_PROGRESS },
    { name: 'Resolved', value: stats.resolved, color: '#10b981', key: TicketStatus.CLOSED },
  ];

  const handleDrilldown = (type: string, val: string) => navigate(`/staff/tickets?${type}=${val}`);

  return (
    <div className="space-y-8 lg:space-y-12 pb-12 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl lg:text-5xl font-black tracking-tighter">Ops Center</h2>
        <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 lg:mt-3">Real-time Infrastructure Monitoring</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        <StatCard label="Triage" val={stats.open} color="text-blue-600" onClick={() => handleDrilldown('status', TicketStatus.OPEN)} />
        <StatCard label="Critical" val={stats.critical} color="text-rose-600" onClick={() => handleDrilldown('priority', Priority.CRITICAL)} />
        <StatCard label="Resolved" val={stats.resolved} color="text-emerald-600" onClick={() => handleDrilldown('status', TicketStatus.CLOSED)} />
        <StatCard label="SLA" val={`${Math.round((stats.resolved / Math.max(tickets.length, 1)) * 100)}%`} color="text-slate-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        <div className="lg:col-span-2 bg-white p-6 lg:p-12 rounded-[32px] lg:rounded-[56px] shadow-sm border space-y-8">
           <h3 className="text-xl lg:text-2xl font-black">Volume Trends</h3>
           <div className="h-[250px] lg:h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[{d:'M',c:4},{d:'T',c:7},{d:'W',c:5},{d:'T',c:12},{d:'F',c:9}]}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="d" axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                 <YAxis axisLine={false} tickLine={false} fontSize={10} />
                 <Tooltip />
                 <Area type="monotone" dataKey="c" stroke="#3b82f6" strokeWidth={4} fill="#3b82f6" fillOpacity={0.05} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white p-6 lg:p-12 rounded-[32px] lg:rounded-[56px] shadow-sm border flex flex-col items-center">
           <h3 className="text-xl lg:text-2xl font-black w-full mb-8 text-center">Lifecycle</h3>
           <div className="h-[200px] lg:h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                    {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-8 space-y-3 w-full">
             {statusData.map(s => (
               <div key={s.name} onClick={() => handleDrilldown('status', s.key)} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border group">
                 <div className="flex items-center space-x-3">
                   <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">{s.name}</span>
                 </div>
                 <span className="text-lg font-black">{s.value}</span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, color, onClick }: any) => (
  <div onClick={onClick} className={`bg-white p-5 lg:p-10 rounded-[28px] lg:rounded-[48px] border transition-all shadow-sm ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-xl active:scale-95' : ''}`}>
    <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className={`text-3xl lg:text-6xl font-black mt-2 lg:mt-4 tracking-tighter ${color}`}>{val}</p>
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
    category: params.get('category') || 'ALL'
  });

  useEffect(() => { setTickets(db.getTickets()); }, [showManualCreate]);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = filters.status === 'ALL' || t.status === filters.status;
      const matchPriority = filters.priority === 'ALL' || t.priority === filters.priority;
      const matchCategory = filters.category === 'ALL' || t.category === filters.category;
      const matchSearch = t.title.toLowerCase().includes(filters.search.toLowerCase()) || t.id.toLowerCase().includes(filters.search.toLowerCase());
      return matchStatus && matchPriority && matchCategory && matchSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, filters]);

  return (
    <div className="space-y-6 lg:space-y-10 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
           <h2 className="text-3xl lg:text-4xl font-black tracking-tighter">Case Records</h2>
           <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Centralized Database</p>
        </div>
        <button onClick={() => setShowManualCreate(true)} className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-[20px] lg:rounded-[28px] font-black text-[10px] lg:text-[11px] uppercase tracking-widest shadow-2xl flex items-center justify-center space-x-3 active:scale-95 hover:bg-slate-800 transition-all">
           <PlusIcon className="w-5 h-5 lg:w-6 lg:h-6" /><span>Manual Entry</span>
        </button>
      </div>

      <div className="bg-white p-5 lg:p-8 rounded-[32px] lg:rounded-[48px] shadow-sm border space-y-6 lg:space-y-8">
        <div className="relative">
          <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 lg:w-6 lg:h-6" />
          <input className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] lg:rounded-[32px] font-bold focus:ring-8 focus:ring-blue-50 outline-none transition-all text-sm lg:text-lg" placeholder="Search Master ID or Title..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <FilterSelect label="Status" val={filters.status} options={[{v:'ALL', l:'All'}, {v:TicketStatus.OPEN, l:'Open'}, {v:TicketStatus.IN_PROGRESS, l:'Active'}, {v:TicketStatus.CLOSED, l:'Resolved'}]} onChange={v => setFilters({...filters, status: v})} />
           <FilterSelect label="Urgency" val={filters.priority} options={[{v:'ALL', l:'All'}, ...Object.values(Priority).map(p => ({v:p, l:p}))]} onChange={v => setFilters({...filters, priority: v})} />
           <FilterSelect label="Queue" val={filters.category} options={[{v:'ALL', l:'All'}, ...db.getSettings().categories.map(c => ({v:c, l:c}))]} onChange={v => setFilters({...filters, category: v})} />
        </div>
      </div>

      <div className="bg-white rounded-[32px] lg:rounded-[56px] border shadow-sm overflow-hidden overflow-x-auto">
         <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b">
                 <th className="px-8 lg:px-12 py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Case Record</th>
                 <th className="px-8 lg:px-12 py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Requester</th>
                 <th className="px-8 lg:px-12 py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Urgency</th>
                 <th className="px-8 lg:px-12 py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-blue-50/40 cursor-pointer transition-all group" onClick={() => window.location.hash = `/staff/tickets/${t.id}`}>
                  <td className="px-8 lg:px-12 py-8">
                    <p className="text-blue-600 font-black text-[10px] mb-1 tracking-widest">{t.id}</p>
                    <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">{t.title}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{t.category}</p>
                  </td>
                  <td className="px-8 lg:px-12 py-8">
                    <p className="text-sm font-bold text-slate-800">{t.createdBy.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{t.requesterType}</p>
                  </td>
                  <td className="px-8 lg:px-12 py-8 text-center">
                    <Badge color={t.priority === Priority.CRITICAL ? 'red' : t.priority === Priority.HIGH ? 'orange' : 'slate'}>{t.priority}</Badge>
                  </td>
                  <td className="px-8 lg:px-12 py-8 text-center">
                    <Badge color={t.status === TicketStatus.OPEN ? 'blue' : t.status === TicketStatus.IN_PROGRESS ? 'orange' : 'green'}>{t.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>

      {showManualCreate && (
        <Modal title="Manual Entry" onClose={() => setShowManualCreate(false)}>
           <TicketForm isManual={true} setGlobalToast={setGlobalToast} onComplete={() => setShowManualCreate(false)} />
        </Modal>
      )}
    </div>
  );
};

const FilterSelect = ({ label, val, options, onChange }: any) => (
  <div className="space-y-1.5 lg:space-y-2">
    <label className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 lg:ml-3">{label}</label>
    <select className="w-full px-3 lg:px-5 py-3 bg-slate-50 border border-slate-100 rounded-[14px] lg:rounded-[20px] font-bold text-[10px] lg:text-xs uppercase outline-none transition-all hover:border-blue-200" value={val} onChange={e => onChange(e.target.value)}>
      {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

// --- View: Admin Settings ---

const AdminSettings = () => {
  const { settings, refresh } = useContext(ThemeContext);
  const [localSettings, setLocalSettings] = useState(settings);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newField, setNewField] = useState({ label: '', type: FieldType.SHORT_TEXT, required: false, optionsStr: '' });

  const save = (updated: AppSettings) => { setLocalSettings(updated); db.saveSettings(updated); refresh(); };

  const addField = () => {
    const field: CustomField = {
      id: Math.random().toString(36).substr(2, 9),
      label: newField.label,
      type: newField.type,
      required: newField.required,
      options: newField.type === FieldType.DROPDOWN ? newField.optionsStr.split(',').map(s => s.trim()) : undefined
    };
    save({ ...localSettings, customFields: [...localSettings.customFields, field] });
    setShowAddCustom(false);
    setNewField({ label: '', type: FieldType.SHORT_TEXT, required: false, optionsStr: '' });
  };

  const removeField = (id: string) => {
    save({ ...localSettings, customFields: localSettings.customFields.filter(f => f.id !== id) });
  };

  return (
    <div className="max-w-4xl space-y-8 lg:space-y-12 animate-in fade-in duration-700 pb-24">
      <div>
        <h2 className="text-3xl lg:text-4xl font-black tracking-tighter">System Console</h2>
        <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Logic and brand orchestration</p>
      </div>

      <div className="bg-white p-8 lg:p-14 rounded-[32px] lg:rounded-[56px] border shadow-sm space-y-8 lg:space-y-12">
         <div className="flex justify-between items-center">
            <h3 className="text-xl lg:text-2xl font-black">Support Request Fields</h3>
            <button onClick={() => setShowAddCustom(true)} className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2">
               <PlusIcon className="w-4 h-4" /><span>Add Field</span>
            </button>
         </div>
         <div className="space-y-4">
            {localSettings.customFields.length === 0 && <p className="text-slate-400 text-sm italic py-4">No additional fields defined.</p>}
            {localSettings.customFields.map(field => (
              <div key={field.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <p className="font-black text-sm">{field.label} {field.required && <span className="text-rose-500">*</span>}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{field.type.replace('_', ' ')}</p>
                </div>
                <button onClick={() => removeField(field.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">✕</button>
              </div>
            ))}
         </div>
      </div>

      <div className="bg-white p-8 lg:p-14 rounded-[32px] lg:rounded-[56px] border shadow-sm space-y-8 lg:space-y-12">
         <h3 className="text-xl lg:text-2xl font-black">Email Relay Config</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SettingInput label="SMTP Host" value={localSettings.emailConfig.smtpHost} onChange={v => save({...localSettings, emailConfig: {...localSettings.emailConfig, smtpHost: v}})} />
            <SettingInput label="Port" value={localSettings.emailConfig.smtpPort} onChange={v => save({...localSettings, emailConfig: {...localSettings.emailConfig, smtpPort: v}})} />
            <SettingInput label="Sender Email" value={localSettings.emailConfig.senderEmail} onChange={v => save({...localSettings, emailConfig: {...localSettings.emailConfig, senderEmail: v}})} />
            <SettingInput label="Display Name" value={localSettings.emailConfig.senderName} onChange={v => save({...localSettings, emailConfig: {...localSettings.emailConfig, senderName: v}})} />
         </div>
      </div>

      <div className="bg-white p-8 lg:p-14 rounded-[32px] lg:rounded-[56px] border shadow-sm space-y-8 lg:space-y-12">
         <h3 className="text-xl lg:text-2xl font-black">Notification Rules</h3>
         <div className="space-y-4">
            <ToggleOption label="Auto-notify on New Case Submission" active={localSettings.notifications.notifyOnCreation} onClick={() => save({...localSettings, notifications: {...localSettings.notifications, notifyOnCreation: !localSettings.notifications.notifyOnCreation}})} />
            <ToggleOption label="Auto-notify on Case Assignment" active={localSettings.notifications.notifyOnAssignment} onClick={() => save({...localSettings, notifications: {...localSettings.notifications, notifyOnAssignment: !localSettings.notifications.notifyOnAssignment}})} />
            <ToggleOption label="Auto-notify on Status Transition" active={localSettings.notifications.notifyOnStatusChange} onClick={() => save({...localSettings, notifications: {...localSettings.notifications, notifyOnStatusChange: !localSettings.notifications.notifyOnStatusChange}})} />
            <ToggleOption label="Auto-notify on Resolution / Closure" active={localSettings.notifications.notifyOnResolution} onClick={() => save({...localSettings, notifications: {...localSettings.notifications, notifyOnResolution: !localSettings.notifications.notifyOnResolution}})} />
         </div>
      </div>

      {showAddCustom && (
        <Modal title="Add Form Field" onClose={() => setShowAddCustom(false)}>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Field Name / Label</label>
                 <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="e.g. Serial Number" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Field Type</label>
                 <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={newField.type} onChange={e => setNewField({...newField, type: e.target.value as FieldType})}>
                    <option value={FieldType.SHORT_TEXT}>Short Text</option>
                    <option value={FieldType.DROPDOWN}>Dropdown</option>
                 </select>
              </div>
              {newField.type === FieldType.DROPDOWN && (
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Options (Comma separated)</label>
                   <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="Opt 1, Opt 2, Opt 3" value={newField.optionsStr} onChange={e => setNewField({...newField, optionsStr: e.target.value})} />
                </div>
              )}
              <div className="flex items-center space-x-4">
                 <input type="checkbox" id="req_toggle" className="w-6 h-6" checked={newField.required} onChange={e => setNewField({...newField, required: e.target.checked})} />
                 <label htmlFor="req_toggle" className="text-sm font-black text-slate-700">Mark as Mandatory</label>
              </div>
              <button onClick={addField} disabled={!newField.label} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50">Create Field</button>
           </div>
        </Modal>
      )}
    </div>
  );
};

const SettingInput = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
     <label className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{label}</label>
     <input className="w-full px-5 py-3 lg:px-6 lg:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm lg:text-base outline-none transition-all focus:ring-4 focus:ring-blue-50" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const ToggleOption = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <div onClick={onClick} className="flex items-center justify-between p-5 lg:p-6 bg-slate-50/50 border border-slate-100 rounded-3xl cursor-pointer hover:bg-white hover:shadow-lg transition-all group">
    <span className="text-xs lg:text-sm font-black text-slate-700 group-hover:text-slate-900">{label}</span>
    <div className={`w-12 h-7 lg:w-14 lg:h-8 rounded-full relative transition-all ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
       <div className={`absolute top-1 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white shadow-sm transition-all ${active ? 'left-6 lg:left-7' : 'left-1'}`} />
    </div>
  </div>
);

const Modal = ({ title, children, onClose }: { title: string, children?: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
    <div className="bg-white w-full max-w-2xl rounded-[40px] lg:rounded-[64px] shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
      <div className="px-8 lg:px-14 py-8 lg:py-12 border-b flex justify-between items-center bg-slate-50/30">
        <h3 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase">{title}</h3>
        <button onClick={onClose} className="w-10 h-10 lg:w-14 lg:h-14 rounded-full hover:bg-white hover:shadow-xl flex items-center justify-center text-slate-300 transition-all border border-transparent hover:border-slate-100 text-xl lg:text-2xl">✕</button>
      </div>
      <div className="p-8 lg:p-14 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

// --- Layout & Root ---

const StaffLayout = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const currentPath = window.location.hash.split('?')[0];
  const [toast, setToast] = useState<string | null>(null);

  const SidebarItem = ({ to, icon: Icon, label }: any) => {
    const isActive = currentPath.includes(to);
    return (
      <Link to={to} className={`flex items-center space-x-4 lg:space-x-5 px-6 lg:px-8 py-4 lg:py-6 rounded-[24px] lg:rounded-[28px] transition-all ${isActive ? 'bg-slate-900 text-white shadow-2xl scale-[1.03]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
        <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
        <span className="font-black text-[10px] lg:text-[12px] uppercase tracking-widest">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <aside className="w-72 lg:w-88 border-r bg-white hidden lg:flex flex-col p-10 space-y-4 shrink-0 overflow-y-auto">
        <div className="pb-10">
           <Logo className="h-12 w-auto" />
        </div>
        <div className="flex-1 space-y-4">
           <SidebarItem to="/staff/dashboard" icon={DashboardIcon} label="Dashboard" />
           <SidebarItem to="/staff/tickets" icon={TicketIcon} label="Case Records" />
           {user.role === Role.ADMIN && <SidebarItem to="/staff/users" icon={UsersIcon} label="Personnel Network" />}
           {user.role === Role.ADMIN && <SidebarItem to="/staff/settings" icon={CheckIcon} label="Settings" />}
        </div>
        
        <div className="pt-10 border-t flex flex-col space-y-6 lg:space-y-8">
          <div className="flex items-center space-x-4 p-5 bg-slate-50 rounded-[28px] border border-slate-100 shadow-inner">
             <div className="w-12 h-12 rounded-[16px] bg-white shadow-md flex items-center justify-center font-black text-blue-600 text-lg">{user.name.charAt(0)}</div>
             <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black uppercase text-slate-900 truncate tracking-tight">{user.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user.role}</p>
             </div>
          </div>
          <button onClick={onLogout} className="flex items-center space-x-3 text-rose-500 font-black text-[11px] uppercase tracking-widest p-5 hover:bg-rose-50 rounded-[24px] transition-all group">
            <LogoutIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t z-[60] flex justify-around items-center p-3 sm:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[32px]">
         <Link to="/staff/dashboard" className={`p-4 rounded-2xl transition-all ${currentPath.includes('dashboard') ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}><DashboardIcon className="w-6 h-6" /></Link>
         <Link to="/staff/tickets" className={`p-4 rounded-2xl transition-all ${currentPath.includes('tickets') ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}><TicketIcon className="w-6 h-6" /></Link>
         {user.role === Role.ADMIN && <Link to="/staff/users" className={`p-4 rounded-2xl transition-all ${currentPath.includes('users') ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}><UsersIcon className="w-6 h-6" /></Link>}
         <button onClick={onLogout} className="p-4 bg-rose-50 text-rose-400 rounded-2xl"><LogoutIcon className="w-6 h-6" /></button>
      </div>

      <main className="flex-1 overflow-y-auto p-5 lg:p-14 pb-28 lg:pb-14 bg-slate-50/40">
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

const StaffTicketDetail = ({ setGlobalToast }: any) => {
  const ticketId = window.location.hash.split('/').pop();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [aiResult, setAiResult] = useState<{ text: string, sources: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<User[]>([]);
  const { settings } = useContext(ThemeContext);

  useEffect(() => {
    if (ticketId) {
      const found = db.getTicketById(ticketId);
      if (found) setTicket(found);
      setStaff(db.getUsers().filter(u => u.role !== Role.COORDINATOR));
    }
  }, [ticketId]);

  const update = (st: TicketStatus) => {
    if(!ticket) return;
    const u = {...ticket, status: st, updatedAt: new Date().toISOString()};
    db.saveTicket(u); setTicket(u);
    triggerNotification(st === TicketStatus.CLOSED ? 'close' : 'update', u, settings, setGlobalToast);
    setGlobalToast(`Transitioned to ${st}`);
  };

  const assign = (id: string) => {
    if(!ticket) return;
    const u = {...ticket, assignedTo: id};
    db.saveTicket(u); setTicket(u);
    triggerNotification('assign', u, settings, setGlobalToast);
    setGlobalToast("Case assignment records updated.");
  };

  if(!ticket) return <div className="p-24 text-center font-black animate-pulse text-slate-300 uppercase tracking-widest">Querying Node...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 pb-10 animate-in slide-in-from-right-12">
       <div className="lg:col-span-2 space-y-8 lg:space-y-12">
          <div className="bg-white p-8 lg:p-20 rounded-[32px] lg:rounded-[64px] shadow-sm border border-slate-50">
             <div className="space-y-10 lg:space-y-14">
               <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                     <p className="text-[10px] lg:text-[11px] font-black text-blue-600 tracking-widest uppercase">{ticket.id}</p>
                     <h2 className="text-3xl lg:text-5xl font-black tracking-tighter text-slate-900 leading-tight">{ticket.title}</h2>
                  </div>
                  <Badge color={ticket.priority === Priority.CRITICAL ? 'red' : 'blue'}>{ticket.priority}</Badge>
               </div>
               
               <div className="space-y-6">
                 <div className="p-8 lg:p-14 bg-slate-50/50 border border-slate-100 rounded-[28px] lg:rounded-[40px] shadow-inner">
                    <p className="text-lg lg:text-2xl leading-relaxed font-medium text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
                 </div>
                 {ticket.customData && Object.keys(ticket.customData).length > 0 && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {settings.customFields.filter(f => ticket.customData?.[f.id]).map(field => (
                        <div key={field.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                           <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">{field.label}</p>
                           <p className="font-bold text-slate-800">{ticket.customData![field.id]}</p>
                        </div>
                      ))}
                   </div>
                 )}
               </div>

               <div className="pt-8 lg:pt-14 border-t border-slate-50 space-y-8">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl lg:text-3xl font-black">AI Diagnosis Terminal</h3>
                     <Badge color="green">Google Search Enabled</Badge>
                  </div>
                  <button onClick={async () => { setLoading(true); const res = await suggestSolution(ticket); setAiResult(res); setLoading(false); }} disabled={loading} className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl lg:rounded-[24px] text-[10px] lg:text-[11px] font-black uppercase tracking-widest shadow-2xl disabled:opacity-50 hover:scale-[1.03] transition-all">
                     {loading ? 'Consulting Global Data...' : 'Initiate Global Analysis'}
                  </button>
                  {aiResult && (
                    <div className="space-y-4 animate-in zoom-in-95">
                      <div className="p-8 lg:p-12 bg-emerald-50 border border-emerald-100 rounded-[28px] lg:rounded-[48px] text-emerald-900 font-medium whitespace-pre-wrap text-base lg:text-lg">
                        {aiResult.text}
                      </div>
                      {aiResult.sources.length > 0 && (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Research Sources</p>
                           <div className="flex flex-wrap gap-2">
                             {aiResult.sources.map((src, i) => (
                               <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black px-4 py-2 bg-white border border-slate-200 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all overflow-hidden truncate max-w-[200px]">
                                 {new URL(src).hostname}
                               </a>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>
                  )}
               </div>
             </div>
          </div>
       </div>
       <div className="space-y-8">
          <div className="bg-white p-8 lg:p-14 rounded-[32px] lg:rounded-[56px] shadow-sm border space-y-8">
             <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Management</h3>
             <div className="space-y-6">
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignee</p>
                   <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none transition-all focus:ring-4 focus:ring-blue-50" value={ticket.assignedTo || ''} onChange={e => assign(e.target.value)}>
                      <option value="">Pending...</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
                <div className="flex flex-col gap-3">
                   {ticket.status !== TicketStatus.CLOSED && <button onClick={() => update(TicketStatus.CLOSED)} className="w-full py-5 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-emerald-700 transition-all">Resolve Case</button>}
                   {ticket.status === TicketStatus.OPEN && <button onClick={() => update(TicketStatus.IN_PROGRESS)} className="w-full py-5 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all">Engage Process</button>}
                   {ticket.status === TicketStatus.CLOSED && <button onClick={() => update(TicketStatus.OPEN)} className="w-full py-5 bg-slate-100 text-slate-500 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest">Reopen</button>}
                </div>
             </div>
          </div>
          <div className="bg-white p-8 lg:p-14 rounded-[32px] lg:rounded-[56px] shadow-sm border space-y-8">
             <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Core Meta</h3>
             <div className="space-y-8">
                <div><p className="text-[8px] lg:text-[9px] font-black text-slate-300 uppercase mb-2">Requester</p><p className="text-lg lg:text-xl font-black text-slate-900">{ticket.createdBy.name}</p></div>
                
                {ticket.studentName && (
                   <div><p className="text-[8px] lg:text-[9px] font-black text-slate-300 uppercase mb-2">Student Name</p><p className="text-lg lg:text-xl font-black text-slate-900">{ticket.studentName}</p></div>
                )}

                <div><p className="text-[8px] lg:text-[9px] font-black text-slate-300 uppercase mb-2">Queue</p><p className="text-lg lg:text-xl font-black text-slate-900">{ticket.category}</p></div>
                <div><p className="text-[8px] lg:text-[9px] font-black text-slate-300 uppercase mb-2">Submission Date</p><p className="text-xs font-bold text-slate-400">{new Date(ticket.createdAt).toLocaleString()}</p></div>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- View: User Management ---

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: Role.SUPPORT, password: 'password' });

  useEffect(() => { setUsers(db.getUsers()); }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const u: User = { 
      ...newUser, 
      id: Math.random().toString(36).substr(2, 9),
    };
    db.saveUser(u);
    setUsers([...users, u]);
    setShowAdd(false);
  };

  return (
    <div className="space-y-8 lg:space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
         <div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tighter">Personnel Network</h2>
            <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized Access Directory</p>
         </div>
         <button onClick={() => setShowAdd(true)} className="w-full sm:w-auto bg-slate-900 text-white px-8 lg:px-10 py-4 lg:py-5 rounded-[20px] lg:rounded-[28px] font-black text-[10px] lg:text-[11px] uppercase tracking-widest flex items-center justify-center space-x-3 shadow-2xl transition-all">
           <PlusIcon className="w-5 h-5" /><span>Add User</span>
         </button>
      </div>
      
      <div className="bg-white rounded-[32px] lg:rounded-[56px] border shadow-sm overflow-hidden overflow-x-auto">
         <table className="w-full text-left min-w-[600px]">
            <thead>
               <tr className="bg-slate-50 border-b">
                  <th className="px-8 lg:px-12 py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                  <th className="px-8 lg:px-12 py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="px-8 lg:px-12 py-6 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Designated Role</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 lg:px-12 py-6 font-black text-slate-800">{u.name}</td>
                  <td className="px-8 lg:px-12 py-6 text-xs lg:text-sm font-medium text-slate-400">{u.email}</td>
                  <td className="px-8 lg:px-12 py-6 text-center">
                    <Badge color={u.role === Role.ADMIN ? 'red' : u.role === Role.COORDINATOR ? 'orange' : 'blue'}>{u.role}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>

      {showAdd && (
        <Modal title="Register User" onClose={() => setShowAdd(false)}>
           <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</label>
                 <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                 <input required type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Designated Role</label>
                 <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                    <option value={Role.ADMIN}>Admin</option>
                    <option value={Role.SUPPORT}>IT Support Staff</option>
                    <option value={Role.COORDINATOR}>Coordinator</option>
                 </select>
              </div>
              <div className="pt-4">
                 <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-xl">Initialize User</button>
              </div>
           </form>
        </Modal>
      )}
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
  const handleLogin = (u: User) => { setUser(u); localStorage.setItem('logged_user', JSON.stringify(u)); window.location.hash = '/staff/dashboard'; };
  const handleLogout = () => { setUser(null); localStorage.removeItem('logged_user'); window.location.hash = '/portal'; };
  return (
    <ThemeContext.Provider value={{ settings, refresh: () => setSettings(db.getSettings()) }}>
      <HashRouter>
        <div className="h-full flex flex-col bg-[#f8fafc] text-slate-900 overflow-x-hidden">
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
  useEffect(() => { const t = setTimeout(onClose, 8000); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed bottom-24 lg:bottom-14 right-4 lg:right-14 z-[100] animate-in slide-in-from-right-10 duration-400 max-w-[calc(100%-2rem)] lg:max-w-md">
      <div className="bg-slate-900 text-white px-8 lg:px-12 py-6 rounded-[28px] lg:rounded-[40px] shadow-2xl flex items-center space-x-4 border border-white/5 ring-8 ring-black/5">
        <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse shrink-0" />
        <p className="text-[11px] lg:text-xs font-black tracking-tight leading-snug flex-1">{message}</p>
        <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity p-2 text-xl shrink-0">✕</button>
      </div>
    </div>
  );
};

export default App;
