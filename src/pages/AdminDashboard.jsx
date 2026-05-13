import { useState, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Field, ErrorBanner, SuccessBanner } from '../components/auth/FormParts';
import { getDepartments, createDepartment, createMember, getMembers, getCases, createCase, assignUserToCase } from '../api/auth';

const NAV = [
  { type: 'section', label: 'Operations' },
  { id: 'overview',    label: 'Overview' },
  { id: 'cases',       label: 'Case Management' },
  { type: 'section', label: 'Organization' },
  { id: 'departments', label: 'Departments' },
  { id: 'members',     label: 'Members' },
  { type: 'section', label: 'Security' },
  { id: 'audit',       label: 'Audit Log' },
];

// ── Reusable stat card ─────────────────────────────────────────────────────────
function StatCard({ value, label, color = 'var(--accent)' }) {
  return (
    <div className="card" style={{ textAlign: 'left' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 600, color, lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--cond)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--text2)', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview({ cases, members, departments }) {
  return (
    <div className="animate-slide">
      <div className="page-title">ADMIN OVERVIEW</div>
      <div className="page-sub">ORGANIZATION COMMAND CENTRE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard value={cases.length}       label="Total Cases"   color="var(--accent)" />
        <StatCard value={members.length}     label="Members"       color="var(--success)" />
        <StatCard value={departments.length} label="Departments"   color="var(--warn)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <SectionTitle>Recent Cases</SectionTitle>
          {cases.length === 0
            ? <Empty>No cases yet</Empty>
            : cases.slice(0, 5).map((c) => (
              <Row key={c.public_id}>
                <Mono>{c.public_id?.slice(0, 8)}...</Mono>
                <span style={{ flex: 1, fontSize: 12 }}>{c.title}</span>
                <Badge type={c.status?.toLowerCase()}>{c.status}</Badge>
              </Row>
            ))}
        </div>

        <div className="card">
          <SectionTitle>Departments</SectionTitle>
          {departments.length === 0
            ? <Empty>No departments yet — create one below</Empty>
            : departments.map((d) => (
              <Row key={d.id}>
                <span className="navDot" style={{ width: 4, height: 4, background: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 13 }}>{d.name}</span>
              </Row>
            ))}
        </div>
      </div>
    </div>
  );
}

// ── Departments ───────────────────────────────────────────────────────────────
function Departments({ departments, onRefresh }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('DEPARTMENT NAME IS REQUIRED'); return; }
    setError(''); setSuccess(''); setLoading(true);
    try {
      await createDepartment({ name: name.trim() });
      setSuccess(`DEPARTMENT "${name.toUpperCase()}" CREATED`);
      setName('');
      onRefresh();
    } catch (err) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide">
      <div className="page-title">DEPARTMENTS</div>
      <div className="page-sub">CREATE AND MANAGE ORGANIZATIONAL DEPARTMENTS</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* List */}
        <div className="card">
          <SectionTitle>All Departments</SectionTitle>
          {departments.length === 0
            ? <Empty>No departments yet. Create your first one →</Empty>
            : departments.map((d) => (
              <Row key={d.id} style={{ padding: '10px 0' }}>
                <div style={{ width: 32, height: 32, background: 'var(--accent-dim)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--cond)', fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {d.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)', marginTop: 2 }}>ID {d.id}</div>
                </div>
              </Row>
            ))}
        </div>

        {/* Create form */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <SectionTitle>New Department</SectionTitle>
          <ErrorBanner message={error} />
          <SuccessBanner message={success} />
          <form onSubmit={submit}>
            <Field label="Department Name">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cybercrime Unit" />
            </Field>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? '[ CREATING... ]' : '[ CREATE DEPARTMENT ]'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Members ────────────────────────────────────────────────────────────────────
function Members({ members, departments, onRefresh }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', deptId: '', role: 'user' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: '' })); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())     errs.name = 'Name is required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    if (form.password.length < 6)  errs.password = 'Min 6 characters';
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setError(''); setSuccess(''); setLoading(true);
    try {
      await createMember({ name: form.name, email: form.email, password: form.password, deptId: form.deptId || null, role: form.role });
      setSuccess(`MEMBER "${form.name.toUpperCase()}" CREATED — CREDENTIALS SET`);
      setForm({ name: '', email: '', password: '', deptId: '', role: 'user' });
      onRefresh();
    } catch (err) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide">
      <div className="page-title">MEMBERS</div>
      <div className="page-sub">ADMIN CREATES AND MANAGES ALL USER CREDENTIALS</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* List */}
        <div className="card">
          <SectionTitle>All Members ({members.length})</SectionTitle>
          {members.length === 0
            ? <Empty>No members yet. Add your first officer →</Empty>
            : members.map((m) => (
              <Row key={m.public_id} style={{ padding: '10px 0' }}>
                <div style={{ width: 36, height: 36, background: 'var(--accent-dim)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--cond)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {m.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)', marginTop: 2 }}>{m.email}</div>
                </div>
                <Badge type={m.is_active ? 'active' : 'inactive'}>{m.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge>
              </Row>
            ))}
        </div>

        {/* Create form */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <SectionTitle>Add Member</SectionTitle>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>
            You set the credentials. The member uses these to log in as a User.
          </div>
          <ErrorBanner message={error} />
          <SuccessBanner message={success} />
          <form onSubmit={submit}>
            <Field label="Full Name" error={errors.name}>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Officer full name" />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="officer@dept.gov" />
            </Field>
            <Field label="Password" error={errors.password}>
              <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Set their password" />
            </Field>
            <Field label="Department (optional)">
              <select className="select" value={form.deptId} onChange={set('deptId')}>
                <option value="">No department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Role">
              <select className="select" value={form.role} onChange={set('role')}>
                <option value="user">Officer / User</option>
                <option value="analyst">Forensic Analyst</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </Field>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? '[ CREATING... ]' : '[ CREATE MEMBER ]'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Cases ──────────────────────────────────────────────────────────────────────
function Cases({ cases, members, departments, onRefresh }) {
  const [form, setForm] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('CASE TITLE IS REQUIRED'); return; }
    setError(''); setSuccess(''); setLoading(true);
    try {
      await createCase({ title: form.title, description: form.description });
      setSuccess('CASE CREATED SUCCESSFULLY');
      setForm({ title: '', description: '' });
      onRefresh();
    } catch (err) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide">
      <div className="page-title">CASE MANAGEMENT</div>
      <div className="page-sub">CREATE CASES AND ASSIGN TO DEPARTMENTS AND MEMBERS</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* List */}
        <div className="card">
          <SectionTitle>All Cases ({cases.length})</SectionTitle>
          {cases.length === 0
            ? <Empty>No cases yet. Create your first case →</Empty>
            : cases.map((c) => (
              <div key={c.public_id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <Mono style={{ fontSize: 10, color: 'var(--accent)' }}>{c.public_id?.slice(0, 8)}...</Mono>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.title}</span>
                  <Badge type={c.status?.toLowerCase()}>{c.status}</Badge>
                </div>
                {c.description && <div style={{ fontSize: 11, color: 'var(--text2)', paddingLeft: 0 }}>{c.description}</div>}
              </div>
            ))}
        </div>

        {/* Create */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <SectionTitle>New Case</SectionTitle>
            <ErrorBanner message={error} />
            <SuccessBanner message={success} />
            <form onSubmit={submit}>
              <Field label="Case Title">
                <input className="input" value={form.title} onChange={set('title')} placeholder="Brief case title" />
              </Field>
              <Field label="Description">
                <textarea className="input" value={form.description} onChange={set('description')} placeholder="Optional details..." style={{ height: 72, resize: 'none' }} />
              </Field>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? '[ CREATING... ]' : '[ CREATE CASE ]'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Audit placeholder ──────────────────────────────────────────────────────────
function Audit() {
  return (
    <div className="animate-slide">
      <div className="page-title">AUDIT LOG</div>
      <div className="page-sub">IMMUTABLE ACCESS AND ACTION LOG</div>
      <div className="card">
        <Empty>Connect to audit-service endpoint to view logs.</Empty>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: 'var(--cond)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text2)', textTransform: 'uppercase', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border2)' }}>
      {children}
    </div>
  );
}

function Row({ children, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border2)', ...style }}>
      {children}
    </div>
  );
}

function Mono({ children, style }) {
  return <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', ...style }}>{children}</span>;
}

function Empty({ children }) {
  return <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', padding: '20px 0', textAlign: 'center' }}>{children}</div>;
}

const BADGE_COLORS = {
  active:      { bg: 'rgba(0,229,160,0.1)',  color: 'var(--success)' },
  inactive:    { bg: 'rgba(90,122,144,0.1)', color: 'var(--text2)' },
  open:        { bg: 'rgba(0,200,255,0.1)',  color: 'var(--accent)' },
  in_progress: { bg: 'rgba(255,170,0,0.1)', color: 'var(--warn)' },
  closed:      { bg: 'rgba(90,122,144,0.1)', color: 'var(--text2)' },
  archived:    { bg: 'rgba(90,122,144,0.1)', color: 'var(--text2)' },
};

function Badge({ type, children }) {
  const s = BADGE_COLORS[type] || BADGE_COLORS.open;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', borderRadius: 1, background: s.bg, color: s.color, textTransform: 'uppercase' }}>
      {children}
    </span>
  );
}

// ── Root AdminDashboard ────────────────────────────────────────────────────────
export function AdminDashboard() {
  const [page, setPage] = useState('overview');
  const [cases, setCases] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const refresh = async () => {
    try { setCases(await getCases()); } catch {}
    try { setMembers(await getMembers()); } catch {}
    try { setDepartments(await getDepartments()); } catch {}
  };

  useEffect(() => { refresh(); }, []);

  const pages = {
    overview:    <Overview    cases={cases} members={members} departments={departments} />,
    cases:       <Cases       cases={cases} members={members} departments={departments} onRefresh={refresh} />,
    departments: <Departments departments={departments} onRefresh={refresh} />,
    members:     <Members     members={members} departments={departments} onRefresh={refresh} />,
    audit:       <Audit />,
  };

  return (
    <AppLayout navItems={NAV} activePage={page} onNavigate={setPage}>
      {pages[page]}
    </AppLayout>
  );
}
