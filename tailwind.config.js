/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1A4782",
        secondary: "#FBBF24",
        accent: "#F472B6",
      },
      fontFamily: {
        // Heebo styles (note keys are lower-case and use dashes)
        "heebo-regular": ["Heebo-Regular"],
        "heebo-thin": ["Heebo-Thin"],
        "heebo-light": ["Heebo-Light"],
        "heebo-extralight": ["Heebo-ExtraLight"],
        "heebo-medium": ["Heebo-Medium"],
        "heebo-semibold": ["Heebo-SemiBold"],
        "heebo-bold": ["Heebo-Bold"],
        "heebo-extrabold": ["Heebo-ExtraBold"],
        "heebo-black": ["Heebo-Black"],
        // Tahoma styles
        tahoma: ["Tahoma"],
        "tahoma-bold": ["Tahoma-Bold"],
      },
      spacing: {
        'rtl-2': '0.5rem',
        'rtl-4': '1rem',
        'rtl-6': '1.5rem',
        'rtl-8': '2rem',
      },
    },
  },
  plugins: [],
};
