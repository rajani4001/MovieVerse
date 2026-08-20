/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  "theme": {
    "extend": {
      "colors": {
        "dark": "#0f0f0f",
        "netRed": "#e50914"
      }
    }
  },
  "plugins": []
}
