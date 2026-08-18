"""
Script to generate high quality Technical Daily Report PDF for SARPRAS using Edge Headless (Chromium PDF engine)
Without signature/sign-off section.
"""
import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Harian Teknikal - SARPRAS</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm 16mm 16mm 16mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.55;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    /* Document Header */
    .header-container {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand-title {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }

    .brand-subtitle {
      font-size: 10.5pt;
      font-weight: 600;
      color: #2563eb;
      margin: 0 0 6px 0;
    }

    .doc-badge {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #bfdbfe;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .top-meta-right {
      text-align: right;
      font-size: 8pt;
      color: #64748b;
      line-height: 1.4;
    }

    /* Metadata Grid */
    .meta-grid {
      display: table;
      width: 100%;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 16px;
    }

    .meta-row {
      display: table-row;
    }

    .meta-cell {
      display: table-cell;
      width: 25%;
      padding: 4px 8px;
      vertical-align: top;
    }

    .meta-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
      display: block;
    }

    .meta-value {
      font-size: 9pt;
      font-weight: 600;
      color: #0f172a;
      display: block;
    }

    .status-pill {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8pt;
    }

    /* Section Typography */
    h2 {
      font-size: 11.5pt;
      font-weight: 800;
      color: #0f172a;
      border-left: 4px solid #2563eb;
      padding-left: 8px;
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      page-break-after: avoid;
    }

    p {
      margin: 0 0 8px 0;
      text-align: justify;
    }

    /* Cards and Highlights */
    .highlight-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #3b82f6;
      border-radius: 5px;
      padding: 9px 12px;
      margin-bottom: 9px;
      page-break-inside: avoid;
    }

    .highlight-card.warning {
      border-left-color: #f59e0b;
      background: #fffdfa;
    }

    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .card-title {
      font-weight: 700;
      font-size: 9.2pt;
      color: #0f172a;
    }

    .card-tag {
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
      background: #e0f2fe;
      color: #0369a1;
      text-transform: uppercase;
    }

    /* Lists */
    ul {
      margin: 4px 0 4px 0;
      padding-left: 18px;
    }

    li {
      margin-bottom: 3px;
      font-size: 9pt;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 10px;
      font-size: 8pt;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    td {
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .badge-done {
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 7.5pt;
      display: inline-block;
      white-space: nowrap;
    }

    .footer-note {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-container">
    <div>
      <h1 class="brand-title">Laporan Harian Teknikal</h1>
      <div class="brand-subtitle">Sistem Manajemen Sarana &amp; Prasarana (SARPRAS)</div>
      <div class="doc-badge">Senior Engineering &amp; Architecture Progress Report</div>
    </div>
    <div class="top-meta-right">
      <strong>Dokumen No:</strong> RPT-SARPRAS-20260814<br>
      <strong>Klasifikasi:</strong> Internal Confidential<br>
      <strong>Tanggal:</strong> 14 Agustus 2026
    </div>
  </div>

  <!-- Metadata Grid -->
  <div class="meta-grid">
    <div class="meta-row">
      <div class="meta-cell">
        <span class="meta-label">Tanggal Pelaporan</span>
        <span class="meta-value">14 Agustus 2026</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Penyusun</span>
        <span class="meta-value">Senior Technical Lead</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Capaian Milestone</span>
        <span class="meta-value">v1.0 &rarr; v1.3 (Integrated)</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Status Sistem</span>
        <span class="meta-value"><span class="status-pill">&bull; COMPLETED &amp; STABLE</span></span>
      </div>
    </div>
  </div>

  <!-- I. Pendahuluan -->
  <h2>I. Pendahuluan</h2>
  <p>
    Laporan teknikal ini mendokumentasikan hasil pelaksanaan rekayasa perangkat lunak, penyempurnaan arsitektur, dan pengujian integrasi sistem <strong>SARPRAS</strong> pada siklus hari ini. Fokus utama difokuskan pada penyelesaian alur reservasi publik terpandu (*public booking wizard*), penguatan kendali akses (*Role-Based Access Control / RBAC*) pada portal administrasi, serta implementasi <strong>Unified Dual-Channel Notification Orchestrator</strong> (WhatsApp Gateway via Fonnte &amp; Transactional Email via Resend) yang terintegrasi secara <em>asynchronous</em> dan <em>fault-tolerant</em>.
  </p>

  <!-- II. Kegiatan yang Dilakukan -->
  <h2>II. Kegiatan yang Dilakukan</h2>

  <div class="highlight-card">
    <div class="card-header-flex">
      <span class="card-title">1. Public Discovery &amp; 3-Step Booking Wizard</span>
      <span class="card-tag">Core Service (Phase 04)</span>
    </div>
    <ul>
      <li><strong>Katalog Aset &amp; Proyeksi Jadwal:</strong> Mengembangkan landing page publik, katalog sarana/prasarana dengan filter kategori, modal ketersediaan slot waktu, dan fungsi proyeksi jadwal.</li>
      <li><strong>3-Step Booking Wizard:</strong> Merancang wizard pemesanan (Jadwal &rarr; Data Pemohon &rarr; Konfirmasi) dilengkapi validasi waktu instan dan <em>preflight conflict check</em> otomatis.</li>
      <li><strong>Status Tracking &amp; Pembatalan Mandiri:</strong> Mengembangkan pelacakan status tiket via kode referensi (<code>/status/{ref}</code>) dan fitur pembatalan mandiri dengan input alasan pembatalan wajib.</li>
    </ul>
  </div>

  <div class="highlight-card">
    <div class="card-header-flex">
      <span class="card-title">2. UI/UX Modernization &amp; Admin RBAC Dashboard</span>
      <span class="card-tag">Interface &amp; Security (Phase 05-06)</span>
    </div>
    <ul>
      <li><strong>Arsitektur Visual &amp; Theming:</strong> Mengimplementasikan komponen Bento Showcase, Hero Console, KPI Cards, Favicon SVG resmi, serta integrasi Dark/Light mode tokens.</li>
      <li><strong>Dashboard Operasional Admin:</strong> Menghadirkan Admin Calendar View terpadu, widget Urgent Bookings, serta Booking Review Drawer untuk alur persetujuan/penolakan instan.</li>
      <li><strong>Audit Trail &amp; Diff Viewer:</strong> Mengintegrasikan pencatatan log audit otomatis di setiap mutasi data aset dan pemesanan dengan visualisasi <em>diff viewer</em>.</li>
    </ul>
  </div>

  <div class="highlight-card">
    <div class="card-header-flex">
      <span class="card-title">3. Dual-Channel Notification System (WhatsApp &amp; Email)</span>
      <span class="card-tag">Integrations (Phase 07-08)</span>
    </div>
    <ul>
      <li><strong>WhatsApp Gateway (Fonnte API):</strong> Integrasi pengiriman notifikasi instan dengan normalisasi nomor telepon Indonesia otomatis dan penanganan <em>post-commit hook</em>.</li>
      <li><strong>Email Gateway (Resend API):</strong> Merancang arsitektur pengiriman email lengkap dengan validator payload, mock provider untuk staging/testing, dan audit logger.</li>
      <li><strong>Responsive Template Engine:</strong> Membangun template email HTML responsif bergaya enterprise modern dengan fallback plaintext untuk status pengajuan, persetujuan, penolakan, dan pembatalan.</li>
      <li><strong>Unified Notification Orchestrator:</strong> Mengintegrasikan orkestrator terpusat pada <code>BookingService</code> sehingga setiap perubahan status memicu notifikasi multi-kanal secara <em>asynchronous</em> tanpa memblokir transaksi basis data.</li>
    </ul>
  </div>

  <div class="highlight-card">
    <div class="card-header-flex">
      <span class="card-title">4. DevOps, Bug Fixes &amp; Environment Hardening</span>
      <span class="card-tag">Maintenance &amp; Fixes</span>
    </div>
    <ul>
      <li><strong>Standarisasi Tracking URL:</strong> Memperbaiki format tautan tracking pada template notifikasi ke <code>/status/{ref}</code> dan menambahkan redirect <em>backward-compatible</em>.</li>
      <li><strong>Konfigurasi Lingkungan Docker:</strong> Memetakan seluruh variabel lingkungan kredensial gateway (<code>RESEND_API_KEY</code>, <code>FONNTE_TOKEN</code>, dll.) ke dalam Docker.</li>
    </ul>
  </div>

  <!-- III. Hasil yang Dicapai -->
  <h2>III. Hasil yang Dicapai (Key Deliverables)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 25%;">Komponen / Modul</th>
        <th style="width: 15%;">Status</th>
        <th style="width: 55%;">Hasil &amp; Dampak Teknis</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><strong>Public Booking Flow</strong></td>
        <td><span class="badge-done">100% Selesai</span></td>
        <td>Wizard 3 langkah aktif, validasi slot presisi, pencegahan tabrakan jadwal, dan tiket tracking mandiri.</td>
      </tr>
      <tr>
        <td>2</td>
        <td><strong>Admin Portal &amp; RBAC</strong></td>
        <td><span class="badge-done">100% Selesai</span></td>
        <td>Rute admin terlindungi penuh, kalender operasional aktif, dan audit log diff viewer berfungsi normal.</td>
      </tr>
      <tr>
        <td>3</td>
        <td><strong>WhatsApp Gateway</strong></td>
        <td><span class="badge-done">100% Selesai</span></td>
        <td>Koneksi Fonnte stabil, pesan status pengajuan berhasil dikirim dengan normalisasi nomor otomatis.</td>
      </tr>
      <tr>
        <td>4</td>
        <td><strong>Email Gateway (Resend)</strong></td>
        <td><span class="badge-done">100% Selesai</span></td>
        <td>Engine template HTML responsif teruji, fallback plaintext aktif, dan pencatatan audit log email sukses.</td>
      </tr>
      <tr>
        <td>5</td>
        <td><strong>Unified Orchestrator</strong></td>
        <td><span class="badge-done">100% Selesai</span></td>
        <td>Sistem notifikasi ganda terpadu terhubung ke BookingService dengan eksekusi aman (*graceful fallback*).</td>
      </tr>
      <tr>
        <td>6</td>
        <td><strong>Brand &amp; UI Polish</strong></td>
        <td><span class="badge-done">100% Selesai</span></td>
        <td>Komponen Bento Showcase, Hero Console, Favicon SVG, dan Dark/Light theme terpasang rapi.</td>
      </tr>
    </tbody>
  </table>

  <!-- IV. Pekerjaan Tertunda -->
  <h2>IV. Pekerjaan Tertunda / Backlog (Next Steps)</h2>
  <div class="highlight-card warning">
    <ul>
      <li><strong>Pengujian End-to-End Staging (UAT Lintas Perangkat):</strong> Pengujian regresi menyeluruh pada lingkungan staging menggunakan nomor WhatsApp dan domain email aktual.</li>
      <li><strong>Penyelarasan Monorepo Directory:</strong> Konsolidasi struktur folder <code>apps/</code> dan <code>packages/</code> untuk persiapan modularisasi lanjutan.</li>
      <li><strong>Verifikasi Migrasi &amp; Seeding Data:</strong> Pengujian skrip migrasi <code>migrate-legacy.ts</code> dan <code>seed-admin.ts</code> pada basis data staging dengan data riil.</li>
      <li><strong>Rate Limiting &amp; Security Hardening:</strong> Penerapan limitasi request pada endpoint publik booking dan webhook untuk mitigasi potensi abuse.</li>
    </ul>
  </div>

  <!-- V. Penutup -->
  <h2>V. Penutup</h2>
  <p>
    Seluruh target fungsional dan arsitektural utama yang direncanakan untuk siklus hari ini telah berhasil diselesaikan dengan baik dan memenuhi standar rekayasa sistem modern. Platform SARPRAS berada dalam kondisi stabil, siap untuk evaluasi UAT, dan dipersiapkan menuju tahap produksi (*production deployment*).
  </p>

  <!-- Footer Note -->
  <div class="footer-note">
    <span>Sistem Manajemen Sarana &amp; Prasarana (SARPRAS) &bull; Laporan Teknikal Harian</span>
    <span>Dokumen Internal Resmi</span>
  </div>

</body>
</html>
"""

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REPORTS_DIR = os.path.join(REPO_ROOT, "docs", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

output_html = os.path.join(REPORTS_DIR, "Laporan_Harian_Teknikal_SARPRAS_2026-08-14.html")
output_pdf = os.path.join(REPORTS_DIR, "Laporan_Harian_Teknikal_SARPRAS_2026-08-14.pdf")

with open(output_html, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML written to {output_html}")

edge_paths = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
]

edge_exe = None
for p in edge_paths:
    if os.path.exists(p):
        edge_exe = p
        break

if not edge_exe:
    raise RuntimeError("Microsoft Edge executable not found")

cmd = [
    edge_exe,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={output_pdf}",
    output_html
]

print(f"Running command: {' '.join(cmd)}")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
if os.path.exists(output_pdf):
    size_kb = os.path.getsize(output_pdf) / 1024
    print(f"SUCCESS: PDF updated at {output_pdf} (Size: {size_kb:.2f} KB)")
else:
    print(f"FAILED: PDF not found. Error output: {res.stderr}")
