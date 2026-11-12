const db = require('../../config/db');

module.exports = {
  savePemeriksaan: async (req, res) => {
    try {
      const body = req.body || {};
      const idRegistration = Number(body.id_registration);

      if (!Number.isSafeInteger(idRegistration) || idRegistration < 1) {
        return res.status(400).json({
          success: false,
          message: 'id_registration harus berupa ID registrasi yang valid',
        });
      }

      const requiredFields = [
        'tinggi_badan',
        'berat_badan',
        'tensi_darah',
        'Catatan',
      ];
      if (
        requiredFields.some(
          (field) =>
            !Object.prototype.hasOwnProperty.call(body, field) ||
            body[field] === null ||
            body[field] === ''
        )
      ) {
        return res.status(400).json({
          success: false,
          message: 'tinggi_badan, berat_badan, tensi_darah, dan Catatan wajib diisi',
        });
      }

      const [result] = await db.execute(
        `INSERT INTO pemeriksaan_pasien
         (id_registration, tinggi_badan, berat_badan, tensi_darah, \`Catatan\`)
         SELECT id, ?, ?, ?, ?
         FROM registrasi_pasien
         WHERE id = ?`,
        [
          body.tinggi_badan,
          body.berat_badan,
          body.tensi_darah,
          body.Catatan,
          idRegistration,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data registrasi tidak ditemukan',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Pemeriksaan berhasil disimpan',
        id: result.insertId,
        id_registration: idRegistration,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan pemeriksaan',
      });
    }
  },
};