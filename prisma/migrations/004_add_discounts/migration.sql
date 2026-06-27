CREATE TABLE discounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(20) CHECK (type IN ('PERCENT', 'FIXED')),
  value DECIMAL(10,2),
  min_purchase DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true
);
