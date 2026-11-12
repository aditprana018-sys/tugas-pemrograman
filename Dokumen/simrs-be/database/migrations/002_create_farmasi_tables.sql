CREATE TABLE IF NOT EXISTS farmasi (
  id INT NOT NULL AUTO_INCREMENT,
  id_registration INT NOT NULL,
  no_resep VARCHAR(100) NOT NULL,
  total_harga DECIMAL(12, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_farmasi_registration
    FOREIGN KEY (id_registration)
    REFERENCES registrasi_pasien (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS detail_farmasi (
  id INT NOT NULL AUTO_INCREMENT,
  id_farmasi INT NOT NULL,
  nama_obat VARCHAR(255) NOT NULL,
  qty_obat INT NOT NULL,
  satuan_obat VARCHAR(50) NOT NULL,
  harga_obat DECIMAL(12, 2) NOT NULL,
  total_obat DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_detail_farmasi_farmasi
    FOREIGN KEY (id_farmasi)
    REFERENCES farmasi (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
