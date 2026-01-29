import pool from '../config/database';

interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: Date;
}

interface CreateSupplierInput {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface UpdateSupplierInput {
  name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

class SupplierModel {
  // Create supplier
  async create(supplierData: CreateSupplierInput): Promise<Supplier> {
    const { name, contact_person, email, phone, address } = supplierData;

    const query = `
      INSERT INTO suppliers (name, contact_person, email, phone, address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      name,
      contact_person || null,
      email || null,
      phone || null,
      address || null,
    ];
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  // Get all suppliers
  async findAll(): Promise<Supplier[]> {
    const query = 'SELECT * FROM suppliers ORDER BY name ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Get supplier by ID
  async findById(id: number): Promise<Supplier | null> {
    const query = 'SELECT * FROM suppliers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Get supplier by name
  async findByName(name: string): Promise<Supplier | null> {
    const query = 'SELECT * FROM suppliers WHERE name = $1';
    const result = await pool.query(query, [name]);
    return result.rows[0] || null;
  }

  // Update supplier
  async update(
    id: number,
    supplierData: UpdateSupplierInput,
  ): Promise<Supplier | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (supplierData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(supplierData.name);
    }
    if (supplierData.contact_person !== undefined) {
      fields.push(`contact_person = $${paramCount++}`);
      values.push(supplierData.contact_person);
    }
    if (supplierData.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(supplierData.email);
    }
    if (supplierData.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(supplierData.phone);
    }
    if (supplierData.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(supplierData.address);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE suppliers
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete supplier
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM suppliers WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export default new SupplierModel();
