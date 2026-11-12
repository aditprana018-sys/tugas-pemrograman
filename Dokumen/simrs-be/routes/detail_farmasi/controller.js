const db = require('../../config/db');

const fields = [
  'id_farmasi',
  'nama_obat',
  'qty_obat',
  'satuan_obat',
  'harga_obat',
  'total_obat',
];

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
    return 'Semua field detail farmasi wajib diisi';
  }
  if (providedFields.some((field) => body[field] === null || body[field] === '')) {
    return 'Field detail farmasi tidak boleh kosong';
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'id_farmasi') &&
    !isValidId(body.id_farmasi)
  ) {
    return 'id_farmasi harus berupa ID farmasi yang valid';
  }
  for (const field of ['nama_obat', 'satuan_obat']) {
    if (
      Object.prototype.hasOwnProperty.call(body, field) &&
      (typeof body[field] !== 'string' ||
        body[field].trim() === '' ||
        body[field].trim().length > (field === 'nama_obat' ? 255 : 50))
    ) {
      return `${field} harus berupa teks yang tidak kosong`;
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'qty_obat') &&
    (!isValidNumber(body.qty_obat) ||
      !Number.isSafeInteger(Number(body.qty_obat)) ||
      Number(body.qty_obat) < 1 ||
      Number(body.qty_obat) > 2147483647)
  ) {
    return 'qty_obat harus berupa bilangan bulat positif';
  }
  for (const field of ['harga_obat', 'total_obat']) {
    if (
      Object.prototype.hasOwnProperty.call(body, field) &&
      (!isValidNumber(body[field]) || Number(body[field]) < 0)
    ) {
      return `${field} harus berupa angka nol atau lebih`;
    }
  }

  return null;
}

module.exports = {
  listDetailFarmasi: async (req, res) => {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM detail_farmasi ORDER BY id DESC'
      );
      return res.json({ success: true, data: rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data detail farmasi',
      });
    }
  },

  getDetailFarmasi: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: 'ID detail farmasi tidak valid',
        });
      }

      const [rows] = await db.execute(
        'SELECT * FROM detail_farmasi WHERE id = ?',
        [Number(req.params.id)]
      );
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data detail farmasi tidak ditemukan',
        });
      }
      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data detail farmasi',
      });
    }
  },

  createDetailFarmasi: async (req, res) => {
    try {
      const body = req.body || {};
      const validationError = validateBody(body, false);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const [result] = await db.execute(
        `INSERT INTO detail_farmasi
         (id_farmasi, nama_obat, qty_obat, satuan_obat, harga_obat, total_obat)
         SELECT id, ?, ?, ?, ?, ? FROM farmasi WHERE id = ?`,
        [
          body.nama_obat.trim(),
          Number(body.qty_obat),
          body.satuan_obat.trim(),
          Number(body.harga_obat),
          Number(body.total_obat),
          Number(body.id_farmasi),
        ]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data farmasi tidak ditemukan',
        });
      }
      return res.status(201).json({
        success: true,
        message: 'Detail farmasi berhasil disimpan',
        id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan detail farmasi',
      });
    }
  },

  updateDetailFarmasi: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!isValidId(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID detail farmasi tidak valid',
        });
      }

      const body = req.body || {};
      const partial = req.method === 'PATCH';
      const validationError = validateBody(body, partial);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const [existing] = await db.execute(
        'SELECT id FROM detail_farmasi WHERE id = ?',
        [id]
      );
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data detail farmasi tidak ditemukan',
        });
      }

      if (Object.prototype.hasOwnProperty.call(body, 'id_farmasi')) {
        const [farmasi] = await db.execute('SELECT id FROM farmasi WHERE id = ?', [
          Number(body.id_farmasi),
        ]);
        if (farmasi.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Data farmasi tidak ditemukan',
          });
        }
      }

      const providedFields = fields.filter((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      );
      await db.execute(
        `UPDATE detail_farmasi SET ${providedFields
          .map((field) => `${field} = ?`)
          .join(', ')} WHERE id = ?`,
        [
          ...providedFields.map((field) =>
            typeof body[field] === 'string' ? body[field].trim() : Number(body[field])
          ),
          id,
        ]
      );
      return res.json({
        success: true,
        message: 'Detail farmasi berhasil diperbarui',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui detail farmasi',
      });
    }
  },

  deleteDetailFarmasi: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!isValidId(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID detail farmasi tidak valid',
        });
      }

      const [result] = await db.execute('DELETE FROM detail_farmasi WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data detail farmasi tidak ditemukan',
        });
      }
      return res.json({
        success: true,
        message: 'Detail farmasi berhasil dihapus',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus detail farmasi',
      });
    }
  },
};