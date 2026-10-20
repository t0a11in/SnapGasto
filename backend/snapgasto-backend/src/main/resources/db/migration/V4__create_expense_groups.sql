CREATE TABLE dbo.expense_groups (
    id uniqueidentifier NOT NULL,
    name varchar(100) NOT NULL,
    created_by_user_id uniqueidentifier NOT NULL,
    created_at datetime2(6) NOT NULL,
    CONSTRAINT pk_expense_groups PRIMARY KEY (id),
    CONSTRAINT fk_expense_groups_created_by FOREIGN KEY (created_by_user_id) REFERENCES dbo.users (id)
);

CREATE TABLE dbo.expense_group_members (
    id uniqueidentifier NOT NULL,
    group_id uniqueidentifier NOT NULL,
    user_id uniqueidentifier NOT NULL,
    role varchar(20) NOT NULL,
    joined_at datetime2(6) NOT NULL,
    CONSTRAINT pk_expense_group_members PRIMARY KEY (id),
    CONSTRAINT uq_expense_group_members_group_user UNIQUE (group_id, user_id),
    CONSTRAINT ck_expense_group_members_role CHECK (role IN ('OWNER', 'MEMBER')),
    CONSTRAINT fk_expense_group_members_group FOREIGN KEY (group_id) REFERENCES dbo.expense_groups (id),
    CONSTRAINT fk_expense_group_members_user FOREIGN KEY (user_id) REFERENCES dbo.users (id)
);

CREATE INDEX ix_expense_group_members_user_id ON dbo.expense_group_members (user_id);

ALTER TABLE dbo.expenses ADD group_id uniqueidentifier NULL;
ALTER TABLE dbo.expenses ADD CONSTRAINT fk_expenses_group FOREIGN KEY (group_id) REFERENCES dbo.expense_groups (id);
CREATE INDEX ix_expenses_group_date ON dbo.expenses (group_id, expense_date);
