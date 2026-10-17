CREATE TABLE dbo.revoked_tokens (
    token_hash char(64) NOT NULL,
    expires_at datetime2(6) NOT NULL,
    revoked_at datetime2(6) NOT NULL,
    CONSTRAINT pk_revoked_tokens PRIMARY KEY (token_hash)
);

CREATE INDEX ix_revoked_tokens_expires_at ON dbo.revoked_tokens (expires_at);
