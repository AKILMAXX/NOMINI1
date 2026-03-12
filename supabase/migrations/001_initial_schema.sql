-- ============================================================
-- NOMINI - Schema inicial de base de datos
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: empleados
-- ============================================================
CREATE TABLE IF NOT EXISTS empleados (
  id           TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  name         TEXT NOT NULL,
  position     TEXT NOT NULL,
  department   TEXT NOT NULL,
  base_weekly_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  weekly_bonus NUMERIC(12, 2) NOT NULL DEFAULT 0,
  hire_date    DATE NOT NULL,
  avatar_url   TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: prestamos (Loans)
-- ============================================================
CREATE TABLE IF NOT EXISTS prestamos (
  id                  TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  employee_id         TEXT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  amount              NUMERIC(12, 2) NOT NULL,
  total_weeks         INT NOT NULL,
  remaining_weeks     INT NOT NULL,
  weekly_installment  NUMERIC(12, 2) NOT NULL,
  date_requested      DATE NOT NULL DEFAULT CURRENT_DATE,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'cancelled')),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: penalizaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS penalizaciones (
  id                  TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  employee_id         TEXT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  category            TEXT NOT NULL CHECK (category IN ('Puntualidad', 'Abandono', 'Descuido Físico', 'Consumo', 'Disciplina')),
  reason              TEXT NOT NULL,
  amount              NUMERIC(12, 2) NOT NULL,
  total_weeks         INT NOT NULL,
  remaining_weeks     INT NOT NULL,
  weekly_installment  NUMERIC(12, 2) NOT NULL,
  date_created        DATE NOT NULL DEFAULT CURRENT_DATE,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cleared')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: nominas_semanales (PayrollWeek)
-- ============================================================
CREATE TABLE IF NOT EXISTS nominas_semanales (
  id                   TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  date                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  label                TEXT NOT NULL,
  summaries            JSONB NOT NULL DEFAULT '[]',
  total_disbursement   NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: asistencia_semanal (AttendanceRecord por semana)
-- ============================================================
CREATE TABLE IF NOT EXISTS asistencia_semanal (
  id           TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  employee_id  TEXT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  week_start   DATE NOT NULL,
  days         JSONB NOT NULL DEFAULT '[]',  -- array de 7: 'worked'|'absent'|'holiday'
  extra_hours  INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, week_start)
);

-- ============================================================
-- TABLA: estados_empleados (StatusRecord)
-- ============================================================
CREATE TABLE IF NOT EXISTS estados_empleados (
  employee_id         TEXT PRIMARY KEY REFERENCES empleados(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Despedido', 'Renunció', 'Suspendido')),
  suspension_end_date TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Activar para producción segura
-- ============================================================
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominas_semanales ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_empleados ENABLE ROW LEVEL SECURITY;

-- Política permisiva para usuario autenticado (ajustar según necesidades)
CREATE POLICY "Allow all for authenticated" ON empleados FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON prestamos FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON penalizaciones FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON nominas_semanales FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON asistencia_semanal FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON estados_empleados FOR ALL USING (true);

-- ============================================================
-- DATOS INICIALES (seed)
-- ============================================================
INSERT INTO empleados (id, name, position, department, base_weekly_salary, weekly_bonus, hire_date, avatar_url)
VALUES
  ('1', 'Marcus V. Chen',   'Líder de Logística',      'Logística',     50, 0, '2021-03-15', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'),
  ('2', 'Elena Rodríguez',  'Gerente de Operaciones',  'Operaciones',   50, 0, '2019-11-22', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'),
  ('3', 'David K. Wu',      'Supervisor de Flota',     'Flota',         50, 0, '2023-01-10', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'),
  ('4', 'Sofía Martínez',   'Administradora de RRHH',  'Administración',50, 0, '2022-06-05', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop')
ON CONFLICT (id) DO NOTHING;

INSERT INTO estados_empleados (employee_id, status)
VALUES ('1', 'Activo'), ('2', 'Activo'), ('3', 'Activo'), ('4', 'Activo')
ON CONFLICT (employee_id) DO NOTHING;
