/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#2B2B2B',
        darkBlue: '#023E8A',
        oceanBlue: '#6a8ef7',
        softCyan: '#90E0EF',
        paleBlue: '#CAF0F8',
        lightGray: '#EBEBEB'
      }
    },
  },
  plugins: [],
}
