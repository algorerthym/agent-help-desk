import { Nav } from "@/components/Nav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap">
      <Nav />
      {children}
    </div>
  );
}
