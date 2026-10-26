-- Etapa "Proyectos": gastos futuros planificados (compras, recurrentes y ahorro).

CREATE TABLE dbo.projects (
    id uniqueidentifier NOT NULL,
    user_id uniqueidentifier NOT NULL,
    name varchar(120) NOT NULL,
    project_type varchar(20) NOT NULL,
    category varchar(80) NOT NULL,
    priority varchar(10) NOT NULL,
    status varchar(20) NOT NULL,
    notes varchar(500) NULL,
    target_amount decimal(14, 2) NULL,
    target_date date NULL,
    reference_price decimal(14, 2) NULL,
    reference_source varchar(120) NULL,
    reference_url varchar(500) NULL,
    reference_at datetime2(6) NULL,
    recurring_amount decimal(14, 2) NULL,
    frequency varchar(10) NULL,
    day_of_month int NULL,
    start_date date NULL,
    end_date date NULL,
    payment_method varchar(60) NULL,
    notify_days_before int NOT NULL CONSTRAINT df_projects_notify_days_before DEFAULT 3,
    last_generated_on date NULL,
    last_notified_on date NULL,
    expense_id uniqueidentifier NULL,
    created_at datetime2(6) NOT NULL,
    updated_at datetime2(6) NOT NULL,
    CONSTRAINT pk_projects PRIMARY KEY (id),
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE,
    CONSTRAINT ck_projects_type CHECK (project_type IN ('COMPRA', 'RECURRENTE', 'AHORRO')),
    CONSTRAINT ck_projects_priority CHECK (priority IN ('ALTA', 'MEDIA', 'BAJA')),
    CONSTRAINT ck_projects_status CHECK (status IN ('PLANIFICADO', 'EN_CURSO', 'PAUSADO', 'COMPLETADO', 'CANCELADO')),
    CONSTRAINT ck_projects_frequency CHECK (frequency IS NULL OR frequency IN ('MENSUAL', 'ANUAL')),
    CONSTRAINT ck_projects_day_of_month CHECK (day_of_month IS NULL OR day_of_month BETWEEN 1 AND 28)
);

CREATE INDEX ix_projects_user_id ON dbo.projects (user_id);
CREATE INDEX ix_projects_type_status ON dbo.projects (project_type, status);

CREATE TABLE dbo.project_movements (
    id uniqueidentifier NOT NULL,
    project_id uniqueidentifier NOT NULL,
    movement_kind varchar(10) NOT NULL,
    amount decimal(14, 2) NOT NULL,
    movement_date date NOT NULL,
    note varchar(200) NULL,
    created_at datetime2(6) NOT NULL,
    CONSTRAINT pk_project_movements PRIMARY KEY (id),
    CONSTRAINT fk_project_movements_project FOREIGN KEY (project_id) REFERENCES dbo.projects (id) ON DELETE CASCADE,
    CONSTRAINT ck_project_movements_kind CHECK (movement_kind IN ('APORTE', 'RETIRO')),
    CONSTRAINT ck_project_movements_amount CHECK (amount > 0)
);

CREATE INDEX ix_project_movements_project_date ON dbo.project_movements (project_id, movement_date);

CREATE TABLE dbo.project_skipped_months (
    id uniqueidentifier NOT NULL,
    project_id uniqueidentifier NOT NULL,
    skipped_month varchar(7) NOT NULL,
    CONSTRAINT pk_project_skipped_months PRIMARY KEY (id),
    CONSTRAINT uq_project_skipped_months UNIQUE (project_id, skipped_month),
    CONSTRAINT fk_project_skipped_months_project FOREIGN KEY (project_id) REFERENCES dbo.projects (id) ON DELETE CASCADE
);

-- Gastos generados por un proyecto (recurrente o compra concretada).
-- Sin cascada desde projects: la API desvincula los gastos antes de eliminar un proyecto
-- (SQL Server rechazaría SET NULL por la doble ruta de cascada users -> projects -> expenses).
ALTER TABLE dbo.expenses ADD project_id uniqueidentifier NULL;
ALTER TABLE dbo.expenses ADD is_generated bit NOT NULL CONSTRAINT df_expenses_is_generated DEFAULT 0;
ALTER TABLE dbo.expenses ADD CONSTRAINT fk_expenses_project FOREIGN KEY (project_id) REFERENCES dbo.projects (id);
CREATE INDEX ix_expenses_project_date ON dbo.expenses (project_id, expense_date);
