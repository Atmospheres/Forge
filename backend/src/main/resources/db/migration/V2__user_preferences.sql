CREATE TABLE user_preferences (
    owner_sub VARCHAR(255) PRIMARY KEY,
    theme VARCHAR(10) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
