/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        klein: '#002FA7',
        kleinDark: '#001E6E',
        kleinMid: '#1A45B8',
        ice: '#EEF2FF',
        iceDeep: '#D6DFFF',
        chrome: '#8FA3D4',
        chromeSoft: '#B8C8FF',
        ink: '#060C1C',
        inkSoft: '#0E1A35',
        mist: '#F4F6FF',
        signal: '#00CFFF',
        safe: '#00C97A',
        warn: '#F5A800',
        danger: '#F53D5B',
        payout: '#7B61FF',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        jetbrains: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
        xl: '28px',
        pill: '100px',
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0,47,167,0.08)',
        md: '0 8px 32px rgba(0,47,167,0.12)',
        lg: '0 20px 60px rgba(0,47,167,0.18)',
      },
      letterSpacing: {
        headline: '-0.04em',
        label: '0.15em',
        wide: '0.18em',
        mono: '0.08em',
      },
      borderWidth: {
        DEFAULT: '1.5px',
        active: '2px',
      },
      borderColor: {
        DEFAULT: 'rgba(0,47,167,0.15)',
        hover: 'rgba(0,47,167,0.30)',
      },
    },
  },
  plugins: [],
}
