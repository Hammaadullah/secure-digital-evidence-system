-- =====================================================
-- 1. EXTENSIONS & IMMUTABILITY SETUP
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION prevent_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY ALERT: Append-only table — modification blocked.';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. ORGANIZATIONS & DEPARTMENTS
-- =====================================================

CREATE TABLE organizations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id UUID UNIQUE DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    org_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    UNIQUE(org_id, name)
);

-- =====================================================
-- 3. USERS & RBAC
-- =====================================================

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id UUID UNIQUE DEFAULT gen_random_uuid(),

    org_id BIGINT REFERENCES organizations(id),
    dept_id BIGINT REFERENCES departments(id),

    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE user_roles (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- =====================================================
-- 4. CASE MANAGEMENT
-- =====================================================

CREATE TABLE cases (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id UUID UNIQUE DEFAULT gen_random_uuid(),

    org_id BIGINT REFERENCES organizations(id),

    title VARCHAR(200) NOT NULL,
    description TEXT,

    status VARCHAR(40) DEFAULT 'OPEN',
    priority VARCHAR(20),

    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cases_org ON cases(org_id);
CREATE INDEX idx_cases_status ON cases(status);

CREATE TABLE case_users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    case_id BIGINT REFERENCES cases(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,

    assigned_role VARCHAR(40),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(case_id, user_id)
);

CREATE INDEX idx_case_users_case ON case_users(case_id);
CREATE INDEX idx_case_users_user ON case_users(user_id);

-- =====================================================
-- 5. EVIDENCE CORE (VAULT)
-- =====================================================

CREATE TABLE evidence (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id UUID UNIQUE DEFAULT gen_random_uuid(),

    case_id BIGINT REFERENCES cases(id) ON DELETE RESTRICT,

    file_name TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,

    storage_path TEXT NOT NULL,

    current_hash TEXT NOT NULL,
    hash_algorithm VARCHAR(20) DEFAULT 'SHA-256',

    is_encrypted BOOLEAN DEFAULT TRUE,

    uploaded_by BIGINT REFERENCES users(id) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evidence_case ON evidence(case_id);
CREATE INDEX idx_evidence_hash ON evidence(current_hash);

-- =====================================================
-- 6. AUDIT LOG (IMMUTABLE)
-- =====================================================

CREATE TABLE audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT REFERENCES users(id),
    case_id BIGINT REFERENCES cases(id),
    evidence_id BIGINT REFERENCES evidence(id),

    action VARCHAR(80) NOT NULL,
    service_name VARCHAR(60),
    ip_address INET,

    details JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_case ON audit_logs(case_id);
CREATE INDEX idx_audit_evidence ON audit_logs(evidence_id);
CREATE INDEX idx_audit_time ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action);

CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_modification();

-- =====================================================
-- 7. EVIDENCE ACCESS TRACKING (PHASE 1 IMPORTANT)
-- =====================================================

CREATE TABLE evidence_access_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    evidence_id BIGINT REFERENCES evidence(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id),

    action VARCHAR(40),
    via_service VARCHAR(60),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_access_evidence ON evidence_access_log(evidence_id);

-- =====================================================
-- 8. CUSTODY LEDGER (HASH CHAIN — IMMUTABLE)
-- =====================================================

CREATE TABLE custody_ledger (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    evidence_id BIGINT REFERENCES evidence(id) ON DELETE RESTRICT,
    actor_id BIGINT REFERENCES users(id),

    action VARCHAR(80) NOT NULL,
    action_metadata JSONB,

    previous_hash TEXT,
    entry_hash TEXT NOT NULL UNIQUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custody_evidence ON custody_ledger(evidence_id);

CREATE TRIGGER trg_custody_ledger_immutable
BEFORE UPDATE OR DELETE ON custody_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_modification();

-- =====================================================
-- 9. PHASE 2 — ADVANCED SECURITY TABLES
-- =====================================================

CREATE TABLE evidence_versions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    evidence_id BIGINT REFERENCES evidence(id) ON DELETE CASCADE,
    version_no INT NOT NULL,

    sha256_hash TEXT NOT NULL,
    storage_path TEXT NOT NULL,

    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(evidence_id, version_no)
);

CREATE TABLE access_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    evidence_id BIGINT REFERENCES evidence(id),

    requested_by BIGINT REFERENCES users(id),
    approved_by BIGINT REFERENCES users(id),

    status VARCHAR(40) DEFAULT 'PENDING',
    reason TEXT,
    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE integrity_checks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    evidence_id BIGINT REFERENCES evidence(id),

    computed_hash TEXT,
    stored_hash TEXT,

    status VARCHAR(40),
    checked_by BIGINT REFERENCES users(id),

    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
