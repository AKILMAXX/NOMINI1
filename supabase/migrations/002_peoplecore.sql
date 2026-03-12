-- ============================================================
-- NOMINI → PeopleCore | Migración 002
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- Campo cumpleaños en empleados
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

-- Nueva tabla de tareas
CREATE TABLE IF NOT EXISTS tareas (
  id          TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  employee_id TEXT REFERENCES empleados(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  frequency   TEXT NOT NULL CHECK (frequency IN ('única', 'semanal', 'mensual')),
  review_day  INT,      -- semanal: 0=Lun…6=Dom | mensual: 1-28
  due_date    DATE,     -- solo para frecuencia 'única'
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for tareas" ON tareas FOR ALL USING (true);
