const db = require('../../config/db');
const {
  isValidId,
  mapDatabaseError,
  normalizeValue,
  quoteIdentifier,
  validateBody,
} = require('../crud-controller-utils');

const config = {
  table: 'laboratorium',
  label: 'laboratorium',
  fields: [
    'codee',
    'name',
    'category',
    'price',
    'normal_value',
    'unit',
    'descripsion',
    'is_active',
    'created_at',
    'updated_at',
  ],
  numericFields: ['price'],
  booleanFields: ['is_active'],
};
const table = quoteIdentifier(config.table);

module.exports = {
  list: async (req, res) => {
    try {
      const [rows] = await db.execute(`SELECT * FROM ${table} ORDER BY id DESC`);
      return res.json({ success: true, data: rows });
    } catch (error) {
      return mapDatabaseError(error, res, config.label, 'mengambil data');
    }
  },
  getById: async (req, res) => {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: `ID ${config.label} tidak valid` });
    }
    try {
      const [rows] = await db.execute(`SELECT * FROM ${table} WHERE id = ?`, [Number(req.params.id)]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: `Data ${config.label} tidak ditemukan` });
      }
      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      return mapDatabaseError(error, res, config.label, 'mengambil data');
    }
  },
  create: async (req, res) => {
    const body = req.body;
    const validationError = validateBody(body, config, true, true);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
    const fields = config.fields.filter((field) => Object.prototype.hasOwnProperty.call(body, field));
    try {
      const [result] = await db.execute(
        `INSERT INTO ${table} (${fields.map(quoteIdentifier).join(', ')})
         VALUES (${fields.map(() => '?').join(', ')})`,
        fields.map((field) => normalizeValue(body[field]))
      );
      return res.status(201).json({
        success: true,
        message: 'laboratorium berhasil disimpan',
        id: result.insertId,
      });
    } catch (error) {
      return mapDatabaseError(error, res, config.label, 'menyimpan');
    }
  },
  update: async (req, res) => {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: `ID ${config.label} tidak valid` });
    }
    const body = req.body;
    const validationError = validateBody(body, config, true);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
    try {
      const [existing] = await db.execute(`SELECT id FROM ${table} WHERE id = ?`, [Number(req.params.id)]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: `Data ${config.label} tidak ditemukan` });
      }
      const fields = config.fields.filter((field) => Object.prototype.hasOwnProperty.call(body, field));
      await db.execute(
        `UPDATE ${table} SET ${fields.map((field) => `${quoteIdentifier(field)} = ?`).join(', ')}
         WHERE id = ?`,
        [...fields.map((field) => normalizeValue(body[field])), Number(req.params.id)]
      );
      return res.json({ success: true, message: 'laboratorium berhasil diperbarui' });
    } catch (error) {
      return mapDatabaseError(error, res, config.label, 'memperbarui');
    }
  },
  remove: async (req, res) => {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: `ID ${config.label} tidak valid` });
    }
    try {
      const [result] = await db.execute(`DELETE FROM ${table} WHERE id = ?`, [Number(req.params.id)]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: `Data ${config.label} tidak ditemukan` });
      }
      return res.json({ success: true, message: 'laboratorium berhasil dihapus' });
    } catch (error) {
      return mapDatabaseError(error, res, config.label, 'menghapus');
    }
  },
};
