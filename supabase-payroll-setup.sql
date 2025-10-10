-- =====================================================
-- SUPABASE PAYROLL CALCULATOR SETUP
-- Complete SQL Setup with Tables, Indexes, and RLS Policies
-- =====================================================

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- =====================================================
-- 1. ENUMS (Data Types)
-- =====================================================

-- User Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'STAFF', 'DEMO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Pay Component Types
DO $$ BEGIN
    CREATE TYPE pay_component_type AS ENUM ('EARNING', 'DEDUCTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Pay Component Methods
DO $$ BEGIN
    CREATE TYPE pay_component_method AS ENUM ('FLAT', 'PER_HARI', 'PERSENTASE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Pay Component Basis
DO $$ BEGIN
    CREATE TYPE pay_component_basis AS ENUM ('UPAH_HARIAN', 'BRUTO', 'HARI_KERJA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payroll Status
DO $$ BEGIN
    CREATE TYPE payroll_status AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Login Status
DO $$ BEGIN
    CREATE TYPE login_status AS ENUM ('LOGIN', 'LOGOUT', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS login_activity (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    status login_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
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
CREATE TABLE IF NOT EXISTS pay_components (
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
CREATE TABLE IF NOT EXISTS payroll_runs (
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
CREATE TABLE IF NOT EXISTS payroll_lines (
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
CREATE TABLE IF NOT EXISTS payroll_line_components (
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
CREATE TABLE IF NOT EXISTS employee_component_selections (
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
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_aktif ON users(aktif);

-- Login Activity indexes
CREATE INDEX IF NOT EXISTS idx_login_activity_user_id ON login_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_status ON login_activity(status);
CREATE INDEX IF NOT EXISTS idx_login_activity_created_at ON login_activity(created_at DESC);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_aktif ON employees(aktif);
CREATE INDEX IF NOT EXISTS idx_employees_site ON employees(site);
CREATE INDEX IF NOT EXISTS idx_employees_nama ON employees(nama);

-- Pay Components indexes
CREATE INDEX IF NOT EXISTS idx_pay_components_tipe ON pay_components(tipe);
CREATE INDEX IF NOT EXISTS idx_pay_components_order ON pay_components("order");
CREATE INDEX IF NOT EXISTS idx_pay_components_aktif ON pay_components(aktif);
CREATE INDEX IF NOT EXISTS idx_pay_components_created_by ON pay_components(created_by);

-- Payroll Runs indexes
CREATE INDEX IF NOT EXISTS idx_payroll_runs_created_by ON payroll_runs(created_by);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_periode ON payroll_runs(periode_awal, periode_akhir);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_created_at ON payroll_runs(created_at DESC);

-- Payroll Lines indexes
CREATE INDEX IF NOT EXISTS idx_payroll_lines_run_id ON payroll_lines(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_employee_id ON payroll_lines(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_status ON payroll_lines(status);

-- Payroll Line Components indexes
CREATE INDEX IF NOT EXISTS idx_payroll_line_components_line_id ON payroll_line_components(payroll_line_id);
CREATE INDEX IF NOT EXISTS idx_payroll_line_components_component_id ON payroll_line_components(component_id);

-- Employee Component Selections indexes
CREATE INDEX IF NOT EXISTS idx_employee_selections_run_id ON employee_component_selections(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_employee_selections_employee_id ON employee_component_selections(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_selections_component_id ON employee_component_selections(component_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
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
-- 4.1 USERS TABLE POLICIES
-- =====================================================

-- Users can read their own data + admins can read all
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        auth.uid()::text = id OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- Only admins can insert users
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- Users can update their own data + admins can update all
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        auth.uid()::text = id OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- Only admins can delete users
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- =====================================================
-- 4.2 LOGIN ACTIVITY POLICIES
-- =====================================================

-- Users can read their own login activity + admins can read all
CREATE POLICY "login_activity_select_policy" ON login_activity
    FOR SELECT USING (
        auth.uid()::text = user_id OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- Anyone can insert login activity (for logging)
CREATE POLICY "login_activity_insert_policy" ON login_activity
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 4.3 EMPLOYEES TABLE POLICIES
-- =====================================================

-- All authenticated users can read employees
CREATE POLICY "employees_select_policy" ON employees
    FOR SELECT TO authenticated USING (true);

-- Admins and Managers can insert employees
CREATE POLICY "employees_insert_policy" ON employees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- Admins and Managers can update employees
CREATE POLICY "employees_update_policy" ON employees
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- Only admins can delete employees
CREATE POLICY "employees_delete_policy" ON employees
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- =====================================================
-- 4.4 PAY COMPONENTS POLICIES
-- =====================================================

-- All authenticated users can read pay components
CREATE POLICY "pay_components_select_policy" ON pay_components
    FOR SELECT TO authenticated USING (aktif = true OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- Admins and Managers can insert pay components
CREATE POLICY "pay_components_insert_policy" ON pay_components
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- Admins and Managers can update pay components
CREATE POLICY "pay_components_update_policy" ON pay_components
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- Only admins can delete pay components
CREATE POLICY "pay_components_delete_policy" ON pay_components
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- =====================================================
-- 4.5 PAYROLL RUNS POLICIES
-- =====================================================

-- Users can read payroll runs they created + managers/admins can read all
CREATE POLICY "payroll_runs_select_policy" ON payroll_runs
    FOR SELECT USING (
        auth.uid()::text = created_by OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- All authenticated users can create payroll runs
CREATE POLICY "payroll_runs_insert_policy" ON payroll_runs
    FOR INSERT WITH CHECK (
        auth.uid()::text = created_by AND 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text
        )
    );

-- Users can update their own payroll runs (if DRAFT) + managers can update all
CREATE POLICY "payroll_runs_update_policy" ON payroll_runs
    FOR UPDATE USING (
        (auth.uid()::text = created_by AND status = 'DRAFT') OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- Users can delete their own DRAFT payroll runs + admins can delete any
CREATE POLICY "payroll_runs_delete_policy" ON payroll_runs
    FOR DELETE USING (
        (auth.uid()::text = created_by AND status = 'DRAFT') OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'
        )
    );

-- =====================================================
-- 4.6 PAYROLL LINES POLICIES
-- =====================================================

-- Users can read payroll lines from runs they have access to
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

-- Users can insert payroll lines to runs they own
CREATE POLICY "payroll_lines_insert_policy" ON payroll_lines
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_run_id AND pr.created_by = auth.uid()::text
        )
    );

-- Users can update payroll lines in their DRAFT runs + managers can update all
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

-- Users can delete payroll lines from their DRAFT runs + admins can delete any
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

-- =====================================================
-- 4.7 PAYROLL LINE COMPONENTS POLICIES
-- =====================================================

-- Users can read components from payroll lines they have access to
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

-- Users can insert components to payroll lines they own
CREATE POLICY "payroll_line_components_insert_policy" ON payroll_line_components
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM payroll_lines pl 
            JOIN payroll_runs pr ON pr.id = pl.payroll_run_id 
            WHERE pl.id = payroll_line_id AND pr.created_by = auth.uid()::text
        )
    );

-- Users can update components in their DRAFT runs + managers can update all
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

-- Users can delete components from their DRAFT runs + admins can delete any
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

-- =====================================================
-- 4.8 EMPLOYEE COMPONENT SELECTIONS POLICIES
-- =====================================================

-- Users can read selections from payroll runs they have access to
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

-- Users can insert selections to runs they own
CREATE POLICY "employee_selections_insert_policy" ON employee_component_selections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_run_id AND pr.created_by = auth.uid()::text
        )
    );

-- Users can update selections in their DRAFT runs + managers can update all
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

-- Users can delete selections from their DRAFT runs + admins can delete any
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
-- 5. UTILITY FUNCTIONS
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
-- 6. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert default pay components if they don't exist
INSERT INTO pay_components (nama, tipe, metode, basis, nominal, "order", created_by) VALUES 
('Gaji Pokok', 'EARNING', 'FLAT', 'UPAH_HARIAN', 0, 1, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)),
('Tunjangan Transport', 'EARNING', 'FLAT', 'HARI_KERJA', 50000, 2, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)),
('Tunjangan Makan', 'EARNING', 'FLAT', 'HARI_KERJA', 25000, 3, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)),
('BPJS Kesehatan', 'DEDUCTION', 'PERSENTASE', 'BRUTO', NULL, 10, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)),
('BPJS Ketenagakerjaan', 'DEDUCTION', 'PERSENTASE', 'BRUTO', NULL, 11, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)),
('Bonus Kinerja', 'EARNING', 'FLAT', 'BRUTO', 0, 101, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)),
('Lembur', 'EARNING', 'PER_HARI', 'UPAH_HARIAN', NULL, 102, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)),
('Potongan Keterlambatan', 'DEDUCTION', 'FLAT', 'HARI_KERJA', 10000, 103, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Update the rate for percentage-based components
UPDATE pay_components SET rate = 4.0 WHERE nama = 'BPJS Kesehatan';
UPDATE pay_components SET rate = 2.0 WHERE nama = 'BPJS Ketenagakerjaan';
UPDATE pay_components SET rate = 1.5 WHERE nama = 'Lembur';

-- =====================================================
-- 7. VIEWS FOR REPORTING
-- =====================================================

-- Payroll Summary View
CREATE OR REPLACE VIEW payroll_summary AS
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
CREATE OR REPLACE VIEW employee_payroll_details AS
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
    ) as components
FROM payroll_lines pl
JOIN payroll_runs pr ON pl.payroll_run_id = pr.id
JOIN employees e ON pl.employee_id = e.id
LEFT JOIN payroll_line_components plc ON pl.id = plc.payroll_line_id
WHERE pl.deleted_at IS NULL AND pr.deleted_at IS NULL
GROUP BY pl.id, pr.id, pr.periode_awal, pr.periode_akhir, e.nama, e.jabatan, e.site, 
         pl.hari_kerja, pl.upah_harian, pl.bruto, pl.pajak_nominal, pl.neto, pl.status;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Supabase Payroll Calculator setup completed successfully!';
    RAISE NOTICE 'Tables created: users, login_activity, employees, pay_components, payroll_runs, payroll_lines, payroll_line_components, employee_component_selections';
    RAISE NOTICE 'RLS policies applied for all tables';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Views created: payroll_summary, employee_payroll_details';
    RAISE NOTICE 'Sample pay components inserted';
END $$;
