import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui,sans-serif' }}>
      {/* Left panel - desktop */}
      <div style={{ width: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9,#4f46e5)', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden', display: 'none' }} id="left-panel">
        <div style={{ position: 'absolute', top: -80, left: -80, width: 280, height: 280, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 360, height: 360, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>💼</div>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-1px' }}>KaamlyTwo</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, margin: '0 0 6px' }}>Your Work, Your Identity</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, maxWidth: 280, margin: '0 auto 40px' }}>Painters, drivers, helpers, IT workers — find the right professional here</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[['🎨','Painter'],['🚗','Driver'],['💻','IT Expert'],['🔧','Helper'],['🏗️','Builder'],['📦','Delivery']].map(([e,l]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>{e}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8f7ff' }}>
        {/* Mobile header */}
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 26 }}>💼</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>KaamlyTwo</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 }}>Your Work, Your Identity</p>
        </div>

        {/* Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px' }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(124,58,237,0.1)', padding: '32px 28px', border: '1px solid #ede9fe' }}>
            {children}
          </div>
          <p style={{ marginTop: 20, fontSize: 12, color: '#94a3b8' }}>© 2026 KaamlyTwo. All rights reserved.</p>
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
