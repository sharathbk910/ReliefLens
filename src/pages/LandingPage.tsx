import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Cpu,
  ArrowUpRight,
  MousePointer2,
  ShieldCheck,
  Star,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('Core');
  const [copied, setCopied] = useState(false);

  const handleExportPalette = () => {
    const palette = {
      primaryBackground: '#0c0c0c',
      viewportBlack: '#000000',
      accentPrimary: '#ccff00',
      secondaryGlow: '#10b981',
      textPrimary: '#ebebeb',
      glassBg: 'rgba(255, 255, 255, 0.03)',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
    };
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(palette, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#ebebeb] p-3 sm:p-6 md:p-10 font-sans selection:bg-[#ccff00] selection:text-black relative overflow-x-hidden">
      {/* Background Noise Texture Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 1. FLOATING SHELL CONTAINER */}
      <div className="relative z-10 max-w-[1600px] mx-auto rounded-[2.5rem] ring-1 ring-white/10 shadow-2xl bg-[#0c0c0c] overflow-hidden flex flex-col">
        {/* 2. BACKGROUND ELEMENTS: Grid pattern & Glow Spheres */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 z-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glow Sphere 1: Lime */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#ccff00]/10 blur-[120px] pointer-events-none z-0" />

        {/* Glow Sphere 2: Emerald */}
        <div className="absolute bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#10b981]/5 blur-[120px] pointer-events-none z-0" />

        {/* 3. NAVIGATION HEADER */}
        <header className="relative z-50 flex justify-between items-center px-6 md:px-10 py-6 md:py-8 border-b border-white/[0.05]">
          {/* Left Logo Section */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-[#ccff00] rounded-xl flex items-center justify-center text-black font-bold text-2xl shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-transform group-hover:scale-105">
              S
            </div>
            <div>
              <span className="font-bold text-xl tracking-tighter text-white block leading-none">
                SUPER_SYSTEM
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#ccff00] font-semibold">
                INDUSTRIAL_CORE // 0x22
              </span>
            </div>
          </Link>

          {/* Center Navigation Pill-bar */}
          <nav className="hidden md:flex items-center gap-2 bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-lg">
            {[
              { id: 'Core', label: 'Core', action: () => navigate('/dashboard') },
              { id: 'Bento', label: 'Bento', action: () => document.getElementById('bento')?.scrollIntoView({ behavior: 'smooth' }) },
              { id: 'Logic', label: 'Logic', action: () => document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' }) },
              { id: 'Sync', label: 'Sync', action: () => navigate('/map') },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveNav(item.id);
                  item.action();
                }}
                className={`px-6 py-2 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${
                  activeNav === item.id
                    ? 'text-white bg-white/15 font-bold shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Status Section */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:flex items-center gap-2 font-mono uppercase tracking-[0.2em] text-[10px] text-white/50 bg-white/[0.03] border border-white/10 px-3.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-ping" />
              <span>NODE_ACTIVE // ONLINE</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#ccff00] transition-all duration-300 hover:scale-105 shadow-lg active:scale-95"
            >
              LAUNCH APP
            </button>
          </div>
        </header>

        {/* 4. HERO SECTION */}
        <section className="relative z-10 px-6 md:px-10 pt-10 md:pt-14 pb-20 md:pb-28 border-b border-white/[0.05]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column (col-span-7) */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="font-mono text-[#ccff00] text-xs md:text-sm tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
                <span>Module // 0x4F92 — AI_ENGINE</span>
              </div>

              <h1 className="text-5xl sm:text-7xl lg:text-[7.25rem] font-bold tracking-[-0.06em] leading-[0.88] text-white">
                ENGINEERING <br />
                <span className="italic bg-gradient-to-r from-[#ccff00] via-[#d8ff33] to-white bg-clip-text text-transparent">
                  NEXT-GEN
                </span>{' '}
                <br />
                INTERFACES
              </h1>

              <p className="mt-8 md:mt-10 text-lg md:text-xl text-white/60 max-w-xl leading-relaxed font-sans">
                A high-fidelity design system for industrial intelligence. Focused on clarity,
                obsidian depth, and lime precision.
              </p>

              {/* CTA Section */}
              <div className="mt-10 md:mt-12 flex flex-wrap items-center gap-4 md:gap-6">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="bg-[#ccff00] text-black px-8 md:px-10 py-4 md:py-5 rounded-full font-bold text-base md:text-lg shadow-[0_0_30px_rgba(204,255,0,0.25)] hover:shadow-[0_0_50px_rgba(204,255,0,0.5)] hover:scale-105 active:scale-95 transition-all duration-400 font-sans"
                >
                  INITIALIZE PROTOCOL
                </button>

                <Link
                  to="/audit"
                  className="flex items-center gap-3 text-white/80 hover:text-white group transition-colors"
                >
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white/10 group-hover:border-[#ccff00]/60 transition-colors">
                    <Play className="w-5 h-5 text-[#ccff00] fill-[#ccff00] translate-x-0.5" />
                  </div>
                  <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase">
                    VIEW_LOGS
                  </span>
                </Link>
              </div>
            </div>

            {/* Right Column (col-span-5) */}
            <div className="lg:col-span-5 relative min-h-[460px] flex items-center justify-center mt-8 lg:mt-0">
              {/* Floating Glassmorphic Mockup Card */}
              <div className="bg-white/[0.03] backdrop-blur-[16px] border border-white/10 w-full max-w-md aspect-[4/5] rounded-[3rem] p-6 md:p-8 flex flex-col gap-6 animate-float shadow-2xl relative">
                {/* Card Header */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white/20" />
                    <span className="w-3 h-3 rounded-full bg-white/15" />
                    <span className="w-3 h-3 rounded-full bg-[#ccff00]/60" />
                  </div>
                  <span className="font-mono text-[10px] text-white/40 tracking-widest uppercase">
                    CORE_PROCESSOR_V2
                  </span>
                </div>

                {/* Card Visualization */}
                <div className="h-40 w-full bg-gradient-to-br from-white/10 via-white/[0.02] to-transparent rounded-2xl border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#ccff00]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Cpu className="w-16 h-16 text-[#ccff00]/60" strokeWidth={1.5} />
                </div>

                {/* Card Data Bars */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-white/50">
                      <span>SYNAPSE_BANDWIDTH</span>
                      <span>75%</span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-white/40 rounded-full w-[75%]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-white/50">
                      <span>SPATIAL_CLUSTER_LOAD</span>
                      <span>50%</span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-[#10b981]/60 rounded-full w-[50%]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-white/50">
                      <span>THERMAL_INTEGRITY</span>
                      <span>66%</span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-[#ccff00]/60 rounded-full w-[66%]" />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-auto flex justify-between items-end pt-4 border-t border-white/10">
                  <div>
                    <span className="block font-mono text-[10px] text-white/40 uppercase tracking-widest">
                      SYSTEM_EFFICIENCY
                    </span>
                    <span className="font-mono text-[#ccff00] text-3xl md:text-4xl font-bold tracking-tight">
                      89.4%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-12 h-12 bg-[#ccff00] hover:bg-[#d8ff33] rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform"
                    aria-label="Open Processor Details"
                  >
                    <ArrowUpRight className="w-6 h-6" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Floating Cursor Label */}
              <div className="absolute top-6 md:top-14 -right-2 md:-right-6 bg-[#ccff00] text-black px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-2xl animate-pulseSlow z-20">
                <MousePointer2 className="w-3.5 h-3.5 fill-black" />
                <span className="font-mono text-[10px] tracking-wider uppercase">
                  AI_CURSOR_ACTIVE
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. BENTO GRID SECTION */}
        <section id="bento" className="relative z-10 px-6 md:px-10 py-20 md:py-28 border-b border-white/[0.05]">
          {/* Section Header */}
          <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
                SYSTEM_CAPABILITIES
              </h2>
              <p className="text-white/25 mt-2 md:mt-4 font-mono uppercase tracking-widest text-xs">
                Grid_Array // v0.1
              </p>
            </div>
            <div className="hidden md:block w-24 h-px bg-white/10 mb-4" />
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CARD 1: 2×2 Large Data Card */}
            <div className="lg:col-span-2 lg:row-span-2 bg-white/[0.03] backdrop-blur-[16px] border border-white/10 rounded-[2.5rem] p-8 md:p-10 flex flex-col hover:border-[#ccff00]/40 transition-colors duration-500 shadow-xl group">
              <div>
                <span className="font-mono text-[10px] text-[#ccff00] uppercase tracking-[0.25em] block mb-2 font-semibold">
                  NEURAL_ANALYTICS // LIVE
                </span>
                <h3 className="text-3xl font-bold text-white tracking-tight">
                  Data Synthesis
                </h3>
                <p className="text-white/50 mt-4 max-w-sm text-sm leading-relaxed font-sans">
                  Advanced neural architecture visualizing real-time metrics across globally
                  distributed nodes.
                </p>
              </div>

              {/* Data visualization bars */}
              <div className="mt-12 flex items-end gap-3 h-40 pt-4">
                <div
                  className="flex-1 bg-white/5 rounded-t-xl hover:bg-[#ccff00]/20 transition-all duration-300"
                  style={{ height: '40%' }}
                  title="Node 1 - 40%"
                />
                <div
                  className="flex-1 bg-white/5 rounded-t-xl hover:bg-[#ccff00]/20 transition-all duration-300"
                  style={{ height: '70%' }}
                  title="Node 2 - 70%"
                />
                <div
                  className="flex-1 bg-[#ccff00]/40 rounded-t-xl shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:bg-[#ccff00]/60 transition-all duration-300 relative group/bar"
                  style={{ height: '100%' }}
                  title="Peak Core - 100%"
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 font-mono text-[10px] text-[#ccff00] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity">
                    PEAK
                  </span>
                </div>
                <div
                  className="flex-1 bg-white/5 rounded-t-xl hover:bg-[#ccff00]/20 transition-all duration-300"
                  style={{ height: '55%' }}
                  title="Node 3 - 55%"
                />
                <div
                  className="flex-1 bg-white/5 rounded-t-xl hover:bg-[#ccff00]/20 transition-all duration-300"
                  style={{ height: '85%' }}
                  title="Node 4 - 85%"
                />
                <div
                  className="flex-1 bg-white/5 rounded-t-xl hover:bg-[#ccff00]/20 transition-all duration-300"
                  style={{ height: '30%' }}
                  title="Node 5 - 30%"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between font-mono text-[10px] text-white/40">
                <span>METRICS_STREAMING: 6 NODES</span>
                <span className="text-[#ccff00]">STABLE</span>
              </div>
            </div>

            {/* CARD 2: Tall Color Tokens Card */}
            <div className="lg:row-span-2 bg-white/[0.03] backdrop-blur-[16px] border border-white/10 rounded-[2.5rem] p-6 md:p-8 flex flex-col hover:border-[#ccff00]/40 transition-colors duration-500 shadow-xl">
              <span className="font-mono text-xs text-[#ccff00] mb-8 tracking-[0.2em] uppercase font-bold">
                COLOR_TOKENS
              </span>

              <div className="space-y-4 flex-1">
                {/* Swatch 1: Lime */}
                <div className="flex items-center gap-4 p-2 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-16 h-16 bg-[#ccff00] rounded-2xl shadow-lg shrink-0 flex items-center justify-center text-black font-bold font-mono text-xs">
                    LIME
                  </div>
                  <div className="font-mono text-[10px] text-white/40 space-y-0.5">
                    <span className="text-white font-bold block text-xs">#CCFF00</span>
                    <span>ACCENT_PRIMARY</span>
                  </div>
                </div>

                {/* Swatch 2: Emerald */}
                <div className="flex items-center gap-4 p-2 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-16 h-16 bg-[#10b981] rounded-2xl shadow-lg shrink-0 flex items-center justify-center text-white font-bold font-mono text-xs">
                    EMR
                  </div>
                  <div className="font-mono text-[10px] text-white/40 space-y-0.5">
                    <span className="text-white font-bold block text-xs">#10B981</span>
                    <span>SECONDARY_GLOW</span>
                  </div>
                </div>

                {/* Swatch 3: Obsidian */}
                <div className="flex items-center gap-4 p-2 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-16 h-16 bg-[#0c0c0c] border border-white/20 rounded-2xl shadow-lg shrink-0 flex items-center justify-center text-white/60 font-bold font-mono text-xs">
                    OBS
                  </div>
                  <div className="font-mono text-[10px] text-white/40 space-y-0.5">
                    <span className="text-white font-bold block text-xs">#0C0C0C</span>
                    <span>SURFACE_BASE</span>
                  </div>
                </div>
              </div>

              {/* Export Palette Button */}
              <button
                type="button"
                onClick={handleExportPalette}
                className="mt-10 w-full py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors font-mono text-[10px] uppercase text-white/80 hover:text-white tracking-widest text-center"
              >
                {copied ? 'PALETTE_COPIED ✓' : 'EXPORT_PALETTE'}
              </button>
            </div>

            {/* CARD 3: Accent Lime Card */}
            <div
              onClick={() => navigate('/dashboard')}
              className="bg-[#ccff00] rounded-[2.5rem] p-8 flex flex-col justify-between text-black relative overflow-hidden group cursor-pointer shadow-xl min-h-[220px]"
            >
              {/* Texture Overlay */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")`,
                }}
              />

              <div className="relative z-10">
                <h3 className="text-2xl font-bold leading-tight">
                  Instant Performance Optimization.
                </h3>
                <p className="mt-4 text-black/70 font-medium text-xs leading-relaxed">
                  Unlock peak thermal efficiency through lime-core processing.
                </p>
              </div>

              <div className="relative z-10 mt-8 text-3xl font-bold tracking-tighter group-hover:translate-x-2 transition-transform flex items-center gap-1">
                <span>GO_HYPER →</span>
              </div>
            </div>

            {/* CARD 4: Small Glass Card */}
            <div className="bg-white/[0.03] backdrop-blur-[16px] border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center hover:border-[#ccff00]/40 transition-colors duration-500 shadow-xl min-h-[220px]">
              <ShieldCheck className="w-14 h-14 text-[#10b981] mb-4" strokeWidth={1.5} />
              <span className="font-mono text-[10px] text-white/40 tracking-[0.25em] uppercase font-bold">
                ENCRYPTED_FLOW
              </span>
              <span className="font-mono text-[9px] text-[#ccff00] mt-1">SHA_256 // VERIFIED</span>
            </div>
          </div>
        </section>

        {/* 6. CONTRAST METHODOLOGY SECTION (Light Section) */}
        <section
          id="methodology"
          className="bg-[#e5e5e5] rounded-t-[3rem] md:rounded-t-[4rem] text-black px-6 md:px-10 py-20 md:py-28 relative overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column (col-span-6) */}
            <div className="lg:col-span-6">
              <span className="font-mono text-xs md:text-sm text-black/40 tracking-[0.3em] uppercase mb-8 block font-semibold">
                METHODOLOGY // ALPHA
              </span>

              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-12 leading-[1.05]">
                A logic-first approach <br />
                to machine design.
              </h2>

              <div className="space-y-10 md:space-y-12">
                {/* List Item 1 */}
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full border border-black/20 flex items-center justify-center shrink-0 font-mono font-bold text-sm bg-black/5">
                    01
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Information Density</h3>
                    <p className="text-black/60 mt-2 text-sm leading-relaxed">
                      Maximize throughput without cognitive overload using high-contrast anchors.
                    </p>
                  </div>
                </div>

                {/* List Item 2 */}
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full border border-black/20 flex items-center justify-center shrink-0 font-mono font-bold text-sm bg-black/5">
                    02
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Visual Hierarchy</h3>
                    <p className="text-black/60 mt-2 text-sm leading-relaxed">
                      Obsidian depth layers ensure secondary data never competes with primary actions.
                    </p>
                  </div>
                </div>

                {/* List Item 3 */}
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full border border-black/20 flex items-center justify-center shrink-0 font-mono font-bold text-sm bg-black/5">
                    03
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Hardware Aesthetic</h3>
                    <p className="text-black/60 mt-2 text-sm leading-relaxed">
                      Designing interfaces that feel like physical components of a supercomputer.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (col-span-6): Profile Image + Testimonial Glass Overlay */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end relative mt-8 lg:mt-0">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"
                  alt="Marcus Thorne - CTO"
                  className="w-[320px] sm:w-[420px] md:w-[480px] h-[320px] sm:h-[420px] md:h-[480px] rounded-full overflow-hidden grayscale border-8 border-white shadow-2xl object-cover"
                />

                {/* Testimonial Glass Overlay */}
                <div className="absolute -bottom-6 md:bottom-8 left-0 md:-left-8 bg-black/80 backdrop-blur-[48px] border border-white/20 rounded-[2.5rem] p-6 md:p-8 max-w-sm shadow-2xl text-left">
                  {/* 5 Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#ccff00] text-[#ccff00]" />
                    ))}
                  </div>

                  <p className="text-sm md:text-base font-medium leading-relaxed italic text-white">
                    "The obsidian aesthetic combined with lime precision transformed how our team
                    interacts with industrial data."
                  </p>

                  <div className="mt-6 pt-3 border-t border-white/10">
                    <span className="font-bold text-white text-sm block">Marcus Thorne</span>
                    <span className="font-mono text-[10px] text-white/40 tracking-wider uppercase block">
                      CTO @ NEURAL_SYNC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FOOTER */}
        <footer className="bg-[#000000] relative pt-24 md:pt-32 pb-12 px-6 md:px-10 overflow-hidden text-white border-t border-white/[0.05]">
          {/* Watermark */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-8xl md:text-[15rem] font-bold text-white/[0.04] select-none pointer-events-none tracking-tighter leading-none">
            SUPER
          </div>

          {/* CTA Section */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-8 md:mb-12 text-white">
              READY TO INITIALIZE?
            </h2>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="group relative w-full h-20 md:h-24 bg-[#ccff00] text-black rounded-full overflow-hidden font-bold text-xl md:text-3xl transition-all duration-500 shadow-[0_0_40px_rgba(204,255,0,0.3)] hover:shadow-[0_0_60px_rgba(204,255,0,0.6)] flex items-center justify-center active:scale-95"
            >
              <span className="relative z-10 tracking-wider">SYNC_SYSTEM_NOW</span>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
          </div>

          {/* Footer Grid */}
          <div className="mt-24 md:mt-32 border-t border-white/10 pt-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 relative z-10">
            {/* Column 1: Logo & Description */}
            <div>
              <div className="w-10 h-10 bg-[#ccff00] rounded-lg flex items-center justify-center text-black font-bold text-xl mb-6 shadow-md">
                S
              </div>
              <p className="text-white/40 text-xs leading-relaxed max-w-xs font-sans">
                Pioneering the next era of industrial human-computer interaction through dark-mode
                architectures.
              </p>
            </div>

            {/* Column 2: Links Grid */}
            <div className="grid grid-cols-2 gap-8 font-mono text-[11px] tracking-widest text-white/40">
              <div>
                <span className="text-white font-bold block mb-4">MODULES</span>
                <ul className="space-y-3">
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="hover:text-[#ccff00] transition-colors uppercase text-left"
                    >
                      AUTHORITY
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate('/map')}
                      className="hover:text-[#ccff00] transition-colors uppercase text-left"
                    >
                      NODES
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate('/reports/new')}
                      className="hover:text-[#ccff00] transition-colors uppercase text-left"
                    >
                      SYNAPSE
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <span className="text-white font-bold block mb-4">CONNECT</span>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#ccff00] transition-colors uppercase"
                    >
                      TWITTER
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#ccff00] transition-colors uppercase"
                    >
                      GITHUB
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://discord.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#ccff00] transition-colors uppercase"
                    >
                      DISCORD
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 3: Social & Copyright */}
            <div className="flex flex-col md:items-end justify-between gap-6">
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-[#ccff00] hover:text-[#ccff00] transition-colors"
                  aria-label="GitHub Repository"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-[#ccff00] hover:text-[#ccff00] transition-colors"
                  aria-label="Twitter Profile"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>

              <div className="font-mono text-[10px] text-white/20 md:text-right uppercase tracking-[0.2em] leading-relaxed">
                © 2024 SUPER_SYSTEM_INTL <br />
                ALL_RIGHTS_RESERVED // 0x229A
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
