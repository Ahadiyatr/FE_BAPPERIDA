import type { ReactNode } from 'react';
// Subset latin saja — cukup untuk teks Indonesia, tanpa berkas devanagari/cyrillic.
import '@fontsource/lora/latin-400-italic.css';
import '@fontsource/lora/latin-600.css';
import '@fontsource/lora/latin-700.css';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import '../landing.css';
import logoTabalong from '../../assets/logo-tabalong.png';

/**
 * Header + footer halaman publik (landing dan detail bidang). Teks identitas dan
 * hak cipta hidup di sini saja supaya kedua halaman tidak pernah berbeda.
 */
export function KerangkaPublik({ nav, children }: { nav?: ReactNode; children: ReactNode }) {
  return (
    <div className="lp">
      <header className="lp-head">
        <div className="lp-container lp-head-row">
          <img
            className="lp-mark"
            src={logoTabalong}
            alt="Lambang Kabupaten Tabalong"
            width={36}
            height={48}
          />
          <div style={{ minWidth: 0 }}>
            <div className="lp-kicker">
              Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah Kabupaten
              Tabalong
            </div>
            <p className="lp-head-title">OPERA-INK</p>
            <div className="lp-head-sub">OPERASIONAL INDIKATOR KINERJA</div>
          </div>
        </div>
        {nav && (
          <nav className="lp-nav" aria-label="Navigasi halaman">
            <div className="lp-container">{nav}</div>
          </nav>
        )}
      </header>

      <main>{children}</main>

      <footer className="lp-footer">
        <p className="lp-container lp-footer-row">
          <span>
            © 2026 · Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah
          </span>
          <span aria-hidden="true">·</span>
          <span>Pemerintah Kabupaten Tabalong</span>
        </p>
      </footer>
    </div>
  );
}
