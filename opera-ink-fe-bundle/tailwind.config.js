/** @type {import('tailwindcss').Config} */

// Hanya bagian `extend` yang perlu digabungkan ke tailwind.config.js
// yang sudah ada. Sisanya (content, plugins, darkMode) biarkan apa adanya.

module.exports = {
  theme: {
    extend: {
      colors: {
        // ── token bawaan shadcn, biarkan seperti ini ──
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // ── token khas OPERA ──
        brass: {
          DEFAULT: "hsl(var(--brass))",
          tint: "hsl(var(--brass-tint))",
        },
        teal: {
          DEFAULT: "hsl(var(--teal))",
          tint: "hsl(var(--teal-tint))",
        },
        amber: {
          DEFAULT: "hsl(var(--amber))",
          tint: "hsl(var(--amber-tint))",
        },
        rust: {
          DEFAULT: "hsl(var(--rust))",
          tint: "hsl(var(--rust-tint))",
        },
        ledger: {
          DEFAULT: "hsl(var(--ledger))",
          foreground: "hsl(var(--ledger-foreground))",
        },
      },

      fontFamily: {
        // Judul, angka besar, label tabel. Archivo padat dan tegas —
        // cocok untuk kode rekening dan angka persen yang harus terbaca cepat.
        display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Isi paragraf, label form.
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Kode rekening 5.1.2.2.01.1, angka tabel, label eyebrow.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        // Label eyebrow: kapital, berspasi lebar, kecil.
        eyebrow: ['0.656rem', { lineHeight: '1', letterSpacing: '0.16em' }],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 1px)",
        sm: "calc(var(--radius) - 1px)",
      },

      boxShadow: {
        card: "0 1px 2px rgb(13 27 42 / 0.06), 0 8px 24px -16px rgb(13 27 42 / 0.28)",
      },
    },
  },
};
