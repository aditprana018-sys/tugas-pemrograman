const db = require('../../config/db');

const fields = ['nama_dokter', 'spesialisasi', 'no_telp', 'alamat'];

function isValidId(value) {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return false;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= 2147483647;
}

function validateBody(body, partial) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Body harus berupa object';
  }

  const providedFields = fields.filter((field) =>
    Object.prototype.hasOwnProperty.call(body, field)
  );
  if (
    providedFields.length === 0 ||
    (!partial && fields.some((field) => !Object.prototype.hasOwnProperty.call(body, field)))
  ) {
    return 'nama_dokter, spesialisasi, no_telp, dan alamat wajib disertakan';
  }

  for (const field of providedFields) {
    const value = body[field];
    if (field === 'nama_dokter' && (typeof value !== 'string' || value.trim() === '')) {
      return 'nama_dokter wajib berupa teks yang tidak kosong';
    }
    if (value === null && field !== 'nama_dokter') {
      continue;
    }
    if (
      typeof value !== 'string' ||
      value.trim() === '' ||
      (field !== 'alamat' && value.trim().length > (field === 'no_telp' ? 15 : 100))
    ) {
      return `${field} tidak valid`;
    }
  }

  return null;
}

function valueFor(field, value) {
  return typeof value === 'string' ? value.trim() : value;
}

function isForeignKeyError(error) {
  return error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_NO_REFERENCED_ROW_2';
}

module.exports = {
  listDokter: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM dokter ORDER BY id DESC');
      return res.json({ success: true, data: rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data dokter' });
    }
  },

  getDokter: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ success: false, message: 'ID dokter tidak valid' });
      }

      const [rows] = await db.execute('SELECT * FROM dokter WHERE id = ?', [
        Number(req.params.id),
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data dokter tidak ditemukan' });
      }
      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data dokter' });
    }
  },

  createDokter: async (req, res) => {
    try {
      const body = req.body || {};
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ success: false, message: 'Body harus berupa object' });
      }
      if (!Object.prototype.hasOwnProperty.call(body, 'nama_dokter')) {
        return res.status(400).json({
          success: false,
          message: 'nama_dokter wajib berupa teks yang tidak kosong',
        });
      }
      const validationError = validateBody(body, true);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const providedFields = fields.filter((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      );
      const [result] = await db.execute(
        `INSERT INTO dokter (${providedFields.join(', ')})
         VALUES (${providedFields.map(() => '?').join(', ')})`,
        providedFields.map((field) => valueFor(field, body[field]))
      );
      return res.status(201).json({
        success: true,
        message: 'Dokter berhasil disimpan',
        id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan dokter' });
    }
  },

  updateDokter: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!isValidId(id)) {
        return res.status(400).json({ success: false, message: 'ID dokter tidak valid' });
      }

      const body = req.body || {};
      const validationError = validateBody(body, req.method === 'PATCH');
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const [existing] = await db.execute('SELECT id FROM dokter WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Data dokter tidak ditemukan' });
      }

      const providedFields = fields.filter((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      );
      await db.execute(
        `UPDATE dokter SET ${providedFields.map((field) => `${field} = ?`).join(', ')}
         WHERE id = ?`,
        [...providedFields.map((field) => valueFor(field, body[field])), id]
      );
      return res.json({ success: true, message: 'Dokter berhasil diperbarui' });
    } catch (error) {
      console.error(error);
      if (isForeignKeyError(error)) {
        return res.status(409).json({
          success: false,
          message: 'Dokter tidak dapat diperbarui karena masih digunakan',
        });
      }
      return res.status(500).json({ success: false, message: 'Gagal memperbarui dokter' });
    }
  },

  deleteDokter: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ success: false, message: 'ID dokter tidak valid' });
      }

      const [result] = await db.execute('DELETE FROM dokter WHERE id = ?', [
        Number(req.params.id),
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Data dokter tidak ditemukan' });
      }
      return res.json({ success: true, message: 'Dokter berhasil dihapus' });
    } catch (error) {
      console.error(error);
      if (isForeignKeyError(error)) {
        return res.status(409).json({
          success: false,
          message: 'Dokter tidak dapat dihapus karena masih digunakan',
        });
      }
      return res.status(500).json({ success: false, message: 'Gagal menghapus dokter' });
    }
  },
};