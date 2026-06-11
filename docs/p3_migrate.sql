-- P3 DB 마이그레이션 SQL
-- 서버에서 실행: mysql -u root -p homefit < docs/p3_migrate.sql
-- 또는 MariaDB 클라이언트에서 직접 실행

USE homefit;

-- 1. 강의 가격 컬럼
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price INT DEFAULT 0;

-- 2. 결제 테이블
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  amount INT NOT NULL,
  status ENUM('pending','completed','refunded') DEFAULT 'completed',
  payment_method VARCHAR(50),
  card_last4 CHAR(4),
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 3. 정산 테이블
CREATE TABLE IF NOT EXISTS settlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instructor_id INT NOT NULL,
  course_id INT NOT NULL,
  period VARCHAR(7) NOT NULL,
  revenue INT DEFAULT 0,
  payout_rate DECIMAL(3,2) DEFAULT 0.70,
  payout_amount INT DEFAULT 0,
  status ENUM('pending','paid') DEFAULT 'pending',
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (instructor_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  UNIQUE KEY uq_settlement (instructor_id, course_id, period)
);

-- 4. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  related_id INT,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. 활동 로그 테이블
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT NOW()
);

-- 6. 이메일 구독 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('weekly_digest','course_update','promotion') DEFAULT 'weekly_digest',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT NOW(),
  UNIQUE KEY uq_user_type (user_id, type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_lecture ON progress(lecture_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_course ON payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_lectures_course ON lectures(course_id, order_num);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

SELECT 'P3 마이그레이션 완료' AS status;
