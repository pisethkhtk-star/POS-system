CREATE TABLE inventory_logs (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id),
  type VARCHAR(20) CHECK (type IN ('IN', 'OUT', 'ADJUST')),
  quantity INT NOT NULL,
  before_qty INT,
  after_qty INT,
  note TEXT,
  user_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
