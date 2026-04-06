import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as profileService from '../services/profileService'
import type { Skill, SelectedSkill } from '../types/profile'
import LocationAutocomplete from '../components/location/LocationAutocomplete'

const inp = (err?: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px 14px', border: `1.5px solid ${err ? '#f87171' : '#ddd6fe'}`,
  borderRadius: 12, fontSize: 15, outline: 'none', background: err ? '#fef2f2' : '#faf5ff', color: '#1e293b', boxSizing: 'border-box'
})

export default function ProfileSetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [location, setLocation] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [selected, setSelected] = useState<SelectedSkill[]>([])
  const [nameErr, setNameErr] = useState('')
  const [skillsErr, setSkillsErr] = useState('')
  const [rateErrs, setRateErrs] = useState<Record<number, string>>({})
  const [apiErr, setApiErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingSkills, setFetchingSkills] = useState(true)

  useEffect(() => {
    profileService.getProfile().then(r => {
      if (r.profile) { setName(r.profile.name ?? ''); setLocation(r.profile.location ?? '') }
    }).catch(() => {})
    profileService.getSkills().then(setSkills).catch(() => setApiErr('Skills load nahi ho sake.')).finally(() => setFetchingSkills(false))
  }, [])

  const toggleSkill = (s: Skill) => {
    setSkillsErr('')
    setSelected(prev => {
      if (prev.find(x => x.skill_id === s.id)) { setRateErrs(e => { const n = {...e}; delete n[s.id]; return n }); return prev.filter(x => x.skill_id !== s.id) }
      return [...prev, { skill_id: s.id, skill_name: s.name, rate: '', rate_unit: s.rate_unit, rate_unit_label: s.rate_unit_label }]
    })
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!['image/jpeg','image/png'].includes(f.type)) { setApiErr('Sirf JPG aur PNG allowed hain.'); return }
    if (f.size > 2*1024*1024) { setApiErr('Photo 2MB se chhoti honi chahiye.'); return }
    setPhoto(f); setPhotoPreview(URL.createObjectURL(f)); setApiErr('')
  }

  const validate = () => {
    let ok = true
    if (name.trim().length < 2) { setNameErr('Naam kam se kam 2 characters.'); ok = false } else setNameErr('')
    if (selected.length === 0) { setSkillsErr('Kam se kam ek skill select karein.'); ok = false } else setSkillsErr('')
    const re: Record<number, string> = {}
    for (const s of selected) {
      if (s.rate === '' || Number(s.rate) <= 0) { re[s.skill_id] = 'Rate 0 se zyada hona chahiye.'; ok = false }
    }
    setRateErrs(re)
    return ok
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setApiErr('')
    if (!validate()) return
    setLoading(true)
    try {
      if (photo) await profileService.uploadPhoto(photo)
      await profileService.updateProfile({ name: name.trim(), location: location.trim() || undefined, skills: selected.map(s => ({ skill_id: s.skill_id, rate: Number(s.rate) })) })
      navigate('/dashboard')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setApiErr(err?.response?.data?.message ?? 'Kuch galat hua. Dobara try karein.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', fontFamily: 'system-ui,sans-serif' }}>
      {/* Navbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 900, fontSize: 18, color: '#7c3aed' }}>💼 KaamlyTwo</span>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>🏠 Home</button>
      </div>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9,#4f46e5)', padding: '40px 20px 60px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Apni Profile Banao</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0 }}>Naam, photo, location aur skills add karein</p>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px 40px' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ background: '#fff', borderRadius: 24, marginTop: -32, boxShadow: '0 4px 24px rgba(124,58,237,0.1)', border: '1px solid #ede9fe', overflow: 'hidden' }}>

            {/* Photo + Name + Location */}
            <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, borderBottom: '1px solid #ddd6fe' }}>
              <label style={{ cursor: 'pointer' }}>
                <div style={{ width: 88, height: 88, borderRadius: 20, background: photoPreview ? 'transparent' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
                  {photoPreview ? <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32 }}>📷</span>}
                </div>
                <input type="file" accept="image/jpeg,image/png" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
              <p style={{ fontSize: 12, color: '#7c3aed', margin: 0 }}>Photo click karke upload karein</p>

              <div style={{ width: '100%' }}>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setNameErr('') }} placeholder="Apna poora naam likhein"
                  style={{ ...inp(!!nameErr), textAlign: 'center', fontSize: 18, fontWeight: 700 }} />
                {nameErr && <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', marginTop: 4 }}>⚠️ {nameErr}</p>}
              </div>

              <div style={{ width: '100%' }}>
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  placeholder="📍 Apna area (jaise: Jaipur, Delhi)"
                />
              </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Skills */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>💼 Apna Kaam Select Karo</h3>
                {fetchingSkills ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ height: 90, borderRadius: 16, background: '#f1f5f9' }} />)}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {skills.map(s => {
                      const isSel = selected.some(x => x.skill_id === s.id)
                      return (
                        <button key={s.id} type="button" onClick={() => toggleSkill(s)}
                          style={{ padding: '14px 10px', borderRadius: 16, border: `2px solid ${isSel ? '#7c3aed' : '#e2e8f0'}`, background: isSel ? '#f5f3ff' : '#fff', cursor: 'pointer', textAlign: 'center', position: 'relative' }}>
                          {isSel && <span style={{ position: 'absolute', top: 6, right: 6, background: '#7c3aed', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
                          <div style={{ fontSize: 28 }}>{s.icon}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? '#7c3aed' : '#374151', marginTop: 4 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.rate_unit_label}</div>
                        </button>
                      )
                    })}
                  </div>
                )}
                {skillsErr && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>⚠️ {skillsErr}</p>}
              </div>

              {/* Rates */}
              {selected.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>💰 Apna Rate Set Karo</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selected.map(s => {
                      const skill = skills.find(x => x.id === s.skill_id)
                      if (!skill) return null
                      return (
                        <div key={s.skill_id}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span>{skill.icon}</span> {skill.name}
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${rateErrs[s.skill_id] ? '#f87171' : '#ddd6fe'}`, borderRadius: 12, overflow: 'hidden', background: '#faf5ff' }}>
                            <span style={{ padding: '0 10px', color: '#94a3b8', fontSize: 13 }}>Rs</span>
                            <input type="number" min="1" value={s.rate} onChange={e => {
                              const v = parseInt(e.target.value)
                              setSelected(prev => prev.map(x => x.skill_id === s.skill_id ? { ...x, rate: isNaN(v) ? '' : v } : x))
                              setRateErrs(prev => { const n = {...prev}; delete n[s.skill_id]; return n })
                            }} placeholder="0" style={{ flex: 1, padding: '12px 8px', border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: '#1e293b' }} />
                            <span style={{ padding: '0 10px', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>{skill.rate_unit_label}</span>
                          </div>
                          {rateErrs[s.skill_id] && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {rateErrs[s.skill_id]}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {apiErr && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>❌ {apiErr}</div>}

              <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                {loading ? '⏳ Save ho raha hai...' : '🚀 Profile Save Karo'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
