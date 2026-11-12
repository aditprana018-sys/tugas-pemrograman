ALTER TABLE pemeriksaan_pasien
ADD CONSTRAINT fk_pemeriksaan_pasien_registration
FOREIGN KEY (id_registration)
REFERENCES registrasi_pasien (id);
