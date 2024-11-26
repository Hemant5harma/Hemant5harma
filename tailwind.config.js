const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    fontFamily: {
      satoshi: ['Satoshi', 'sans-serif'],
    },
    extend: {
      colors: {
        current: 'currentColor',
        transparent: 'transparent',
        white: '#FFFFFF',
        black: {
          ...colors.black,
          DEFAULT: '#1C2434',
          2: '#010101',
        },
        red: {
          ...colors.red,
          DEFAULT: '#FB5454',
        },
        body: '#64748B',
        bodydark: '#AEB7C0',
        bodydark1: '#DEE4EE',
        bodydark2: '#8A99AF',
        primary: '#3C50E0',
        secondary: '#80CAEE',
        stroke: '#E2E8F0',
        gray: {
          ...colors.gray,
          DEFAULT: '#EFF4FB',
          2: '#F7F9FC',
          3: '#FAFAFA',
        },
        graydark: '#333A48',
        whiten: '#F1F5F9',
        whiter: '#F5F7FD',
        boxdark: '#24303F',
        'boxdark-2': '#1A222C',
        strokedark: '#2E3A47',
        'form-strokedark': '#3d4d60',
        'form-input': '#1d2a39',
        meta: {
          1: '#DC3545',
          2: '#EFF2F7',
          3: '#10B981',
          4: '#313D4A',
          5: '#259AE6',
          6: '#FFBA00',
          7: '#FF6766',
          8: '#F0950C',
          9: '#E5E7EB',
          10: '#0FADCF',
        },
        success: '#219653',
        danger: '#D34053',
        warning: '#FFA70B',
      },
      zIndex: {
        999999: '999999',
        99999: '99999',
        9999: '9999',
        999: '999',
        99: '99',
        9: '9',
        1: '1',
      },
      boxShadow: {
        default: '0px 8px 13px -3px rgba(0, 0, 0, 0.07)',
      },
    },
  },
  plugins: [],
}

