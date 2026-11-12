const db = require('../../config/db');

module.exports = {
  listRegistration: async (req, res) => {
    try {
      const page = req.query.page === undefined ? 1 : Number(req.query.page);
      const size = req.query.size === undefined ? 10 : Number(req.query.size);

      if (
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(size) ||
        size < 1
      ) {
        return res.status(400).json({
          success: false,
          message: 'page and size must be positive integers',
        });
      }

      const offset = (page - 1) * size;
      if (!Number.isSafeInteger(offset)) {
        return res.status(400).json({
          success: false,
          message: 'page and size must be positive integers',
        });
      }

      const [[countRows], [rows]] = await Promise.all([
        db.query('SELECT COUNT(*) AS total FROM registrasi_pasien'),
        db.execute(
          'SELECT * FROM registrasi_pasien ORDER BY id DESC LIMIT ? OFFSET ?',
          [size, offset]
        ),
      ]);
      const total = countRows[0].total;

      res.json({
        success: true,
        data: rows,
        pagination: {
          page,
          size,
          total,
          totalPages: Math.ceil(total / size),
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch registrasi_pasien',
      });
    }
  },
  saveRegistration: async (req, res) => {
    try {
      const { no_rm, nik, nama_pasien, tanggal_lahir, poli, statuss } = req.body;

      if (typeof nik !== 'string' || !/^\d{16}$/.test(nik)) {
        return res.status(400).json({
          success: false,
          message: 'NIK harus 16 angka',
        });
      }

      if (!no_rm || !nik || !nama_pasien || !tanggal_lahir || !poli || !statuss) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }

      const [result] = await db.execute(
        `INSERT INTO registrasi_pasien
       (no_rm, nik, nama_pasien, tanggal_lahir, poli, statuss)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [no_rm, nik, nama_pasien, tanggal_lahir, poli, statuss]
      );

      res.status(201).json({
        success: true,
        message: 'Registration Success',
        id: result.insertId,
      });
    } catch (error) {
        console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to save registration',
      });
    }
  },
  updateRegistration: async (req, res) => {
    try {
      const id = Number(req.params.id);
      const body = req.body || {};
      const fields = ['no_rm', 'nik', 'nama_pasien', 'tanggal_lahir', 'poli', 'statuss'];
      const providedFields = fields.filter((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      );
      const isPatch = req.method === 'PATCH';

      if (
        Object.prototype.hasOwnProperty.call(body, 'nik') &&
        (typeof body.nik !== 'string' || !/^\d{16}$/.test(body.nik))
      ) {
        return res.status(400).json({
          success: false,
          message: 'NIK harus 16 angka',
        });
      }

      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID registrasi tidak valid',
        });
      }

      if (providedFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada data registrasi yang diberikan',
        });
      }

      if (
        (!isPatch && fields.some((field) => !body[field])) ||
        providedFields.some((field) => !body[field])
      ) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }

      const [result] = await db.execute(
        `UPDATE registrasi_pasien SET ${providedFields
          .map((field) => `${field} = ?`)
          .join(', ')} WHERE id = ?`,
        [...providedFields.map((field) => body[field]), id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data registrasi tidak ditemukan',
        });
      }

      res.json({
        success: true,
        message: 'Registration Updated Success',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Failed to update registration',
      });
    }
  },

  deleteRegistration: async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({
          success: false,
          message: 'ID registrasi tidak valid',
        });
      }

      const [result] = await db.execute(
        'DELETE FROM registrasi_pasien WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data registrasi tidak ditemukan',
        });
      }

      res.json({
        success: true,
        message: 'Registration Deleted Success',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete registration',
      });
    }
  }
}