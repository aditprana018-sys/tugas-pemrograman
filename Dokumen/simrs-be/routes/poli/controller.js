const db = require('../../config/db');

const fields = ['id_jadwal', 'nama_poli', 'keterangan'];
const requiredFields = ['id_jadwal', 'nama_poli'];

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
    (!partial && requiredFields.some((field) => !Object.prototype.hasOwnProperty.call(body, field)))
  ) {
    return 'id_jadwal dan nama_poli wajib diisi';
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'id_jadwal') &&
    !isValidId(body.id_jadwal)
  ) {
    return 'id_jadwal harus berupa ID jadwal dokter yang valid';
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'nama_poli') &&
    (typeof body.nama_poli !== 'string' ||
      body.nama_poli.trim() === '' ||
      body.nama_poli.trim().length > 100)
  ) {
    return 'nama_poli harus berupa teks 1-100 karakter';
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'keterangan') &&
    body.keterangan !== null &&
    typeof body.keterangan !== 'string'
  ) {
    return 'keterangan harus berupa teks atau null';
  }

  return null;
}

function isForeignKeyError(error) {
  return error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_NO_REFERENCED_ROW_2';
}

module.exports = {
  listPoli: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM poli ORDER BY id DESC');
      return res.json({ success: true, data: rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data poli' });
    }
  },

  getPoli: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ success: false, message: 'ID poli tidak valid' });
      }

      const [rows] = await db.execute('SELECT * FROM poli WHERE id = ?', [
        Number(req.params.id),
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data poli tidak ditemukan' });
      }
      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data poli' });
    }
  },

  createPoli: async (req, res) => {
    try {
      const body = req.body || {};
      const validationError = validateBody(body, true);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const [jadwal] = await db.execute('SELECT id FROM jadwal_dokter WHERE id = ?', [
        Number(body.id_jadwal),
      ]);
      if (jadwal.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data jadwal dokter tidak ditemukan',
        });
      }

      const providedFields = fields.filter((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      );
      const [result] = await db.execute(
        `INSERT INTO poli (${providedFields.join(', ')})
         VALUES (${providedFields.map(() => '?').join(', ')})`,
        providedFields.map((field) =>
          field === 'id_jadwal'
            ? Number(body[field])
            : body[field] === null ? null : body[field].trim()
        )
      );
      return res.status(201).json({
        success: true,
        message: 'Poli berhasil disimpan',
        id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      if (isForeignKeyError(error)) {
        return res.status(404).json({
          success: false,
          message: 'Data jadwal dokter tidak ditemukan',
        });
      }
      return res.status(500).json({ success: false, message: 'Gagal menyimpan poli' });
    }
  },

  updatePoli: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!isValidId(id)) {
        return res.status(400).json({ success: false, message: 'ID poli tidak valid' });
      }

      const body = req.body || {};
      const validationError = validateBody(body, req.method === 'PATCH');
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const [existing] = await db.execute('SELECT id FROM poli WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Data poli tidak ditemukan' });
      }

      if (Object.prototype.hasOwnProperty.call(body, 'id_jadwal')) {
        const [jadwal] = await db.execute('SELECT id FROM jadwal_dokter WHERE id = ?', [
          Number(body.id_jadwal),
        ]);
        if (jadwal.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Data jadwal dokter tidak ditemukan',
          });
        }
      }

      const providedFields = fields.filter((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      );
      await db.execute(
        `UPDATE poli SET ${providedFields.map((field) => `${field} = ?`).join(', ')}
         WHERE id = ?`,
        [
          ...providedFields.map((field) =>
            field === 'id_jadwal'
              ? Number(body[field])
              : body[field] === null ? null : body[field].trim()
          ),
          id,
        ]
      );
      return res.json({ success: true, message: 'Poli berhasil diperbarui' });
    } catch (error) {
      console.error(error);
      if (isForeignKeyError(error)) {
        return res.status(404).json({
          success: false,
          message: 'Data jadwal dokter tidak ditemukan',
        });
      }
      return res.status(500).json({ success: false, message: 'Gagal memperbarui poli' });
    }
  },

  deletePoli: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ success: false, message: 'ID poli tidak valid' });
      }

      const [result] = await db.execute('DELETE FROM poli WHERE id = ?', [
        Number(req.params.id),
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Data poli tidak ditemukan' });
      }
      return res.json({ success: true, message: 'Poli berhasil dihapus' });
    } catch (error) {
      console.error(error);
      if (isForeignKeyError(error)) {
        return res.status(409).json({
          success: false,
          message: 'Poli tidak dapat dihapus karena masih digunakan',
        });
      }
      return res.status(500).json({ success: false, message: 'Gagal menghapus poli' });
    }
  },
};