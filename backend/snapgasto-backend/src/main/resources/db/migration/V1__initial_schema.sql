CREATE TABLE dbo.users (
    id uniqueidentifier NOT NULL,
    full_name varchar(120) NOT NULL,
    email varchar(180) NOT NULL,
    password varchar(255) NOT NULL,
    firebase_uid varchar(128) NULL,
    role varchar(20) NOT NULL,
    created_at datetime2(6) NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE dbo.categories (
    id uniqueidentifier NOT NULL,
    name varchar(80) NOT NULL,
    icon varchar(80) NULL,
    color_hex varchar(7) NULL,
    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT uq_categories_name UNIQUE (name)
);

CREATE TABLE dbo.expenses (
    id uniqueidentifier NOT NULL,
    amount decimal(14, 2) NOT NULL,
    category varchar(80) NOT NULL,
    expense_date date NOT NULL,
    description varchar(500) NULL,
    payment_method varchar(60) NOT NULL,
    user_id uniqueidentifier NOT NULL,
    created_at datetime2(6) NOT NULL,
    CONSTRAINT pk_expenses PRIMARY KEY (id),
    CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES dbo.users (id)
);

CREATE INDEX ix_expenses_user_id ON dbo.expenses (user_id);

CREATE TABLE dbo.notifications (
    id uniqueidentifier NOT NULL,
    title varchar(140) NOT NULL,
    body varchar(1000) NOT NULL,
    is_read bit NOT NULL,
    user_id uniqueidentifier NOT NULL,
    created_at datetime2(6) NOT NULL,
    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES dbo.users (id)
);

CREATE INDEX ix_notifications_user_id ON dbo.notifications (user_id);
