import "./globals.css";

export const metadata = {
  title: "Creativo — Premium Personalised Stationery & Wall Decor",
  description: "Minimalist posters, personalised photo magazines, planners and memo pads — designed in minutes, printed on premium stock.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
