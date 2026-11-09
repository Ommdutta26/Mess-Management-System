
import { useState, useEffect, useCallback } from 'react';
import {
  NavLink,
  Navigate,
  Route,
  Routes
} from 'react-router-dom';

import { api, setToken } from './api.js';
import { Ctx } from './ctx.js';

import {
  Today,
  MenuPage,
  Meals,
  Wallet,
  Feedback
} from './pages.jsx';

import {
  Overview,
  Counter,
  Records,
  Notice,
  Inventory
} from './staff.jsx';

const PERM = {
  head: ['cnt', 'acc', 'head'],
  counter: ['cnt'],
  accounts: ['acc']
};

// ==================== LOGIN COMPONENT ====================

function Login({ onAuth }) {
  const [staff, setStaff] = useState(false);
  const [reg, setReg] = useState(false);
  const [err, setErr] = useState('');

  const [f, setF] = useState({
    id: '',
    password: '',
    name: '',
    room: ''
  });

  const set = key => e => {
    setF(prev => ({
      ...prev,
      [key]: e.target.value
    }));
  };

  const submit = async e => {
    e.preventDefault();
    setErr('');

    try {
      const d = await api(
        reg ? '/auth/register' : '/auth/login',
        {
          method: 'POST',
          body: { ...f, staff }
        }
      );

      setToken(d.token);
      onAuth(d.user);
    } catch (x) {
      setErr(x.message || 'Something went wrong');
    }
  };

  return (
    <div id="login">
      <div className="lcard">

        <div className="lart">
          <span className="badge big">
            <img
              src="/logo.png"
              alt="IIIT Bhubaneswar logo"
            />
          </span>

          <h2>Mess Hub</h2>

          <p>
            Book meals, track your bill and share feedback,
            all in one place.
          </p>
        </div>

        <form id="lf" onSubmit={submit}>
          <h2>
            {reg ? 'Create student account' : 'Sign in'}
          </h2>

          <div
            className="seg"
            style={{ marginBottom: 14 }}
          >
            <button
              type="button"
              className={staff ? '' : 'on'}
              onClick={() => setStaff(false)}
            >
              Student
            </button>

            <button
              type="button"
              className={staff ? 'on' : ''}
              onClick={() => {
                setStaff(true);
                setReg(false);
              }}
            >
              Mess office
            </button>
          </div>

          {reg && (
            <>
              <label>
                Full name
                <input
                  value={f.name}
                  onChange={set('name')}
                  required
                />
              </label>

              <label>
                Hostel and room
                <input
                  value={f.room}
                  onChange={set('room')}
                  required
                />
              </label>
            </>
          )}

          <label>
            ID
            <input
              required
              value={f.id}
              onChange={set('id')}
              autoComplete="username"
              placeholder="Roll number, e.g. B2024CSE045"
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              minLength={6}
              value={f.password}
              onChange={set('password')}
              autoComplete={
                reg ? 'new-password' : 'current-password'
              }
            />
          </label>

          <p id="lerr" role="alert">
            {err}
          </p>

          <button className="btn" type="submit">
            {reg ? 'Create account' : 'Sign in'}
          </button>

          {!reg && (
            <p className="demo">
              Demo: B2024CSE045 / student@123.
              Mess office tab: ADMIN / admin@123,
              COUNTER01 or ACCOUNTS01 / staff@123
            </p>
          )}

          {!staff && (
            <button
              type="button"
              className="link"
              onClick={() => {
                setReg(!reg);
                setErr('');
              }}
            >
              {reg
                ? 'Already registered? Sign in'
                : 'New student? Create an account'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

// ==================== MAIN APP COMPONENT ====================

export default function App() {
  const [user, setUser] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [ready, setReady] = useState(false);

  const [toasts, setToasts] = useState([]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  // ==================== TOAST NOTIFICATIONS ====================

  const toast = useCallback(message => {
    const id = Math.random();

    setToasts(prev => [
      ...prev,
      { id, m: message }
    ]);

    setTimeout(() => {
      setToasts(prev =>
        prev.filter(t => t.id !== id)
      );
    }, 3100);
  }, []);

  // ==================== API RUNNER ====================

  const run = useCallback(async (fn, ok) => {
    try {
      await fn();

      if (ok) {
        toast(ok);
      }

      return true;
    } catch (e) {
      toast(e.message || 'Something went wrong');
      return false;
    }
  }, [toast]);

  // ==================== NOTIFICATIONS ====================

  const loadNotifs = useCallback(async () => {
    try {
      const d = await api('/notifications');
      setNotifs(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifs();
    } else {
      setNotifs([]);
    }
  }, [user, loadNotifs]);

  const markRead = async id => {
    const success = await run(() =>
      api(`/notifications/${id}/read`, {
        method: 'POST'
      })
    );

    if (success) {
      await loadNotifs();
    }
  };

  // ==================== INITIAL CONFIGURATION ====================

  useEffect(() => {
    const initialize = async () => {
      try {
        const config = await api('/config');
        setCfg(config);
      } catch (e) {
        console.error('Config loading failed:', e);
      }

      try {
        const currentUser = await api('/me');
        setUser(currentUser);
      } catch (e) {
        // User is not authenticated.
        setUser(null);
      } finally {
        setReady(true);
      }
    };

    initialize();
  }, []);

  // ==================== BODY CLASS ====================

  useEffect(() => {
    document.body.classList.toggle(
      'admin',
      user?.role === 'staff'
    );

    return () => {
      document.body.classList.remove('admin');
    };
  }, [user]);

  // ==================== LOADING STATES ====================

  if (!ready) {
    return null;
  }

  if (!cfg) {
    return (
      <p style={{ padding: 40 }}>
        Can't reach the server. Start the API
        (npm run dev) and refresh.
      </p>
    );
  }

  // ==================== PERMISSIONS ====================

  const can = permission =>
    user?.role === 'staff' &&
    (PERM[user.level] || []).includes(permission);

  const student = user?.role === 'student';

  // ==================== NAVIGATION ====================

  const nav = !user
    ? []
    : student
      ? [
          ['/', '🏠', 'Today'],
          ['/menu', '📖', 'Weekly menu'],
          ['/meals', '🗓️', 'My meals'],
          ['/wallet', '💳', 'Wallet'],
          ['/feedback', '⭐', 'Feedback']
        ]
      : [
          can('acc') && ['/overview', '📊', 'Overview'],
          can('cnt') && ['/counter', '🍽️', 'Counter'],
          ['/menu', '📖', 'Menu'],
          can('acc') && ['/inventory', '📦', 'Inventory'],
          can('head') && ['/notices', '📢', 'Notices'],
          can('acc') && ['/feedback', '⭐', 'Feedback'],
          can('acc') && ['/records', '🧾', 'Records']
        ].filter(Boolean);

  // ==================== MAIN RENDER ====================

  return (
    <Ctx.Provider
      value={{
        user,
        cfg,
        toast,
        run
      }}
    >
      {!user ? (
        <Login onAuth={setUser} />
      ) : (
        <>
          {/* SIDEBAR */}

          <aside className="side">
            <div className="brand">
              <span className="badge">
                <img
                  src="/logo.png"
                  alt="IIIT Bhubaneswar logo"
                />
              </span>

              <div>
                <b>Mess Hub</b>
                <small>IIIT Bhubaneswar</small>
              </div>
            </div>

            <nav>
              {nav.map(([to, icon, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                >
                  {icon}
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="who">
              <div className="av">
                {(user.name || 'User')
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .slice(0, 2)}
              </div>

              <div>
                <b>{user.name}</b>
                <small>{user.id}</small>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}

          <main>
            {/* HEADER */}

            <header className="top">
              <div>
                <h1>
                  Hello, {user.name?.split(' ')[0] || 'User'} 👋
                </h1>

                <p>
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <div className="tools">
                <div className="bellw">
                  <button
                    className="ic"
                    id="bell"
                    aria-label="Notifications"
                    title="Notifications"
                    aria-expanded={notifOpen}
                    onClick={() => setNotifOpen(prev => !prev)}
                  >
                    🔔
                  </button>

                  {notifs.filter(n => !n.read).length > 0 && (
                    <span id="bc">
                      {notifs.filter(n => !n.read).length}
                    </span>
                  )}
                </div>

                <button
                  className="ic"
                  onClick={() => {
                    setToken(null);
                    setUser(null);
                    setNotifOpen(false);
                  }}
                  aria-label="Sign out"
                  title="Sign out"
                >
                  ⏻
                </button>
              </div>
            </header>

            {/* NOTIFICATION PANEL */}

            {notifOpen && (
              <div
                className="np"
                onClick={e => {
                  if (e.target === e.currentTarget) {
                    setNotifOpen(false);
                  }
                }}
              >
                {notifs.length > 0 ? (
                  notifs.map(n => (
                    <p
                      key={n._id}
                      onClick={() => {
                        if (!n.read) {
                          markRead(n._id);
                        }
                      }}
                      style={{
                        opacity: n.read ? '0.6' : '1',
                        borderLeft: n.read
                          ? '1px solid var(--line)'
                          : '3px solid var(--o)',
                        cursor: n.read ? 'default' : 'pointer'
                      }}
                    >
                      {n.message}

                      <small
                        style={{
                          display: 'block',
                          fontSize: '10px',
                          color: 'var(--mute)'
                        }}
                      >
                        {new Date(n.createdAt).toLocaleString()}
                      </small>
                    </p>
                  ))
                ) : (
                  <p
                    style={{
                      textAlign: 'center',
                      color: 'var(--mute)'
                    }}
                  >
                    No notifications
                  </p>
                )}
              </div>
            )}

            {/* ROUTES */}

            <Routes>
              {student ? (
                <>
                  <Route
                    path="/"
                    element={<Today />}
                  />

                  <Route
                    path="/meals"
                    element={<Meals />}
                  />

                  <Route
                    path="/wallet"
                    element={<Wallet />}
                  />

                  <Route
                    path="/feedback"
                    element={<Feedback />}
                  />
                </>
              ) : (
                <>
                  <Route
                    path="/"
                    element={
                      <Navigate
                        to={can('acc') ? '/overview' : '/counter'}
                        replace
                      />
                    }
                  />

                  {can('acc') && (
                    <>
                      <Route
                        path="/overview"
                        element={<Overview />}
                      />

                      <Route
                        path="/records"
                        element={<Records />}
                      />

                      <Route
                        path="/inventory"
                        element={<Inventory />}
                      />

                      <Route
                        path="/feedback"
                        element={<Feedback />}
                      />
                    </>
                  )}

                  {can('head') && (
                    <Route
                      path="/notices"
                      element={<Notice />}
                    />
                  )}

                  {can('cnt') && (
                    <Route
                      path="/counter"
                      element={<Counter />}
                    />
                  )}
                </>
              )}

              {/* COMMON ROUTE */}

              <Route
                path="/menu"
                element={<MenuPage />}
              />

              {/* FALLBACK ROUTE */}

              <Route
                path="*"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />
            </Routes>
          </main>
        </>
      )}

      {/* TOAST MESSAGES */}

      <div id="toasts">
        {toasts.map(t => (
          <div
            className="toast"
            key={t.id}
          >
            {t.m}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
