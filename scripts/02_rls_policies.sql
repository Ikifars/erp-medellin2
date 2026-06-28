-- ============================================
-- ERP SYSTEM - RLS POLICIES
-- Execute after 01_schema.sql
-- ============================================

-- RLS Policies for profiles
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for categories (all authenticated users can read, admin/gerente can modify)
CREATE POLICY "select_categories" ON categories FOR SELECT
  TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente')));

CREATE POLICY "update_categories" ON categories FOR UPDATE
  TO authenticated USING (deleted_at IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente')));

CREATE POLICY "delete_categories" ON categories FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for products (all authenticated users can read)
CREATE POLICY "select_products" ON products FOR SELECT
  TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente')));

CREATE POLICY "update_products" ON products FOR UPDATE
  TO authenticated USING (deleted_at IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')));

CREATE POLICY "delete_products" ON products FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for stock_movements
CREATE POLICY "select_stock_movements" ON stock_movements FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_stock_movements" ON stock_movements FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')));

-- RLS Policies for customers
CREATE POLICY "select_customers" ON customers FOR SELECT
  TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "insert_customers" ON customers FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')));

CREATE POLICY "update_customers" ON customers FOR UPDATE
  TO authenticated USING (deleted_at IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')));

CREATE POLICY "delete_customers" ON customers FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for orders
CREATE POLICY "select_orders" ON orders FOR SELECT
  TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "insert_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')));

CREATE POLICY "update_orders" ON orders FOR UPDATE
  TO authenticated USING (deleted_at IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')));

CREATE POLICY "delete_orders" ON orders FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for order_items
CREATE POLICY "select_order_items" ON order_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')));

CREATE POLICY "delete_order_items" ON order_items FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'operador')));

-- RLS Policies for financial_transactions
CREATE POLICY "select_financial_transactions" ON financial_transactions FOR SELECT
  TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "insert_financial_transactions" ON financial_transactions FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente')));

CREATE POLICY "update_financial_transactions" ON financial_transactions FOR UPDATE
  TO authenticated USING (deleted_at IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente')));

CREATE POLICY "delete_financial_transactions" ON financial_transactions FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for audit_logs (read-only for admin)
CREATE POLICY "select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);
