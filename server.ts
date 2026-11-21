import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const db = new Database(path.join(__dirname, 'school.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    subject TEXT NOT NULL,
    nip TEXT,
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    published_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS school_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    about TEXT NOT NULL,
    vision TEXT NOT NULL,
    mission TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    students_count INTEGER DEFAULT 420,
    teachers_count INTEGER DEFAULT 28,
    achievements_count INTEGER DEFAULT 64,
    admin_password TEXT DEFAULT 'admin'
  );
`);

// Pastikan kolom admin_password ada jika database sudah dibuat sebelumnya
try {
  db.exec(`ALTER TABLE school_profile ADD COLUMN admin_password TEXT DEFAULT 'admin'`);
} catch {
  // Kolom sudah ada
}

const profileCount = db.prepare('SELECT COUNT(*) as count FROM school_profile').get() as { count: number };
if (profileCount.count === 0) {
  db.prepare(`
    INSERT INTO school_profile (id, name, tagline, about, vision, mission, address, phone, email, students_count, teachers_count, achievements_count, admin_password)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 450, 32, 78, ?)
  `).run(
    'SD Harapan Bangsa',
    'Membangun Karakter Unggul, Kreatif, dan Berwawasan Global',
    'SD Harapan Bangsa adalah lembaga pendidikan dasar terakreditasi A yang berkomitmen menghadirkan pembelajaran aktif, ramah anak, dan berbasis teknologi serta nilai-nilai budi pekerti luhur.',
    'Menjadi sekolah dasar unggulan yang melahirkan generasi berakhlak mulia, cerdas, kreatif, mandiri, dan peduli lingkungan.',
    '1. Menyelenggarakan pembelajaran aktif, inovatif, dan menyenangkan.\n2. Menanamkan nilai karakter Pancasila dan budi pekerti dalam keseharian.\n3. Mengembangkan literasi digital, sains, seni, dan olahraga sesuai bakat siswa.\n4. Membangun sinergi harmonis antara sekolah, orang tua, dan masyarakat.',
    'Jl. Pendidikan No. 45, Kelurahan Harapan Jaya, Kota Nusantara',
    '(021) 555-0192',
    'info@sdharapanbangsa.sch.id',
    process.env.ADMIN_PASSWORD || 'admin'
  );
}

const teacherCount = db.prepare('SELECT COUNT(*) as count FROM teachers').get() as { count: number };
if (teacherCount.count === 0) {
  const insertTeacher = db.prepare('INSERT INTO teachers (name, role, subject, nip, photo_url) VALUES (?, ?, ?, ?, ?)');
  insertTeacher.run('Dra. Hj. Siti Aminah, M.Pd.', 'Kepala Sekolah', 'Manajemen Pendidikan', '197504122000032004', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80');
  insertTeacher.run('Budi Santoso, S.Pd.', 'Wali Kelas 6A', 'Matematika & IPAS', '198608172010011012', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80');
  insertTeacher.run('Rina Kusuma Wardani, S.Pd.', 'Wali Kelas 4B', 'Bahasa Indonesia & Seni', '199103222015042003', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80');
  insertTeacher.run('Ahmad Fauzi, S.Kom.', 'Guru Bidang Studi', 'Informatika & Robotika', '199311052019031008', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');
}

const newsCount = db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number };
if (newsCount.count === 0) {
  const insertNews = db.prepare('INSERT INTO news (title, category, excerpt, content, image_url, published_date) VALUES (?, ?, ?, ?, ?, ?)');
  insertNews.run(
    'Juara 1 Olimpiade Sains Nasional (OSN) Tingkat Kota',
    'Prestasi',
    'Siswa kelas 5 SD Harapan Bangsa berhasil meraih medali emas pada ajang OSN bidang Matematika dan IPA.',
    'Selamat kepada Ananda Rafi Pratama dan Nayla Putri yang telah mengharumkan nama SD Harapan Bangsa dengan meraih Juara 1 Olimpiade Sains Nasional (OSN) Tingkat Kota. Keberhasilan ini merupakan hasil bimbingan intensif para guru dan dukungan penuh orang tua siswa.',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    '2026-10-15'
  );
  insertNews.run(
    'Penerimaan Peserta Didik Baru (PPDB) Tahun Ajaran 2026/2027',
    'Pengumuman',
    'Pendaftaran gelombang pertama untuk calon siswa baru kelas 1 telah resmi dibuka secara daring maupun luring.',
    'SD Harapan Bangsa membuka pendaftaran peserta didik baru tahun ajaran 2026/2027. Orang tua dapat melakukan pendaftaran melalui sekretariat sekolah setiap hari kerja pukul 08.00 - 14.00 WIB dengan membawa fotokopi akta kelahiran dan kartu keluarga.',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    '2026-11-02'
  );
  insertNews.run(
    'Pekan Literasi & Pameran Karya Proyek Penguatan Profil Pelajar Pancasila',
    'Kegiatan',
    'Siswa menampilkan beragam karya daur ulang kreatif, buku cerita mini, dan pertunjukan seni daerah.',
    'Dalam rangka memperingati Bulan Bahasa dan Pekan Literasi, seluruh siswa dari kelas 1 hingga kelas 6 berpartisipasi aktif dalam Pameran Karya P5. Kegiatan ini melatih kepercayaan diri, gotong royong, dan kepedulian siswa terhadap kelestarian lingkungan.',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80',
    '2026-11-12'
  );
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function getStoredAdminPassword(): string {
  const row = db.prepare('SELECT admin_password FROM school_profile WHERE id = 1').get() as { admin_password?: string } | undefined;
  return (row?.admin_password || process.env.ADMIN_PASSWORD || 'admin').trim();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use('/uploads', express.static(uploadDir));

  // Auth endpoint (mendukung pencocokan DB & .env secara otomatis)
  app.post('/api/login', (req, res) => {
    const inputPass = String(req.body?.password || '').trim();
    const dbPass = getStoredAdminPassword();
    const envPass = String(process.env.ADMIN_PASSWORD || '').trim();

    if (inputPass && (inputPass === dbPass || (envPass && inputPass === envPass))) {
      res.json({ success: true, token: 'sdhb-admin-session-token' });
    } else {
      res.status(401).json({ success: false, message: 'Kata sandi admin salah! Silakan cek kembali.' });
    }
  });

  // Endpoint Ganti Password Admin langsung dari Dashboard
  app.post('/api/change-password', (req, res) => {
    const currentPassword = String(req.body?.currentPassword || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 4 karakter.' });
    }

    const dbPass = getStoredAdminPassword();
    const envPass = String(process.env.ADMIN_PASSWORD || '').trim();
    if (currentPassword !== dbPass && currentPassword !== envPass) {
      return res.status(401).json({ success: false, message: 'Kata sandi lama tidak sesuai.' });
    }

    db.prepare('UPDATE school_profile SET admin_password = ? WHERE id = 1').run(newPassword);
    res.json({ success: true, message: 'Kata sandi administrator berhasil diperbarui!' });
  });

  // Upload endpoint
  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // School Profile API
  app.get('/api/profile', (_req, res) => {
    const profile = db.prepare('SELECT id, name, tagline, about, vision, mission, address, phone, email, students_count, teachers_count, achievements_count FROM school_profile WHERE id = 1').get();
    res.json(profile);
  });

  app.put('/api/profile', (req, res) => {
    const { name, tagline, about, vision, mission, address, phone, email, students_count, teachers_count, achievements_count } = req.body;
    db.prepare(`
      UPDATE school_profile
      SET name = ?, tagline = ?, about = ?, vision = ?, mission = ?, address = ?, phone = ?, email = ?, students_count = ?, teachers_count = ?, achievements_count = ?
      WHERE id = 1
    `).run(name, tagline, about, vision, mission, address, phone, email, Number(students_count) || 0, Number(teachers_count) || 0, Number(achievements_count) || 0);
    res.json(db.prepare('SELECT id, name, tagline, about, vision, mission, address, phone, email, students_count, teachers_count, achievements_count FROM school_profile WHERE id = 1').get());
  });

  // Teachers API
  app.get('/api/teachers', (_req, res) => {
    const rows = db.prepare('SELECT * FROM teachers ORDER BY id ASC').all();
    res.json(rows);
  });

  app.post('/api/teachers', (req, res) => {
    const { name, role, subject, nip, photo_url } = req.body;
    if (!name || !role || !subject) {
      return res.status(400).json({ error: 'Nama, jabatan, dan mata pelajaran wajib diisi.' });
    }
    const info = db.prepare('INSERT INTO teachers (name, role, subject, nip, photo_url) VALUES (?, ?, ?, ?, ?)').run(
      name,
      role,
      subject,
      nip || '-',
      photo_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80'
    );
    const created = db.prepare('SELECT * FROM teachers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  });

  app.put('/api/teachers/:id', (req, res) => {
    const { id } = req.params;
    const { name, role, subject, nip, photo_url } = req.body;
    db.prepare('UPDATE teachers SET name = ?, role = ?, subject = ?, nip = ?, photo_url = ? WHERE id = ?').run(
      name, role, subject, nip || '-', photo_url, id
    );
    res.json(db.prepare('SELECT * FROM teachers WHERE id = ?').get(id));
  });

  app.delete('/api/teachers/:id', (req, res) => {
    db.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // News API
  app.get('/api/news', (_req, res) => {
    const rows = db.prepare('SELECT * FROM news ORDER BY published_date DESC, id DESC').all();
    res.json(rows);
  });

  app.post('/api/news', (req, res) => {
    const { title, category, excerpt, content, image_url, published_date } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Judul dan isi berita wajib diisi.' });
    }
    const dateStr = published_date || new Date().toISOString().split('T')[0];
    const summary = excerpt || content.slice(0, 140) + '...';
    const info = db.prepare('INSERT INTO news (title, category, excerpt, content, image_url, published_date) VALUES (?, ?, ?, ?, ?, ?)').run(
      title,
      category || 'Kegiatan',
      summary,
      content,
      image_url || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
      dateStr
    );
    res.status(201).json(db.prepare('SELECT * FROM news WHERE id = ?').get(info.lastInsertRowid));
  });

  app.put('/api/news/:id', (req, res) => {
    const { id } = req.params;
    const { title, category, excerpt, content, image_url, published_date } = req.body;
    db.prepare('UPDATE news SET title = ?, category = ?, excerpt = ?, content = ?, image_url = ?, published_date = ? WHERE id = ?').run(
      title, category, excerpt, content, image_url, published_date, id
    );
    res.json(db.prepare('SELECT * FROM news WHERE id = ?').get(id));
  });

  app.delete('/api/news/:id', (req, res) => {
    db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SD Harapan Bangsa berjalan di http://localhost:${PORT}`);
  });
}

startServer();
