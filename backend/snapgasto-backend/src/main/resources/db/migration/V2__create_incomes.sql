CREATE TABLE dbo.incomes (
    id uniqueidentifier NOT NULL,
    amount decimal(14, 2) NOT NULL,
    income_type varchar(20) NOT NULL,
    income_date date NOT NULL,
    description varchar(500) NULL,
    user_id uniqueidentifier NOT NULL,
    created_at datetime2(6) NOT NULL,
    CONSTRAINT pk_incomes PRIMARY KEY (id),
    CONSTRAINT ck_incomes_type CHECK (income_type IN ('TARJETA', 'FISICO')),
    CONSTRAINT fk_incomes_user FOREIGN KEY (user_id) REFERENCES dbo.users (id)
);

CREATE INDEX ix_incomes_user_date ON dbo.incomes (user_id, income_date);
