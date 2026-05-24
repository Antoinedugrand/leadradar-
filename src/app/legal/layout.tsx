import "@/app/app-styles.css";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lr-artboard-host min-h-screen bg-white">
      <div className="lr-legal-shell">{children}</div>
    </div>
  );
}
