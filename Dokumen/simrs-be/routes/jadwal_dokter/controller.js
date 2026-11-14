const db = require('../../config/db');

const fields = ['id_dokter', 'hari', 'jam_mulai', 'jam_selesai', 'kuota_pasien'];
const requiredFields = ['id_dokter', 'hari', 'jam_mulai', 'jam_selesai'];

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

function isValidTime(value) {
  if (typeof value !== 'string') return false;
  const match = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.exec(value);
  return Boolean(match);
}

function isValidQuota(value) {
  if (value === null) return true;
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return false;
  }
  const quota = Number(value);
  return Number.isSafeInteger(quota) && quota >= 0 && quota <= 2147483647;
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
    return 'id_dokter, hari, jam_mulai, dan jam_selesai wajib diisi';
  }

  if (
    Object.prototype.hasOwnProperty.call(body, 'id_dokter') &&
    !isValidId(body.id_dokter)
  ) {
    return 'id_dokter harus berupa ID dokter yang valid';
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'hari') &&
    (typeof body.hari !== 'string' || body.hari.trim() === '' || body.hari.trim().length > 20)
  ) {
    return 'hari harus berupa teks 1-20 karakter';
  }
  for (const field of ['jam_mulai', 'jam_selesai']) {
    if (Object.prototype.hasOwnProperty.call(body, field) && !isValidTime(body[field])) {
      return `${field} harus menggunakan format HH:mm atau HH:mm:ss`;
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'kuota_pasien') &&
    !isValidQuota(body.kuota_pasien)
  ) {
    return 'kuota_pasien harus berupa bilangan bulat nol atau lebih';
  }

  return null;
}

function isForeignKeyError(error) {
  return error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_NO_REFERENCED_ROW_2';
}

module.exports = {
  listJadwalDokter: async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM jadwal_dokter ORDER BY id DESC');
      return res.json({ success: true, data: rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil jadwal dokter' });
    }
  },

  getJadwalDokter: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ success: false, message: 'ID jadwal dokter tidak valid' });
      }

      const [rows] = await db.execute('SELECT * FROM jadwal_dokter WHERE id = ?', [
        Number(req.params.id),
      ]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data jadwal dokter tidak ditemukan',
        });
      }
      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil jadwal dokter' });
    }
  },

  createJadwalDokter: async (req, res) => {
    try {
      const body = req.body || {};
      const validationError = validateBody(body, true);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const [dokter] = await db.execute('SELECT id FROM dokter WHERE id = ?', [
        Number(body.id_dokter),
      ]);
      if (dokter.length === 0) {
        return res.status(404).json({ success: false, message: 'Data dokter tidak ditemukan' });
      }

      const columns = fields.filter((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      );
      const [result] = await db.execute(
        `INSERT INTO jadwal_dokter (${columns.join(', ')})
         VALUES (${columns.map(() => '?').join(', ')})`,
        columns.map((field) =>
          field === 'id_dokter' || field === 'kuota_pasien'
            ? body[field] === null ? null : Number(body[field])
            : body[field].trim()
        )
      );
      return res.status(201).json({
        success: true,
        message: 'Jadwal dokter berhasil disimpan',
        id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      if (isForeignKeyError(error)) {
        return res.status(404).json({ success: false, message: 'Data dokter tidak ditemukan' });
      }
      return res.status(500).json({ success: false, message: 'Gagal menyimpan jadwal dokter' });
    }
  },

  updateJadwalDokter: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!isValidId(id)) {
        return res.status(400).json({ success: false, message: 'ID jadwal dokter tidak valid' });
      }

      const body = req.body || {};
      const validationError = validateBody(body, req.method === 'PATCH');
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const [existing] = await db.execute('SELECT id FROM jadwal_dokter WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data jadwal dokter tidak ditemukan',
        });
      }

      if (Object.prototype.hasOwnProperty.call(body, 'id_dokter')) {
        const [dokter] = await db.execute('SELECT id FROM dokter WHERE id = ?', [
          Number(body.id_dokter),
        ]);
        if (dokter.length === 0) {
          return res.status(404).json({ success: false, message: 'Data dokter tidak ditemukan' });
        }
      }

      const providedFields = fields.filter((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      );
      await db.execute(
        `UPDATE jadwal_dokter SET ${providedFields.map((field) => `${field} = ?`).join(', ')}
         WHERE id = ?`,
        [
          ...providedFields.map((field) =>
            field === 'id_dokter' || field === 'kuota_pasien'
              ? body[field] === null ? null : Number(body[field])
              : body[field].trim()
          ),
          id,
        ]
      );
      return res.json({ success: true, message: 'Jadwal dokter berhasil diperbarui' });
    } catch (error) {
      console.error(error);
      if (isForeignKeyError(error)) {
        return res.status(404).json({ success: false, message: 'Data dokter tidak ditemukan' });
      }
      return res.status(500).json({ success: false, message: 'Gagal memperbarui jadwal dokter' });
    }
  },

  deleteJadwalDokter: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({ success: false, message: 'ID jadwal dokter tidak valid' });
      }

      const [result] = await db.execute('DELETE FROM jadwal_dokter WHERE id = ?', [
        Number(req.params.id),
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data jadwal dokter tidak ditemukan',
        });
      }
      return res.json({ success: true, message: 'Jadwal dokter berhasil dihapus' });
    } catch (error) {
      console.error(error);
      if (isForeignKeyError(error)) {
        return res.status(409).json({
          success: false,
          message: 'Jadwal dokter tidak dapat dihapus karena masih digunakan',
        });
      }
      return res.status(500).json({ success: false, message: 'Gagal menghapus jadwal dokter' });
    }
  },
};