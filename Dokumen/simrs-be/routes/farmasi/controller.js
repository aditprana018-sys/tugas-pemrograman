const db = require('../../config/db');

const fields = ['id_registration', 'no_resep', 'total_harga'];

function isValidId(value) {
  if (
    typeof value !== 'number' &&
    (typeof value !== 'string' || value.trim() === '')
  ) {
    return false;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= 2147483647;
}

function isValidNumber(value) {
  return (
    (typeof value === 'number' ||
      (typeof value === 'string' && value.trim() !== '')) &&
    Number.isFinite(Number(value))
  );
}

function validateBody(body, partial) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Body harus berupa object';
  }

  const providedFields = fields.filter((field) =>
    Object.prototype.hasOwnProperty.call(body, field)
  );
  if (providedFields.length === 0 || (!partial && providedFields.length !== fields.length)) {
    return 'id_registration, no_resep, dan total_harga wajib diisi';
  }

  if (providedFields.some((field) => body[field] === null || body[field] === '')) {
    return 'Field farmasi tidak boleh kosong';
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'id_registration') &&
    !isValidId(body.id_registration)
  ) {
    return 'id_registration harus berupa ID registrasi yang valid';
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'no_resep') &&
    (typeof body.no_resep !== 'string' ||
      body.no_resep.trim() === '' ||
      body.no_resep.trim().length > 100)
  ) {
    return 'no_resep harus berupa teks 1-100 karakter';
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'total_harga') &&
    (!isValidNumber(body.total_harga) || Number(body.total_harga) < 0)
  ) {
    return 'total_harga harus berupa angka nol atau lebih';
  }

  return null;
}

module.exports = {
  listFarmasi: async (req, res) => {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM farmasi ORDER BY id DESC'
      );
      return res.json({ success: true, data: rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data farmasi',
      });
    }
  },

  getFarmasi: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ success: false, message: 'ID farmasi tidak valid' });
      }

      const [rows] = await db.execute('SELECT * FROM farmasi WHERE id = ?', [
        Number(req.params.id),
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data farmasi tidak ditemukan' });
      }
      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data farmasi',
      });
    }
  },

  createFarmasi: async (req, res) => {
    try {
      const body = req.body || {};
      const validationError = validateBody(body, false);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const [result] = await db.execute(
        `INSERT INTO farmasi (id_registration, no_resep, total_harga)
         SELECT id, ?, ? FROM registrasi_pasien WHERE id = ?`,
        [body.no_resep.trim(), Number(body.total_harga), Number(body.id_registration)]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data registrasi tidak ditemukan',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Farmasi berhasil disimpan',
        id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan farmasi' });
    }
  },

  updateFarmasi: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!isValidId(id)) {
        return res.status(400).json({ success: false, message: 'ID farmasi tidak valid' });
      }

      const body = req.body || {};
      const partial = req.method === 'PATCH';
      const validationError = validateBody(body, partial);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const [existing] = await db.execute('SELECT id FROM farmasi WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Data farmasi tidak ditemukan' });
      }

      if (Object.prototype.hasOwnProperty.call(body, 'id_registration')) {
        const [registrations] = await db.execute(
          'SELECT id FROM registrasi_pasien WHERE id = ?',
          [Number(body.id_registration)]
        );
        if (registrations.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Data registrasi tidak ditemukan',
          });
        }
      }

      const providedFields = fields.filter((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      );
      await db.execute(
        `UPDATE farmasi SET ${providedFields.map((field) => `${field} = ?`).join(', ')}
         WHERE id = ?`,
        [
          ...providedFields.map((field) =>
            field === 'no_resep' ? body[field].trim() : Number(body[field])
          ),
          id,
        ]
      );

      return res.json({ success: true, message: 'Farmasi berhasil diperbarui' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui farmasi' });
    }
  },

  deleteFarmasi: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!isValidId(id)) {
        return res.status(400).json({ success: false, message: 'ID farmasi tidak valid' });
      }

      const [result] = await db.execute('DELETE FROM farmasi WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Data farmasi tidak ditemukan' });
      }
      return res.json({ success: true, message: 'Farmasi berhasil dihapus' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal menghapus farmasi' });
    }
  },
};