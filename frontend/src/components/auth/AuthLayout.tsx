import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui,sans-serif', background: '#0f0a1e', position: 'relative', overflow: 'hidden' }}>

      {/* Animated background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div className="blob1" style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="blob2" style={{ position: 'absolute', top: '30%', right: '-10%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="blob3" style={{ position: 'absolute', bottom: '-10%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="blob4" style={{ position: 'absolute', top: '60%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* Left panel - desktop */}
      <div style={{ width: '50%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden', display: 'none', zIndex: 1 }} id="left-panel">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#7c3aed,#4f46e5,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36, boxShadow: '0 0 40px rgba(124,58,237,0.6)' }}>💼</div>
          <h1 style={{ fontSize: 52, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-2px', background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>KaamlyTwo</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, margin: '0 0 8px' }}>Your Work, Your Identity</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, maxWidth: 300, margin: '0 auto 48px', lineHeight: 1.6 }}>Connect with skilled professionals or offer your services to thousands of customers</p>

          {/* Feature cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['🎨','Painter'],['🚗','Driver'],['💻','Developer'],['🔧','Plumber'],['🏗️','Builder'],['📦','Delivery']].map(([e,l]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 8px', textAlign: 'center', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 26 }}>{e}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 40 }}>
            {[['500+','Workers'],['50+','Skills'],['1000+','Jobs']].map(([n,l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{n}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {/* Mobile header */}
        <div style={{ padding: '24px 20px 20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '10px 20px' }}>
            <span style={{ fontSize: 24 }}>💼</span>
            <span style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>KaamlyTwo</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '8px 0 0' }}>Your Work, Your Identity</p>
        </div>

        {/* Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px 32px' }}>
          <div style={{ width: '100%', maxWidth: 440, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)', padding: '36px 28px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {children}
          </div>
          <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 KaamlyTwo. All rights reserved.</p>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          #left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
