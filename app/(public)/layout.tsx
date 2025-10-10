import { ReactNode } from "react";
import { Navbar } from "./_components/Navbar";

export default function LayoutPublic({ children }: { children: ReactNode }) {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 lg:px-36 mb-32">
        {children}
      </main>
    </div>
  );
}
