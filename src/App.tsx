import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Lock,
  LogOut,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  Menu,
  ArrowRight,
  School,
  Sparkles,
  Upload,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { Teacher, NewsItem, SchoolProfile } from './types';

export default function App() {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals & Admin state
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => Boolean(localStorage.getItem('sdhb_admin_token')));
  const [adminView, setAdminView] = useState(false);
  const [adminTab, setAdminTab] = useState<'news' | 'teachers' | 'profile' | 'security'>('news');
  const [toast, setToast] = useState<string | null>(null);

  // Change Password Form State
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMessage, setPwMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Teacher Form State
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState({ name: '', role: '', subject: '', nip: '', photo_url: '' });

  // News Form State
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    category: 'Kegiatan',
    excerpt: '',
    content: '',
    image_url: '',
    published_date: new Date().toISOString().split('T')[0],
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState<SchoolProfile | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAllData = async () => {
    try {
      const [profRes, teachRes, newsRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/teachers'),
        fetch('/api/news'),
      ]);
      const profData = await profRes.json();
      const teachData = await teachRes.json();
      const newsData = await newsRes.json();
      setProfile(profData);
      setProfileForm(profData);
      setTeachers(teachData);
      setNews(newsData);
    } catch (err) {
      console.error('Gagal memuat data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setLoginError('Server backend belum aktif. Pastikan menjalankan perintah: npm run dev');
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('sdhb_admin_token', data.token);
        setIsAdmin(true);
        setShowLoginModal(false);
        setAdminView(true);
        setPasswordInput('');
        showToast('Berhasil masuk sebagai Administrator');
      } else {
        setLoginError(data.message || 'Kata sandi salah');
      }
    } catch {
      setLoginError('Gagal terhubung ke server. Pastikan "npm run dev" sedang berjalan.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sdhb_admin_token');
    setIsAdmin(false);
    setAdminView(false);
    showToast('Anda telah keluar dari panel admin');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwMessage({ type: 'success', text: data.message });
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast('Kata sandi admin berhasil diubah!');
      } else {
        setPwMessage({ type: 'error', text: data.message || 'Gagal mengganti kata sandi.' });
      }
    } catch {
      setPwMessage({ type: 'error', text: 'Terjadi kesalahan koneksi ke server.' });
    }
  };

  const handleImageUpload = async (file: File, target: 'teacher' | 'news') => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        if (target === 'teacher') {
          setTeacherForm((prev) => ({ ...prev, photo_url: data.url }));
        } else {
          setNewsForm((prev) => ({ ...prev, image_url: data.url }));
        }
        showToast('Gambar berhasil diunggah');
      }
    } catch {
      showToast('Gagal mengunggah gambar');
    }
  };

  // Teacher CRUD
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';
    const method = editingTeacher ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherForm),
    });
    if (res.ok) {
      await fetchAllData();
      setEditingTeacher(null);
      setTeacherForm({ name: '', role: '', subject: '', nip: '', photo_url: '' });
      showToast(editingTeacher ? 'Data guru diperbarui' : 'Guru baru ditambahkan');
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (!confirm('Hapus data guru ini?')) return;
    await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
    await fetchAllData();
    showToast('Data guru dihapus');
  };

  // News CRUD
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingNews ? `/api/news/${editingNews.id}` : '/api/news';
    const method = editingNews ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsForm),
    });
    if (res.ok) {
      await fetchAllData();
      setEditingNews(null);
      setNewsForm({
        title: '',
        category: 'Kegiatan',
        excerpt: '',
        content: '',
        image_url: '',
        published_date: new Date().toISOString().split('T')[0],
      });
      showToast(editingNews ? 'Berita diperbarui' : 'Berita baru diterbitkan');
    }
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm('Hapus berita ini?')) return;
    await fetch(`/api/news/${id}`, { method: 'DELETE' });
    await fetchAllData();
    showToast('Berita dihapus');
  };

  // Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm) return;
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileForm),
    });
    if (res.ok) {
      await fetchAllData();
      showToast('Profil sekolah berhasil disimpan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Memuat Website Sekolah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" onClick={() => setAdminView(false)} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 block leading-tight">
                {profile?.name || 'SD Harapan Bangsa'}
              </span>
              <span className="text-xs text-slate-500 block">Terakreditasi A • Unggul & Berkarakter</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {!adminView ? (
              <>
                <a href="#beranda" className="hover:text-blue-600 transition">Beranda</a>
                <a href="#profil" className="hover:text-blue-600 transition">Profil & Visi Misi</a>
                <a href="#guru" className="hover:text-blue-600 transition">Direktori Guru</a>
                <a href="#berita" className="hover:text-blue-600 transition">Berita & Pengumuman</a>
                <a href="#kontak" className="hover:text-blue-600 transition">Kontak</a>
              </>
            ) : (
              <span className="text-blue-600 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Mode Panel Administrator
              </span>
            )}
          </nav>

          {/* Admin Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setAdminView(!adminView)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                >
                  {adminView ? 'Lihat Website Publik' : 'Dashboard Admin'}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                <Lock className="w-4 h-4" /> Login Admin
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 text-sm">
            {!adminView && (
              <>
                <a href="#beranda" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-medium">Beranda</a>
                <a href="#profil" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-medium">Profil & Visi Misi</a>
                <a href="#guru" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-medium">Direktori Guru</a>
                <a href="#berita" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-medium">Berita</a>
                <a href="#kontak" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-medium">Kontak</a>
              </>
            )}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => { setAdminView(!adminView); setMobileMenuOpen(false); }}
                    className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium"
                  >
                    {adminView ? 'Website Publik' : 'Dashboard Admin'}
                  </button>
                  <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-50 text-red-600 font-medium">
                    Keluar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowLoginModal(true); setMobileMenuOpen(false); }}
                  className="w-full py-2 rounded-lg bg-slate-900 text-white font-medium"
                >
                  Login Admin
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT: ADMIN DASHBOARD vs PUBLIC WEBSITE */}
      {adminView && isAdmin ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Manajemen Sekolah</h1>
            <p className="text-slate-600 text-sm mt-1">Kelola berita kegiatan, direktori guru, profil sekolah, dan keamanan akun.</p>
          </div>

          {/* Admin Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-6">
            <button
              onClick={() => setAdminTab('news')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                adminTab === 'news' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Kelola Berita ({news.length})
            </button>
            <button
              onClick={() => setAdminTab('teachers')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                adminTab === 'teachers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Data Guru & Staf ({teachers.length})
            </button>
            <button
              onClick={() => setAdminTab('profile')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                adminTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Profil & Statistik Sekolah
            </button>
            <button
              onClick={() => setAdminTab('security')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
                adminTab === 'security' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4" /> Ganti Password Admin
            </button>
          </div>

          {/* TAB 1: NEWS MANAGEMENT */}
          {adminTab === 'news' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <form onSubmit={handleSaveNews} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
                <h2 className="font-bold text-lg text-slate-900">
                  {editingNews ? 'Edit Berita' : 'Tambah Berita Baru'}
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Berita</label>
                  <input
                    type="text"
                    required
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: Juara Lomba Cerdas Cermat"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={newsForm.category}
                      onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    >
                      <option value="Kegiatan">Kegiatan</option>
                      <option value="Prestasi">Prestasi</option>
                      <option value="Pengumuman">Pengumuman</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={newsForm.published_date}
                      onChange={(e) => setNewsForm({ ...newsForm, published_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan Singkat</label>
                  <input
                    type="text"
                    value={newsForm.excerpt}
                    onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    placeholder="Ringkasan tampilan kartu berita..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Lengkap Berita</label>
                  <textarea
                    rows={4}
                    required
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    placeholder="Tulis detail berita..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL Gambar / Unggah Foto</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newsForm.image_url}
                      onChange={(e) => setNewsForm({ ...newsForm, image_url: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      placeholder="https://..."
                    />
                    <label className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center gap-1 text-xs font-medium">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'news')}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
                    {editingNews ? 'Simpan Perubahan' : 'Terbitkan Berita'}
                  </button>
                  {editingNews && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNews(null);
                        setNewsForm({ title: '', category: 'Kegiatan', excerpt: '', content: '', image_url: '', published_date: new Date().toISOString().split('T')[0] });
                      }}
                      className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <div className="lg:col-span-2 space-y-4">
                {news.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex gap-4 items-center">
                      <img src={item.image_url} alt={item.title} className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">{item.published_date}</span>
                        <h3 className="font-bold text-slate-900 mt-1">{item.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.excerpt}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setEditingNews(item);
                          setNewsForm({
                            title: item.title,
                            category: item.category,
                            excerpt: item.excerpt,
                            content: item.content,
                            image_url: item.image_url,
                            published_date: item.published_date,
                          });
                        }}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNews(item.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TEACHERS MANAGEMENT */}
          {adminTab === 'teachers' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <form onSubmit={handleSaveTeacher} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
                <h2 className="font-bold text-lg text-slate-900">
                  {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru / Staf'}
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.name}
                    onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    placeholder="Contoh: Siti Aminah, S.Pd."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.role}
                    onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    placeholder="Contoh: Wali Kelas 3A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran / Bidang</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.subject}
                    onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    placeholder="Contoh: Tematik & Matematika"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIP (Opsional)</label>
                  <input
                    type="text"
                    value={teacherForm.nip}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Foto Profil (URL atau Unggah)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={teacherForm.photo_url}
                      onChange={(e) => setTeacherForm({ ...teacherForm, photo_url: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      placeholder="https://..."
                    />
                    <label className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center text-xs font-medium">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'teacher')}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                    {editingTeacher ? 'Simpan Perubahan' : 'Tambah Guru'}
                  </button>
                  {editingTeacher && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeacher(null);
                        setTeacherForm({ name: '', role: '', subject: '', nip: '', photo_url: '' });
                      }}
                      className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                {teachers.map((t) => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={t.photo_url} alt={t.name} className="w-14 h-14 rounded-full object-cover bg-slate-100" />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                        <p className="text-xs text-blue-600 font-medium">{t.role}</p>
                        <p className="text-xs text-slate-500">{t.subject}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingTeacher(t);
                          setTeacherForm({ name: t.name, role: t.role, subject: t.subject, nip: t.nip, photo_url: t.photo_url });
                        }}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(t.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE SETTINGS */}
          {adminTab === 'profile' && profileForm && (
            <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-slate-200 max-w-3xl space-y-4">
              <h2 className="font-bold text-lg text-slate-900">Pengaturan Profil & Kontak Sekolah</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sekolah</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Slogan / Tagline</label>
                  <input
                    type="text"
                    value={profileForm.tagline}
                    onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tentang Sekolah</label>
                <textarea
                  rows={3}
                  value={profileForm.about}
                  onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Visi</label>
                  <textarea
                    rows={3}
                    value={profileForm.vision}
                    onChange={(e) => setProfileForm({ ...profileForm, vision: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Misi</label>
                  <textarea
                    rows={3}
                    value={profileForm.mission}
                    onChange={(e) => setProfileForm({ ...profileForm, mission: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Siswa</label>
                  <input
                    type="number"
                    value={profileForm.students_count}
                    onChange={(e) => setProfileForm({ ...profileForm, students_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Guru & Staf</label>
                  <input
                    type="number"
                    value={profileForm.teachers_count}
                    onChange={(e) => setProfileForm({ ...profileForm, teachers_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Prestasi</label>
                  <input
                    type="number"
                    value={profileForm.achievements_count}
                    onChange={(e) => setProfileForm({ ...profileForm, achievements_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                Simpan Profil Sekolah
              </button>
            </form>
          )}

          {/* TAB 4: CHANGE ADMIN PASSWORD */}
          {adminTab === 'security' && (
            <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-slate-200 max-w-md space-y-4">
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" /> Ubah Kata Sandi Administrator
              </h2>
              <p className="text-xs text-slate-500">
                Kata sandi baru akan langsung tersimpan secara permanen di database sekolah.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  required
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  placeholder="Masukkan kata sandi lama..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  placeholder="Minimal 4 karakter..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  placeholder="Ulangi kata sandi baru..."
                />
              </div>
              {pwMessage && (
                <p className={`text-xs font-medium ${pwMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {pwMessage.text}
                </p>
              )}
              <button type="submit" className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                Simpan Kata Sandi Baru
              </button>
            </form>
          )}
        </main>
      ) : (
        <main className="flex-1">
          {/* HERO SECTION */}
          <section id="beranda" className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold">
                  <School className="w-4 h-4" /> Penerimaan Peserta Didik Baru 2026/2027 Dibuka
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  {profile?.tagline}
                </h1>
                <p className="text-blue-100 text-lg leading-relaxed">
                  {profile?.about}
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    href="#berita"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 text-slate-900 font-bold text-sm hover:bg-amber-300 transition shadow-lg"
                  >
                    Info PPDB & Berita <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="#profil"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition"
                  >
                    Kenali Sekolah Kami
                  </a>
                </div>
              </div>

              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80"
                  alt="Kegiatan Belajar SD Harapan Bangsa"
                  className="rounded-3xl shadow-2xl border-4 border-white/15 object-cover w-full h-[380px]"
                />
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">{profile?.students_count}+</div>
                    <div className="text-xs text-blue-100 mt-1">Siswa Aktif</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">{profile?.teachers_count}</div>
                    <div className="text-xs text-blue-100 mt-1">Guru & Staf</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">{profile?.achievements_count}+</div>
                    <div className="text-xs text-blue-100 mt-1">Prestasi Diraih</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PROFIL & VISI MISI */}
          <section id="profil" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Tentang Kami</span>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">Visi, Misi & Lingkungan Belajar</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-blue-50/70 border border-blue-100">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-5">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Visi Sekolah</h3>
                  <p className="text-slate-700 leading-relaxed">{profile?.vision}</p>
                </div>
                <div className="p-8 rounded-3xl bg-amber-50/70 border border-amber-100">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-5">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Misi Sekolah</h3>
                  <div className="text-slate-700 space-y-2 leading-relaxed whitespace-pre-line">
                    {profile?.mission}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* DIREKTORI GURU */}
          <section id="guru" className="py-20 bg-slate-50 border-t border-slate-200/70">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
                <div>
                  <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Tenaga Pendidik</span>
                  <h2 className="text-3xl font-bold text-slate-900 mt-2">Guru & Staf Pengajar</h2>
                </div>
                <p className="text-slate-600 text-sm max-w-md">
                  Didukung oleh tenaga pendidik profesional, tersertifikasi, dan berdedikasi tinggi dalam membimbing tumbuh kembang anak.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition group"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={teacher.photo_url}
                        alt={teacher.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="p-5">
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 mb-2">
                        {teacher.role}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{teacher.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{teacher.subject}</p>
                      {teacher.nip && teacher.nip !== '-' && (
                        <p className="text-xs text-slate-400 mt-2">NIP. {teacher.nip}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* BERITA & PENGUMUMAN */}
          <section id="berita" className="py-20 bg-white border-t border-slate-200/70">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Kabar Sekolah</span>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">Berita, Prestasi & Pengumuman</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {news.map((item) => (
                  <article
                    key={item.id}
                    className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition"
                  >
                    <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover bg-slate-200" />
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                          {item.category}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {item.published_date}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">{item.excerpt}</p>
                      <button
                        onClick={() => setSelectedNews(item)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Baca Selengkapnya <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* FOOTER / KONTAK */}
      <footer id="kontak" className="bg-slate-900 text-slate-300 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 text-white mb-4">
              <GraduationCap className="w-7 h-7 text-amber-400" />
              <span className="font-bold text-lg">{profile?.name}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Membentuk generasi pembelajar sepanjang hayat yang beriman, cerdas, kreatif, dan berakhlak mulia.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Kontak & Lokasi</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                <span>{profile?.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{profile?.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{profile?.email}</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Jam Operasional</h4>
            <p className="text-sm text-slate-400">Senin – Jumat: 07.00 – 15.00 WIB</p>
            <p className="text-sm text-slate-400 mt-1">Sabtu: 07.30 – 12.00 WIB (Ekstrakurikuler)</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {profile?.name}. Hak Cipta Dilindungi.
        </div>
      </footer>

      {/* MODAL BACA BERITA */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="relative">
              <img src={selectedNews.image_url} alt={selectedNews.title} className="w-full h-64 object-cover" />
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 text-xs mb-3">
                <span className="font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">{selectedNews.category}</span>
                <span className="text-slate-500">{selectedNews.published_date}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{selectedNews.title}</h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{selectedNews.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN ADMIN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" /> Login Administrator
              </h3>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Masukkan kata sandi admin. Password baru yang sudah diatur: <code className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded font-mono text-xs">admin</code>
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Ketik: admin"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title={showPassword ? 'Sembunyikan' : 'Lihat sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginError && <p className="text-xs text-red-600 font-medium">{loginError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
              >
                Masuk ke Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
