-- ============================================================
--  QR Attendance System — MySQL Schema
--  Run this in your lms_db MySQL database
-- ============================================================

-- System Settings Table (key-value store for QR secret, office GPS, etc.)
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key   VARCHAR(100)  PRIMARY KEY,
    setting_value VARCHAR(500)  NOT NULL
);

-- Time Tracking Table (punch-in / punch-out sessions per user per day)
CREATE TABLE IF NOT EXISTS time_tracking (
    id             BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT        NOT NULL,
    date           DATE          NOT NULL,
    login_time     DATETIME      NOT NULL,
    logout_time    DATETIME      NULL,
    total_minutes  INT           NULL,
    created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tt_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Default QR secret (auto-generated UUID — will be updated by the app on first run)
INSERT IGNORE INTO system_settings (setting_key, setting_value)
VALUES
    ('active_qr_secret',    UUID()),
    ('office_latitude',     '0.0'),
    ('office_longitude',    '0.0'),
    ('office_radius_meters','200'),
    ('late_threshold_time', '10:00');
