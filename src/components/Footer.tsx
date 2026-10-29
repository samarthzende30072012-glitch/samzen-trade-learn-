import React from 'react';

export default function Footer({ onOpenAbout, onOpenPolicy }: { onOpenAbout: () => void, onOpenPolicy: () => void }) {
  return (
    <footer className="py-12 border-t border-white/10 mt-12 text-xs font-mono text-slate-500 bg-[#070B12]">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <p className="font-bold text-white">SAMZEN TRADELEARN</p>
          <p className="mt-1">Institutional Academy of Samzen Conglomerate</p>
        </div>
        <div className="flex gap-6 font-bold text-white">
          <button onClick={onOpenAbout} className="hover:text-[#00FF87] transition">About Us</button>
          <button onClick={onOpenPolicy} className="hover:text-[#00FF87] transition">Company Policy</button>
        </div>
        <p>© 2026 Samzen Conglomerate. All rights reserved.</p>
      </div>
    </footer>
  );
}
