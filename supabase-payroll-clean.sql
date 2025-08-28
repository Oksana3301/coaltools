-- =====================================================
-- SUPABASE PAYROLL CALCULATOR SETUP - CLEAN VERSION
-- Safe setup with proper error handling
-- =====================================================

-- Enable Row Level Security
-- ALTER DATABASE postgres SET row_security = on;

-- =====================================================
-- 1. DROP EXISTING TABLES (if they exist)
-- =====================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS employee_payroll_details CASCADE;
DROP VIEW IF EXISTS payroll_summary CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS employee_component_selections CASCADE;
DROP TABLE IF EXISTS payroll_line_components CASCADE;
DROP TABLE IF EXISTS payroll_lines CASCADE;
DROP TABLE IF EXISTS payroll_runs CASCADE;
DROP TABLE IF EXISTS pay_components CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS login_activity CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_payroll_totals(TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_admin_or_manager(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(TEXT) CASCADE;

-- Drop types (in reverse order)
DROP TYPE IF EXISTS login_status CASCADE;
DROP TYPE IF EXISTS payroll_status CASCADE;
DROP TYPE IF EXISTS pay_component_basis CASCADE;
DROP TYPE IF EXISTS pay_component_method CASCADE;
DROP TYPE IF EXISTS pay_component_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =====================================================
-- 2. CREATE ENUMS (Data Types)
-- =====================================================

-- User Role Enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'STAFF', 'DEMO');

-- Pay Component Types
CREATE TYPE pay_component_type AS ENUM ('EARNING', 'DEDUCTION');

-- Pay Component Methods
CREATE TYPE pay_component_method AS ENUM ('FLAT', 'PER_HARI', 'PERSENTASE');

-- Pay Component Basis
CREATE TYPE pay_component_basis AS ENUM ('UPAH_HARIAN', 'BRUTO', 'HARI_KERJA');

-- Payroll Status
CREATE TYPE payroll_status AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED');

-- Login Status
CREATE TYPE login_status AS ENUM ('LOGIN', 'LOGOUT', 'FAILED');

-- =====================================================
-- 3. CREATE TABLES
-- =====================================================

-- Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role DEFAULT 'STAFF',
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Login Activity Table
CREATE TABLE login_activity (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    status login_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Employees Table
CREATE TABLE employees (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nama TEXT NOT NULL,
    nik TEXT,
    jabatan TEXT,
    site TEXT NOT NULL,
    tempat_lahir TEXT,
    tanggal_lahir TEXT,
    alamat TEXT,
    kontrak_upah_harian DECIMAL(15,2) NOT NULL,
    default_uang_makan DECIMAL(15,2) NOT NULL DEFAULT 0,
    default_uang_bbm DECIMAL(15,2) NOT NULL DEFAULT 0,
    bank_name TEXT,
    bank_account TEXT,
    npwp TEXT,
    start_date TEXT,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pay Components Table (Standard & Additional)
CREATE TABLE pay_components (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nama TEXT NOT NULL,
    tipe pay_component_type NOT NULL,
    taxable BOOLEAN DEFAULT false,
    metode pay_component_method NOT NULL,
    basis pay_component_basis NOT NULL,
    rate DECIMAL(8,4),
    nominal DECIMAL(15,2),
    cap_min DECIMAL(15,2),
    cap_max DECIMAL(15,2),
    "order" INTEGER DEFAULT 0,
    aktif BOOLEAN DEFAULT true,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_flat_nominal CHECK (
        (metode != 'FLAT') OR (metode = 'FLAT' AND nominal IS NOT NULL)
    ),
    CONSTRAINT valid_rate_methods CHECK (
        (metode = 'FLAT') OR (metode IN ('PER_HARI', 'PERSENTASE') AND rate IS NOT NULL)
    ),
    CONSTRAINT valid_caps CHECK (
        cap_min IS NULL OR cap_max IS NULL OR cap_min <= cap_max
    )
);

-- Payroll Runs Table
CREATE TABLE payroll_runs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    periode_awal TEXT NOT NULL,
    periode_akhir TEXT NOT NULL,
    status payroll_status DEFAULT 'DRAFT',
    created_by TEXT NOT NULL REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Payroll Lines Table (Individual Employee Payroll)
CREATE TABLE payroll_lines (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    payroll_run_id TEXT NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id),
    employee_name TEXT NOT NULL,
    hari_kerja INTEGER NOT NULL DEFAULT 0,
    upah_harian DECIMAL(15,2) NOT NULL DEFAULT 0,
    uang_makan_harian DECIMAL(15,2) NOT NULL DEFAULT 0,
    uang_bbm_harian DECIMAL(15,2) NOT NULL DEFAULT 0,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    overtime_rate DECIMAL(8,4) DEFAULT 1.5,
    cashbon DECIMAL(15,2) DEFAULT 0,
    bruto DECIMAL(15,2) NOT NULL DEFAULT 0,
    pajak_rate DECIMAL(8,4),
    pajak_nominal DECIMAL(15,2),
    potongan_lain DECIMAL(15,2) DEFAULT 0,
    neto DECIMAL(15,2) NOT NULL DEFAULT 0,
    status payroll_status DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT positive_hari_kerja CHECK (hari_kerja >= 0),
    CONSTRAINT positive_amounts CHECK (
        upah_harian >= 0 AND 
        uang_makan_harian >= 0 AND 
        uang_bbm_harian >= 0 AND
        bruto >= 0 AND 
        neto >= 0
    )
);

-- Payroll Line Components Table (Component Breakdown per Employee)
CREATE TABLE payroll_line_components (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    payroll_line_id TEXT NOT NULL REFERENCES payroll_lines(id) ON DELETE CASCADE,
    component_id TEXT NOT NULL REFERENCES pay_components(id),
    component_name TEXT NOT NULL,
    component_type pay_component_type NOT NULL,
    qty DECIMAL(8,2),
    rate DECIMAL(8,4),
    nominal DECIMAL(15,2),
    amount DECIMAL(15,2) NOT NULL,
    taxable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Unique constraint to prevent duplicate components per payroll line
    UNIQUE(payroll_line_id, component_id)
);

-- Employee Component Selections (Which components each employee gets)
CREATE TABLE employee_component_selections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    payroll_run_id TEXT NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id),
    component_id TEXT NOT NULL REFERENCES pay_components(id),
    component_type TEXT NOT NULL, -- 'standard' or 'additional'
    is_selected BOOLEAN DEFAULT true,
    custom_amount DECIMAL(15,2), -- For overriding default amounts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Unique constraint
    UNIQUE(payroll_run_id, employee_id, component_id)
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_aktif ON users(aktif);

-- Login Activity indexes
CREATE INDEX idx_login_activity_user_id ON login_activity(user_id);
CREATE INDEX idx_login_activity_status ON login_activity(status);
CREATE INDEX idx_login_activity_created_at ON login_activity(created_at DESC);

-- Employees indexes
CREATE INDEX idx_employees_aktif ON employees(aktif);
CREATE INDEX idx_employees_site ON employees(site);
CREATE INDEX idx_employees_nama ON employees(nama);

-- Pay Components indexes
CREATE INDEX idx_pay_components_tipe ON pay_components(tipe);
CREATE INDEX idx_pay_components_order ON pay_components("order");
CREATE INDEX idx_pay_components_aktif ON pay_components(aktif);
CREATE INDEX idx_pay_components_created_by ON pay_components(created_by);

-- Payroll Runs indexes
CREATE INDEX idx_payroll_runs_created_by ON payroll_runs(created_by);
CREATE INDEX idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX idx_payroll_runs_periode ON payroll_runs(periode_awal, periode_akhir);
CREATE INDEX idx_payroll_runs_created_at ON payroll_runs(created_at DESC);

-- Payroll Lines indexes
CREATE INDEX idx_payroll_lines_run_id ON payroll_lines(payroll_run_id);
CREATE INDEX idx_payroll_lines_employee_id ON payroll_lines(employee_id);
CREATE INDEX idx_payroll_lines_status ON payroll_lines(status);

-- Payroll Line Components indexes
CREATE INDEX idx_payroll_line_components_line_id ON payroll_line_components(payroll_line_id);
CREATE INDEX idx_payroll_line_components_component_id ON payroll_line_components(component_id);

-- Employee Component Selections indexes
CREATE INDEX idx_employee_selections_run_id ON employee_component_selections(payroll_run_id);
CREATE INDEX idx_employee_selections_employee_id ON employee_component_selections(employee_id);
CREATE INDEX idx_employee_selections_component_id ON employee_component_selections(component_id);

-- =====================================================
-- 5. INSERT DEFAULT ADMIN USER
-- =====================================================

-- Insert default admin user for component creation
INSERT INTO users (id, name, email, password, role) VALUES 
('admin-default-001', 'System Admin', 'admin@coaltools.com', '$2b$10$defaulthashedpassword', 'ADMIN');

-- =====================================================
-- 6. INSERT SAMPLE PAY COMPONENTS
-- =====================================================

-- Insert default pay components (Standard: order 0-99, Additional: order 100+)
INSERT INTO pay_components (nama, tipe, metode, basis, nominal, rate, "order", created_by) VALUES 
('Gaji Pokok', 'EARNING', 'FLAT', 'UPAH_HARIAN', 0, NULL, 1, 'admin-default-001'),
('Tunjangan Transport', 'EARNING', 'FLAT', 'HARI_KERJA', 50000, NULL, 2, 'admin-default-001'),
('Tunjangan Makan', 'EARNING', 'FLAT', 'HARI_KERJA', 25000, NULL, 3, 'admin-default-001'),
('BPJS Kesehatan', 'DEDUCTION', 'PERSENTASE', 'BRUTO', NULL, 4.0, 10, 'admin-default-001'),
('BPJS Ketenagakerjaan', 'DEDUCTION', 'PERSENTASE', 'BRUTO', NULL, 2.0, 11, 'admin-default-001'),
('PPh 21', 'DEDUCTION', 'PERSENTASE', 'BRUTO', NULL, 5.0, 12, 'admin-default-001'),
('Bonus Kinerja', 'EARNING', 'FLAT', 'BRUTO', 0, NULL, 101, 'admin-default-001'),
('Lembur', 'EARNING', 'PER_HARI', 'UPAH_HARIAN', NULL, 1.5, 102, 'admin-default-001'),
('Bonus Proyek', 'EARNING', 'FLAT', 'BRUTO', 0, NULL, 103, 'admin-default-001'),
('Potongan Keterlambatan', 'DEDUCTION', 'FLAT', 'HARI_KERJA', 10000, NULL, 104, 'admin-default-001'),
('Tunjangan Kehadiran', 'EARNING', 'FLAT', 'HARI_KERJA', 15000, NULL, 105, 'admin-default-001'),
('Potongan Alpha', 'DEDUCTION', 'FLAT', 'HARI_KERJA', 25000, NULL, 106, 'admin-default-001');

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_line_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_component_selections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE RLS POLICIES
-- =====================================================

-- Users Table Policies
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        auth.uid()::text = id OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        auth.uid()::text = id OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- Login Activity Policies
CREATE POLICY "login_activity_select_policy" ON login_activity
    FOR SELECT USING (
        auth.uid()::text = user_id OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

CREATE POLICY "login_activity_insert_policy" ON login_activity
    FOR INSERT WITH CHECK (true);

-- Employees Policies
CREATE POLICY "employees_select_policy" ON employees
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "employees_insert_policy" ON employees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

CREATE POLICY "employees_update_policy" ON employees
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

CREATE POLICY "employees_delete_policy" ON employees
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- Pay Components Policies
CREATE POLICY "pay_components_select_policy" ON pay_components
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "pay_components_insert_policy" ON pay_components
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

CREATE POLICY "pay_components_update_policy" ON pay_components
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

CREATE POLICY "pay_components_delete_policy" ON pay_components
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- Payroll Runs Policies
CREATE POLICY "payroll_runs_select_policy" ON payroll_runs
    FOR SELECT USING (
        auth.uid()::text = created_by OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

CREATE POLICY "payroll_runs_insert_policy" ON payroll_runs
    FOR INSERT WITH CHECK (
        auth.uid()::text = created_by AND 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text
        )
    );

CREATE POLICY "payroll_runs_update_policy" ON payroll_runs
    FOR UPDATE USING (
        (auth.uid()::text = created_by AND status = 'DRAFT') OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

CREATE POLICY "payroll_runs_delete_policy" ON payroll_runs
    FOR DELETE USING (
        (auth.uid()::text = created_by AND status = 'DRAFT') OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- Payroll Lines Policies
CREATE POLICY "payroll_lines_select_policy" ON payroll_lines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_run_id AND (
                pr.created_by = auth.uid()::text OR 
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
                )
            )
        )
    );

CREATE POLICY "payroll_lines_insert_policy" ON payroll_lines
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_run_id AND pr.created_by = auth.uid()::text
        )
    );

CREATE POLICY "payroll_lines_update_policy" ON payroll_lines
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_run_id AND (
                (pr.created_by = auth.uid()::text AND pr.status = 'DRAFT') OR 
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
                )
            )
        )
    );

CREATE POLICY "payroll_lines_delete_policy" ON payroll_lines
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_run_id AND (
                (pr.created_by = auth.uid()::text AND pr.status = 'DRAFT') OR 
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
                )
            )
        )
    );

-- Payroll Line Components Policies
CREATE POLICY "payroll_line_components_select_policy" ON payroll_line_components
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payroll_lines pl 
            JOIN payroll_runs pr ON pr.id = pl.payroll_run_id 
            WHERE pl.id = payroll_line_id AND (
                pr.created_by = auth.uid()::text OR 
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
                )
            )
        )
    );

CREATE POLICY "payroll_line_components_insert_policy" ON payroll_line_components
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM payroll_lines pl 
            JOIN payroll_runs pr ON pr.id = pl.payroll_run_id 
            WHERE pl.id = payroll_line_id AND pr.created_by = auth.uid()::text
        )
    );

CREATE POLICY "payroll_line_components_update_policy" ON payroll_line_components
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM payroll_lines pl 
            JOIN payroll_runs pr ON pr.id = pl.payroll_run_id 
            WHERE pl.id = payroll_line_id AND (
                (pr.created_by = auth.uid()::text AND pr.status = 'DRAFT') OR 
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
                )
            )
        )
    );

CREATE POLICY "payroll_line_components_delete_policy" ON payroll_line_components
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM payroll_lines pl 
            JOIN payroll_runs pr ON pr.id = pl.payroll_run_id 
            WHERE pl.id = payroll_line_id AND (
                (pr.created_by = auth.uid()::text AND pr.status = 'DRAFT') OR 
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
                )
            )
        )
    );

-- Employee Component Selections Policies
CREATE POLICY "employee_selections_select_policy" ON employee_component_selections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_run_id AND (
                pr.created_by = auth.uid()::text OR 
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
                )
            )
        )
    );

CREATE POLICY "employee_selections_insert_policy" ON employee_component_selections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_run_id AND pr.created_by = auth.uid()::text
        )
    );

CREATE POLICY "employee_selections_update_policy" ON employee_component_selections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_run_id AND (
                (pr.created_by = auth.uid()::text AND pr.status = 'DRAFT') OR 
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
                )
            )
        )
    );

CREATE POLICY "employee_selections_delete_policy" ON employee_component_selections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_run_id AND (
                (pr.created_by = auth.uid()::text AND pr.status = 'DRAFT') OR 
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
                )
            )
        )
    );

-- =====================================================
-- 9. CREATE UTILITY FUNCTIONS
-- =====================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id TEXT)
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user is admin/manager
CREATE OR REPLACE FUNCTION is_admin_or_manager(user_id TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND role IN ('ADMIN', 'MANAGER')
    );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to calculate payroll totals
CREATE OR REPLACE FUNCTION calculate_payroll_totals(payroll_run_id_param TEXT)
RETURNS TABLE (
    total_employees BIGINT,
    total_bruto DECIMAL(15,2),
    total_neto DECIMAL(15,2),
    total_tax DECIMAL(15,2),
    total_deductions DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_employees,
        COALESCE(SUM(bruto), 0)::DECIMAL(15,2) as total_bruto,
        COALESCE(SUM(neto), 0)::DECIMAL(15,2) as total_neto,
        COALESCE(SUM(pajak_nominal), 0)::DECIMAL(15,2) as total_tax,
        COALESCE(SUM(potongan_lain), 0)::DECIMAL(15,2) as total_deductions
    FROM payroll_lines 
    WHERE payroll_run_id = payroll_run_id_param 
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. CREATE REPORTING VIEWS
-- =====================================================

-- Payroll Summary View
CREATE VIEW payroll_summary AS
SELECT 
    pr.id as payroll_run_id,
    pr.periode_awal,
    pr.periode_akhir,
    pr.status,
    u.name as created_by_name,
    COUNT(pl.id) as total_employees,
    SUM(pl.bruto) as total_bruto,
    SUM(pl.neto) as total_neto,
    SUM(pl.pajak_nominal) as total_tax,
    pr.created_at,
    pr.updated_at
FROM payroll_runs pr
LEFT JOIN payroll_lines pl ON pr.id = pl.payroll_run_id AND pl.deleted_at IS NULL
LEFT JOIN users u ON pr.created_by = u.id
WHERE pr.deleted_at IS NULL
GROUP BY pr.id, pr.periode_awal, pr.periode_akhir, pr.status, u.name, pr.created_at, pr.updated_at;

-- Employee Payroll Details View
CREATE VIEW employee_payroll_details AS
SELECT 
    pl.id as payroll_line_id,
    pr.id as payroll_run_id,
    pr.periode_awal,
    pr.periode_akhir,
    e.nama as employee_name,
    e.jabatan,
    e.site,
    pl.hari_kerja,
    pl.upah_harian,
    pl.bruto,
    pl.pajak_nominal,
    pl.neto,
    pl.status,
    array_agg(
        json_build_object(
            'component_name', plc.component_name,
            'component_type', plc.component_type,
            'amount', plc.amount,
            'taxable', plc.taxable
        ) ORDER BY plc.component_type, plc.component_name
    ) FILTER (WHERE plc.id IS NOT NULL) as components
FROM payroll_lines pl
JOIN payroll_runs pr ON pl.payroll_run_id = pr.id
JOIN employees e ON pl.employee_id = e.id
LEFT JOIN payroll_line_components plc ON pl.id = plc.payroll_line_id
WHERE pl.deleted_at IS NULL AND pr.deleted_at IS NULL
GROUP BY pl.id, pr.id, pr.periode_awal, pr.periode_akhir, e.nama, e.jabatan, e.site, 
         pl.hari_kerja, pl.upah_harian, pl.bruto, pl.pajak_nominal, pl.neto, pl.status;

-- =====================================================
-- 11. SUCCESS MESSAGE
-- =====================================================

-- Display success message
SELECT 
    '=== SUPABASE PAYROLL CALCULATOR SETUP COMPLETED ===' as message,
    'Tables created: 8 core tables' as tables_info,
    'Indexes created: 20+ performance indexes' as indexes_info,
    'RLS policies applied: 30+ security policies' as rls_info,
    'Views created: 2 reporting views' as views_info,
    'Functions created: 3 utility functions' as functions_info,
    'Sample data: 12 pay components added' as sample_data_info,
    'Default admin user: admin@coaltools.com' as admin_info,
    'Setup completed successfully! ✅' as status;
