
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Activity, Scale, Syringe, User, Plus, Camera, History, Trash2, CheckCircle2, AlertCircle, TrendingDown, Calendar, Crown, ShieldCheck, ChevronRight, LogIn, UserPlus, LogOut, Mail, Lock
} from 'lucide-react';
import { VaccineType, WeightEntry, VaccineDose, UserAccount, TabType } from './types';

// Components defined outside for better structure
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 ${className}`}>
    {children}
  </div>
);

const App: React.FC = () => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('slimtrack_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showModal, setShowModal] = useState<'weight' | 'vaccine' | null>(null);

  // Global Data (Mock Database)
  const [allWeights, setAllWeights] = useState<WeightEntry[]>(() => {
    const saved = localStorage.getItem('slimtrack_db_weights');
    return saved ? JSON.parse(saved) : [];
  });

  const [allDoses, setAllDoses] = useState<VaccineDose[]>(() => {
    const saved = localStorage.getItem('slimtrack_db_doses');
    return saved ? JSON.parse(saved) : [];
  });

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
    if (currentUser) localStorage.setItem('slimtrack_active_user', JSON.stringify(currentUser));
    else localStorage.removeItem('slimtrack_active_user');
  }, [currentUser]);

  useEffect(() => localStorage.setItem('slimtrack_db_weights', JSON.stringify(allWeights)), [allWeights]);
  useEffect(() => localStorage.setItem('slimtrack_db_doses', JSON.stringify(allDoses)), [allDoses]);

  // --- FILTERED DATA FOR CURRENT USER ---
  const userWeights = useMemo(() => 
    allWeights.filter(w => w.userId === currentUser?.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), 
    [allWeights, currentUser]
  );

  const userDoses = useMemo(() => 
    allDoses.filter(d => d.userId === currentUser?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [allDoses, currentUser]
  );

  // --- SUBSCRIPTION LOGIC (7 DAYS) ---
  const daysOfTrial = useMemo(() => {
    if (!currentUser) return 0;
    const start = new Date(currentUser.trialStartedAt).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  }, [currentUser]);

  const isTrialExpired = currentUser && daysOfTrial >= 7 && !currentUser.isSubscribed;

  // --- HANDLERS ---
  const handleLogin = (email: string, pass: string) => {
    const users: UserAccount[] = JSON.parse(localStorage.getItem('slimtrack_db_users') || '[]');
    const found = users.find(u => u.email === email);
    if (found) {
      setCurrentUser(found);
    } else {
      alert("Utilizador não encontrado. Por favor, registe-se.");
    }
  };

  const handleRegister = (name: string, email: string, pass: string, startW: number, targetW: number) => {
    const users: UserAccount[] = JSON.parse(localStorage.getItem('slimtrack_db_users') || '[]');
    if (users.some(u => u.email === email)) {
      alert("Este email já está registado.");
      return;
    }
    const newUser: UserAccount = {
      id: crypto.randomUUID(),
      name,
      email,
      initialWeight: startW,
      targetWeight: targetW,
      startDate: new Date().toISOString(),
      isSubscribed: false,
      trialStartedAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('slimtrack_db_users', JSON.stringify(users));
    setCurrentUser(newUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleAddWeight = (entry: Omit<WeightEntry, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newWeight: WeightEntry = { ...entry, id: crypto.randomUUID(), userId: currentUser.id };
    setAllWeights(prev => [...prev, newWeight]);
    setShowModal(null);
  };

  const handleAddDose = (dose: Omit<VaccineDose, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newDose: VaccineDose = { ...dose, id: crypto.randomUUID(), userId: currentUser.id };
    setAllDoses(prev => [...prev, newDose]);
    setShowModal(null);
  };

  const deleteWeight = (id: string) => setAllWeights(prev => prev.filter(w => w.id !== id));
  const deleteDose = (id: string) => setAllDoses(prev => prev.filter(d => d.id !== id));

  const toggleSubscription = () => {
    if (!currentUser) return;
    const updated = { ...currentUser, isSubscribed: !currentUser.isSubscribed };
    setCurrentUser(updated);
    // Sync with "database"
    const users: UserAccount[] = JSON.parse(localStorage.getItem('slimtrack_db_users') || '[]');
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      users[index] = updated;
      localStorage.setItem('slimtrack_db_users', JSON.stringify(users));
    }
  };

  if (!currentUser) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen pb-24 flex flex-col max-w-md mx-auto relative overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">SlimTrack Pro</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {activeTab === 'dashboard' ? 'Painel' : activeTab === 'weight' ? 'Peso' : activeTab === 'vaccines' ? 'Vacinas' : 'Perfil'}
          </p>
        </div>
        {!currentUser.isSubscribed && (
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${daysOfTrial >= 6 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
            {Math.max(0, 7 - daysOfTrial)} Dias Grátis
          </div>
        )}
        {currentUser.isSubscribed && (
          <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Crown size={12} /> PRO
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {isTrialExpired && <SubscriptionWall onSubscribe={toggleSubscription} />}
        {!isTrialExpired && (
          <>
            {activeTab === 'dashboard' && <Dashboard user={currentUser} weights={userWeights} doses={userDoses} />}
            {activeTab === 'weight' && <WeightManager weights={userWeights} onDelete={deleteWeight} onOpenAdd={() => setShowModal('weight')} />}
            {activeTab === 'vaccines' && <VaccineManager doses={userDoses} onDelete={deleteDose} onOpenAdd={() => setShowModal('vaccine')} />}
            {activeTab === 'profile' && <ProfileManager user={currentUser} setUser={setCurrentUser} weightsCount={userWeights.length} dosesCount={userDoses.length} onLogout={handleLogout} />}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center max-w-md mx-auto safe-bottom z-40">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity size={24} />} label="Início" />
        <NavButton active={activeTab === 'weight'} onClick={() => setActiveTab('weight')} icon={<Scale size={24} />} label="Peso" />
        <div className="relative -top-6">
          <button 
            onClick={() => setShowModal('weight')}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
          >
            <Plus size={28} />
          </button>
        </div>
        <NavButton active={activeTab === 'vaccines'} onClick={() => setActiveTab('vaccines')} icon={<Syringe size={24} />} label="Vacinas" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={24} />} label="Perfil" />
      </nav>

      {/* Modals */}
      {showModal === 'weight' && <WeightModal onClose={() => setShowModal(null)} onSave={handleAddWeight} />}
      {showModal === 'vaccine' && <VaccineModal onClose={() => setShowModal(null)} onSave={handleAddDose} />}
    </div>
  );
};

// --- SUB COMPONENTS ---

const AuthScreen: React.FC<{ 
  mode: 'login' | 'register'; 
  setMode: (m: 'login' | 'register') => void; 
  onLogin: (e: string, p: string) => void;
  onRegister: (n: string, e: string, p: string, sw: number, tw: number) => void;
}> = ({ mode, setMode, onLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [initialW, setInitialW] = useState('80');
  const [targetW, setTargetW] = useState('70');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') onLogin(email, pass);
    else onRegister(name, email, pass, parseFloat(initialW), parseFloat(targetW));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto p-8 justify-center animate-in fade-in duration-500">
      <div className="mb-12 text-center">
        <div className="bg-indigo-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-100">
          <Activity size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">SlimTrack Pro</h1>
        <p className="text-slate-500 mt-2">{mode === 'login' ? 'Bem-vindo de volta!' : 'Crie a sua conta gratuita'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome</label>
            <div className="relative mt-1">
              <User className="absolute left-4 top-3.5 text-slate-300" size={18} />
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome" className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        )}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email</label>
          <div className="relative mt-1">
            <Mail className="absolute left-4 top-3.5 text-slate-300" size={18} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="exemplo@email.com" className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Palavra-passe</label>
          <div className="relative mt-1">
            <Lock className="absolute left-4 top-3.5 text-slate-300" size={18} />
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required placeholder="••••••••" className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Peso Inicial (kg)</label>
              <input type="number" step="0.1" value={initialW} onChange={e => setInitialW(e.target.value)} required className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 mt-1 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Peso Meta (kg)</label>
              <input type="number" step="0.1" value={targetW} onChange={e => setTargetW(e.target.value)} required className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 mt-1 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        )}

        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 mt-4 active:scale-95 transition-transform">
          {mode === 'login' ? 'Entrar' : 'Começar 7 Dias Grátis'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm font-semibold text-indigo-600">
          {mode === 'login' ? 'Não tem conta? Registe-se' : 'Já tem conta? Inicie sessão'}
        </button>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);

const Dashboard: React.FC<{ user: UserAccount; weights: WeightEntry[]; doses: VaccineDose[] }> = ({ user, weights, doses }) => {
  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : user.initialWeight;
  const totalLoss = user.initialWeight - latestWeight;
  const progressPercent = Math.min(100, Math.max(0, ((user.initialWeight - latestWeight) / (user.initialWeight - user.targetWeight)) * 100));

  const chartData = weights.map(w => ({
    date: new Date(w.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
    peso: w.weight
  }));

  const lastDose = doses.length > 0 ? doses[0] : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-indigo-200 shadow-lg">
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider">Peso Atual</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold">{latestWeight.toFixed(1)}</span>
            <span className="text-xs font-medium opacity-80 uppercase">kg</span>
          </div>
        </Card>
        <Card className="bg-white">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Perda Total</p>
          <div className="flex items-baseline gap-1 mt-1 text-emerald-600">
            <TrendingDown size={18} className="inline mr-1" />
            <span className="text-3xl font-bold">{totalLoss.toFixed(1)}</span>
            <span className="text-xs font-medium uppercase">kg</span>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-slate-50">
          <h3 className="font-bold text-slate-800">Evolução de Peso</h3>
          <span className="text-[10px] text-indigo-600 font-bold uppercase bg-indigo-50 px-2 py-0.5 rounded">{weights.length} registos</span>
        </div>
        <div className="h-64 w-full p-4">
          {weights.length < 2 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-2">
              <Calendar size={48} strokeWidth={1} />
              <p className="text-sm">Registe mais pesos para ver o gráfico.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="peso" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPeso)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Objetivo</h3>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
          <div className="bg-indigo-600 h-2 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Início: {user.initialWeight}kg</span>
          <span>Meta: {user.targetWeight}kg</span>
        </div>
      </Card>

      <Card className="flex items-center gap-4">
        <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
          <Syringe size={24} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-sm uppercase">Última Aplicação</h4>
          <p className="text-xs text-slate-500">
            {lastDose ? `${lastDose.type} - ${lastDose.doseMg}mg em ${new Date(lastDose.date).toLocaleDateString()}` : 'Nenhuma toma registada'}
          </p>
        </div>
        <ChevronRight size={20} className="text-slate-300" />
      </Card>
    </div>
  );
};

const WeightManager: React.FC<{ weights: WeightEntry[]; onDelete: (id: string) => void; onOpenAdd: () => void }> = ({ weights, onDelete, onOpenAdd }) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-slate-800">Histórico de Peso</h2>
        <button onClick={onOpenAdd} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl uppercase tracking-wider">Adicionar</button>
      </div>
      
      {weights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
          <Scale size={64} strokeWidth={1} className="opacity-20" />
          <p className="text-sm font-medium">Ainda não há registos de peso.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...weights].reverse().map((entry) => (
            <Card key={entry.id} className="flex items-center gap-4 group hover:border-indigo-100 transition-colors">
              {entry.photoUrl ? (
                <img src={entry.photoUrl} alt="Balança" className="w-16 h-16 rounded-xl object-cover border border-slate-100" />
              ) : (
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200">
                  <Camera size={20} />
                </div>
              )}
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(entry.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</p>
                <p className="text-xl font-bold text-slate-800">{entry.weight.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg</span></p>
              </div>
              <button onClick={() => onDelete(entry.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const VaccineManager: React.FC<{ doses: VaccineDose[]; onDelete: (id: string) => void; onOpenAdd: () => void }> = ({ doses, onDelete, onOpenAdd }) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-slate-800">Histórico de Vacinas</h2>
        <button onClick={onOpenAdd} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl uppercase tracking-wider">Registar</button>
      </div>

      {doses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
          <Syringe size={64} strokeWidth={1} className="opacity-20" />
          <p className="text-sm font-medium">Registe a sua primeira aplicação.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {doses.map((dose) => (
            <Card key={dose.id} className="relative border-l-4 border-l-indigo-600 group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-sm tracking-tight">{dose.type}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(dose.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                </div>
                <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {dose.doseMg}mg
                </div>
              </div>
              {dose.notes && <p className="text-sm text-slate-600 italic mt-2 border-t border-slate-50 pt-2 leading-relaxed">"{dose.notes}"</p>}
              <button onClick={() => onDelete(dose.id)} className="absolute top-2 right-2 p-1 text-slate-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileManager: React.FC<{ user: UserAccount; setUser: (u: UserAccount) => void; weightsCount: number; dosesCount: number; onLogout: () => void }> = ({ user, setUser, weightsCount, dosesCount, onLogout }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center py-4">
        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-3xl flex items-center justify-center text-white mb-4 shadow-2xl shadow-indigo-100 rotate-3">
          <User size={48} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-indigo-600">{weightsCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Pesagens</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-amber-600">{dosesCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Aplicações</p>
        </Card>
      </div>

      <Card className="space-y-4">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-50 pb-2">Definições</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Peso Inicial (kg)</label>
            <input 
              type="number" 
              value={user.initialWeight} 
              onChange={(e) => setUser({...user, initialWeight: parseFloat(e.target.value)})}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Peso Meta (kg)</label>
            <input 
              type="number" 
              value={user.targetWeight} 
              onChange={(e) => setUser({...user, targetWeight: parseFloat(e.target.value)})}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
        </div>
      </Card>

      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-4 rounded-2xl bg-red-50 active:scale-95 transition-transform text-sm uppercase tracking-widest">
        <LogOut size={18} /> Sair da Conta
      </button>

      {!user.isSubscribed ? (
        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none p-6 text-center space-y-4 shadow-xl shadow-indigo-100">
          <div className="inline-flex bg-white/20 p-3 rounded-full">
            <Crown size={32} />
          </div>
          <h3 className="text-lg font-bold">SlimTrack Pro</h3>
          <p className="text-sm text-indigo-100">Desbloqueie fotos ilimitadas e exportação detalhada por 5,00€/mês.</p>
          <button onClick={() => setUser({...user, isSubscribed: true})} className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform">
            Subscrever Agora
          </button>
        </Card>
      ) : (
        <Card className="flex items-center justify-between border-emerald-100 bg-emerald-50/30">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" />
            <div>
              <p className="font-bold text-slate-800 text-sm">PRO Ativo</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Renovação Mensal</p>
            </div>
          </div>
          <button className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-3 py-1 bg-white rounded-lg border border-emerald-100">Gerir</button>
        </Card>
      )}
    </div>
  );
};

// ... (WeightModal, VaccineModal components remain mostly the same, just adjust styles/types) ...

const WeightModal: React.FC<{ onClose: () => void; onSave: (w: Omit<WeightEntry, 'id' | 'userId'>) => void }> = ({ onClose, onSave }) => {
  const [weight, setWeight] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [photo, setPhoto] = useState<string | undefined>();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6 animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Novo Peso</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">X</button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Peso (kg)</label>
              <input 
                autoFocus
                type="number" 
                step="0.1"
                placeholder="00.0"
                value={weight} 
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-3xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Data</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm text-slate-800 font-bold" 
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Foto Balança</label>
            <div className="relative w-28 h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
              {photo ? (
                <img src={photo} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-300">
                  <Camera size={24} />
                  <span className="text-[9px] mt-1 font-bold">CAPTURAR</span>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>

        <button 
          onClick={() => weight && onSave({ weight: parseFloat(weight), date, photoUrl: photo })}
          disabled={!weight}
          className="w-full bg-indigo-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform uppercase tracking-widest text-sm"
        >
          Guardar Registo
        </button>
      </div>
    </div>
  );
};

const VaccineModal: React.FC<{ onClose: () => void; onSave: (v: Omit<VaccineDose, 'id' | 'userId'>) => void }> = ({ onClose, onSave }) => {
  const [type, setType] = useState<VaccineType>(VaccineType.OZEMPIC);
  const [dose, setDose] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6 animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
        <h3 className="text-xl font-bold text-slate-800">Registar Toma</h3>

        <div className="flex gap-2">
          {Object.values(VaccineType).map((v) => (
            <button 
              key={v}
              onClick={() => setType(v)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all uppercase tracking-wider ${type === v ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'border-slate-100 text-slate-400 bg-slate-50'}`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Dose (mg)</label>
            <input 
              type="number" 
              step="0.25"
              placeholder="0.25"
              value={dose} 
              onChange={(e) => setDose(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Data Aplicação</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-800" 
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Notas / Reações</label>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Fadiga leve no primeiro dia"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 h-24 resize-none leading-relaxed"
          ></textarea>
        </div>

        <button 
          onClick={() => dose && onSave({ type, doseMg: parseFloat(dose), date, notes })}
          disabled={!dose}
          className="w-full bg-indigo-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform uppercase tracking-widest text-sm"
        >
          Confirmar Toma
        </button>
      </div>
    </div>
  );
};

const SubscriptionWall: React.FC<{ onSubscribe: () => void }> = ({ onSubscribe }) => (
  <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
    <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-200">
      <Crown size={40} />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-3">7 Dias Grátis Concluídos</h2>
    <p className="text-slate-500 mb-8 leading-relaxed text-sm">
      Obrigado por utilizar o SlimTrack Pro. Para continuar a guardar os seus históricos de vacinas e fotos de peso, subscreva o acesso ilimitado.
    </p>

    <div className="w-full space-y-3 mb-8">
      {[
        "Histórico ilimitado de vacinas",
        "Backup de fotos da balança",
        "Gráficos de evolução avançados",
        "Suporte prioritário"
      ].map((feat, idx) => (
        <div key={idx} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl text-left border border-slate-100">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{feat}</span>
        </div>
      ))}
    </div>

    <button 
      onClick={onSubscribe}
      className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-colors mb-4 uppercase tracking-widest text-sm"
    >
      Subscrever - 5,00€ / mês
    </button>
    
    <p className="text-[10px] text-slate-400 font-bold uppercase">Cancele quando quiser na Google Play</p>
  </div>
);

export default App;
