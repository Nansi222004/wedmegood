import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { OpsContext, createOpsApi, can } from './opsApi';
import { Btn, Spinner } from './ui';
import { inputClass } from './tokens';
import PageLoader from '../../components/common/PageLoader';

const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventRoom = lazy(() => import('./pages/EventRoom'));
const StockPage = lazy(() => import('./pages/StockPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const WorkforcePage = lazy(() => import('./pages/WorkforcePage'));
const MyWorkPage = lazy(() => import('./pages/MyWorkPage'));

/** Loads "who am I" for a token and provides the ops context to the pages below */
function useOpsSession(getToken, basePath) {
  const api = useMemo(() => createOpsApi(getToken), [getToken]);
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true;
    api.me().then(r => alive && setMe(r.data)).catch(err => alive && setError(err));
    return () => { alive = false; };
  }, [api]);
  return { value: me ? { api, me, basePath } : null, error };
}

// ---------------------------------------------------------------------------------------------
// Owner: inside the vendor panel at /vendor/ops/*
// ---------------------------------------------------------------------------------------------

const getVendorToken = () => localStorage.getItem('vendorToken');

export const OwnerOps = () => {
  const { value, error } = useOpsSession(getVendorToken, '/vendor/ops');
  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-2">
        <p className="text-[13px] text-slate-700">{error.message}</p>
        {error.data?.subscriptionRequired && <p className="text-[11px] text-slate-500">Event operations open once your account is approved and your subscription is active.</p>}
      </div>
    );
  }
  if (!value) return <Spinner />;
  return (
    <OpsContext.Provider value={value}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="events" replace />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventRoom />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="workforce" element={<WorkforcePage />} />
          <Route path="*" element={<Navigate to="events" replace />} />
        </Routes>
      </Suspense>
    </OpsContext.Provider>
  );
};

// ---------------------------------------------------------------------------------------------
// Team members: their own app at /team/*
// ---------------------------------------------------------------------------------------------

const TEAM_TOKEN = 'teamToken';
const getTeamToken = () => localStorage.getItem(TEAM_TOKEN);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const TeamLogin = () => {
  const navigate = useNavigate();
  const [f, setF] = useState({ phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/ops/team/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem(TEAM_TOKEN, data.token);
      navigate('/team', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-600">Utsavo Team</p>
          <h1 className="text-[20px] font-semibold text-slate-900 mt-1">Log in to your work</h1>
          <p className="text-[12px] text-slate-500">Use the mobile number and password your employer gave you.</p>
        </div>
        <input className={inputClass} inputMode="numeric" maxLength={10} placeholder="Mobile number" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} />
        <input className={inputClass} type="password" placeholder="Password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        {error && <p className="text-[12px] text-rose-600">{error}</p>}
        <Btn className="w-full py-3" disabled={busy || f.phone.length !== 10 || !f.password}>{busy ? 'Logging in...' : 'Log in'}</Btn>
        <p className="text-[10px] text-slate-400 text-center">Business owner? <a href="/vendor/login" className="text-violet-700 font-semibold">Vendor login</a></p>
      </form>
    </div>
  );
};

const TeamLayout = () => {
  const navigate = useNavigate();
  const { value, error } = useOpsSession(getTeamToken, '/team');
  const logout = () => { localStorage.removeItem(TEAM_TOKEN); navigate('/team/login', { replace: true }); };

  useEffect(() => {
    if (error?.status === 401) logout();
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error && error.status !== 401) {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center"><p className="text-[13px] text-slate-700">{error.message}</p><Btn variant="ghost" onClick={logout}>Log out</Btn></div>;
  }
  if (!value) return <Spinner />;
  const { me } = value;
  const nav = [
    ['/team', 'My work', true],
    ['/team/events', 'Events', can(me, 'events.view')],
    ['/team/stock', 'Stock', can(me, 'stock.view')],
    ['/team/accounts', 'Accounts', can(me, 'finance.view')],
    ['/team/workforce', 'Workers', can(me, 'tasks.manage')]
  ].filter(n => n[2]);

  return (
    <OpsContext.Provider value={value}>
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{me.business.name}</p>
              <p className="text-[10px] text-slate-400">{me.name} · {me.role === 'SubVendor' ? 'Sub-vendor' : me.role}</p>
            </div>
            <button onClick={logout} className="text-[12px] font-semibold text-slate-500 cursor-pointer">Log out</button>
          </div>
          {nav.length > 1 && (
            <nav className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar pb-2">
              {nav.map(([to, label]) => (
                <NavLink key={to} to={to} end={to === '/team'} className={({ isActive }) => `px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap ${isActive ? 'bg-violet-600 text-white' : 'text-slate-600 bg-slate-100'}`}>{label}</NavLink>
              ))}
            </nav>
          )}
        </header>
        <main className="max-w-5xl mx-auto px-3 py-4">
          <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
        </main>
      </div>
    </OpsContext.Provider>
  );
};

const RequireTeamLogin = ({ children }) => (getTeamToken() ? children : <Navigate to="/team/login" replace />);

export const TeamApp = () => (
  <Routes>
    <Route path="login" element={getTeamToken() ? <Navigate to="/team" replace /> : <TeamLogin />} />
    <Route element={<RequireTeamLogin><TeamLayout /></RequireTeamLogin>}>
      <Route index element={<MyWorkPage />} />
      <Route path="events" element={<EventsPage />} />
      <Route path="events/:id" element={<EventRoom />} />
      <Route path="stock" element={<StockPage />} />
      <Route path="accounts" element={<AccountsPage />} />
      <Route path="workforce" element={<WorkforcePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/team" replace />} />
  </Routes>
);
