import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as profileService from '../services/profileService'
import type { Category, Skill, SelectedSkill } from '../types/profile'
import LocationAutocomplete from '../components/location/LocationAutocomplete'

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: '#22c55e', desc: '0–1 year' },
  { value: 'intermediate', label: 'Intermediate', color: '#f59e0b', desc: '1–3 years' },
  { value: 'expert', label: 'Expert', color: '#7c3aed', desc: '3+ years' },
]

const RATE_TYPES = [
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'per_day', label: 'Per Day' },
  { value: 'per_task', label: 'Per Task' },
  { value: 'per_sqft', label: 'Per Sq Ft' },
  { value: 'per_month', label: 'Per Month' },
]

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
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<SelectedSkill[]>([])
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null)
  const [nameErr, setNameErr] = useState('')
  const [skillsErr, setSkillsErr] = useState('')
  const [rateErrs, setRateErrs] = useState<Record<number, string>>({})
  const [apiErr, setApiErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingSkills, setFetchingSkills] = useState(true)

  useEffect(() => {
    profileService.getProfile().then(r => {
      if (r.profile) {
        setName(r.profile.name ?? '')
        setLocation(r.profile.location ?? '')
        // Pre-populate selected skills
        if (r.profile.skills?.length) {
          const preSelected: SelectedSkill[] = r.profile.skills.map(s => ({
            skill_id: s.id,
            skill_name: s.name,
            rate: s.rate,
            rate_type: s.rate_type || 'per_task',
            rate_unit: s.rate_unit,
            rate_unit_label: s.rate_unit_label,
            experience_level: (s.experience_level as 'beginner' | 'intermediate' | 'expert') || 'beginner',
            sub_skill_ids: s.sub_skills?.map(ss => ss.id) || [],
          }))
          setSelected(preSelected)
        }
      }
    }).catch(() => {})
    profileService.getCategories()
      .then(data => setCategories(data || []))
      .catch(() => setApiErr('Failed to load skills. Please make sure the backend is running.'))
      .finally(() => setFetchingSkills(false))
  }, [])

  const isSkillSelected = (skillId: number) => selected.some(x => x.skill_id === skillId)

  const toggleSkill = (skill: Skill) => {
    setSkillsErr('')
    if (isSkillSelected(skill.id)) {
      setSelected(prev => prev.filter(x => x.skill_id !== skill.id))
      setRateErrs(e => { const n = { ...e }; delete n[skill.id]; return n })
    } else {
      setSelected(prev => [...prev, {
        skill_id: skill.id,
        skill_name: skill.name,
        rate: '',
        rate_type: skill.rate_unit || 'per_task',
        rate_unit: skill.rate_unit,
        rate_unit_label: skill.rate_unit_label,
        experience_level: 'beginner',
        sub_skill_ids: [],
      }])
    }
  }

  const toggleSubSkill = (skillId: number, subId: number) => {
    setSelected(prev => prev.map(s => {
      if (s.skill_id !== skillId) return s
      const has = s.sub_skill_ids.includes(subId)
      return { ...s, sub_skill_ids: has ? s.sub_skill_ids.filter(id => id !== subId) : [...s.sub_skill_ids, subId] }
    }))
  }

  const updateSkillField = (skillId: number, field: keyof SelectedSkill, value: unknown) => {
    setSelected(prev => prev.map(s => s.skill_id === skillId ? { ...s, [field]: value } : s))
    if (field === 'rate') setRateErrs(prev => { const n = { ...prev }; delete n[skillId]; return n })
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!['image/jpeg', 'image/png'].includes(f.type)) { setApiErr('Only JPG and PNG files are allowed.'); return }
    if (f.size > 2 * 1024 * 1024) { setApiErr('Photo must be smaller than 2MB.'); return }
    setPhoto(f); setPhotoPreview(URL.createObjectURL(f)); setApiErr('')
  }

  const validate = () => {
    let ok = true
    if (name.trim().length < 2) { setNameErr('Name must be at least 2 characters.'); ok = false } else setNameErr('')
    if (selected.length === 0) { setSkillsErr('Please select at least one skill.'); ok = false } else setSkillsErr('')
    const re: Record<number, string> = {}
    for (const s of selected) {
      if (s.rate === '' || Number(s.rate) <= 0) { re[s.skill_id] = 'Rate must be greater than 0.'; ok = false }
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
      await profileService.updateProfile({
        name: name.trim(),
        location: location.trim() || undefined,
        skills: selected.map(s => ({
          skill_id: s.skill_id,
          rate: Number(s.rate),
          rate_type: s.rate_type,
          experience_level: s.experience_level,
          sub_skill_ids: s.sub_skill_ids,
        }))
      })
      navigate('/dashboard')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setApiErr(err?.response?.data?.message ?? 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const selectedCount = selected.length

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
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Set Up Your Profile</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0 }}>Add your name, photo, location and skills</p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 40px' }}>
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
              <p style={{ fontSize: 12, color: '#7c3aed', margin: 0 }}>Click to upload a photo</p>

              <div style={{ width: '100%' }}>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setNameErr('') }} placeholder="Enter your full name"
                  style={{ ...inp(!!nameErr), textAlign: 'center', fontSize: 18, fontWeight: 700 }} />
                {nameErr && <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', marginTop: 4 }}>⚠️ {nameErr}</p>}
              </div>

              <div style={{ width: '100%' }}>
                <LocationAutocomplete value={location} onChange={setLocation} placeholder="📍 Your area (e.g. Jaipur, Delhi)" />
              </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Category → Skill → Sub-skill selector */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: 0 }}>💼 Select Your Skills</h3>
                  {selectedCount > 0 && (
                    <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{selectedCount} selected</span>
                  )}
                </div>

                {fetchingSkills ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 56, borderRadius: 14, background: '#f1f5f9' }} />)}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(categories || []).map(cat => {
                      const isExpanded = expandedCategory === cat.id
                      const catSkills = cat.skills || []
                      const catSelectedCount = catSkills.filter(s => isSkillSelected(s.id)).length

                      return (
                        <div key={cat.id} style={{ border: `1.5px solid ${isExpanded ? '#7c3aed' : '#e2e8f0'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                          {/* Category header */}
                          <button
                            type="button"
                            onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                            style={{ width: '100%', padding: '14px 16px', background: isExpanded ? '#f5f3ff' : '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
                          >
                            <span style={{ fontSize: 24 }}>{cat.icon}</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{cat.name}</p>
                              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{catSkills.length} skills available</p>
                            </div>
                            {catSelectedCount > 0 && (
                              <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{catSelectedCount}</span>
                            )}
                            <span style={{ color: '#7c3aed', fontSize: 18, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                          </button>

                          {/* Skills inside category */}
                          {isExpanded && (
                            <div style={{ padding: '8px 12px 12px', background: '#faf5ff', borderTop: '1px solid #ede9fe', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              {catSkills.map(skill => {
                                const isSel = isSkillSelected(skill.id)
                                return (
                                  <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    style={{ padding: '12px 10px', borderRadius: 14, border: `2px solid ${isSel ? '#7c3aed' : '#e2e8f0'}`, background: isSel ? '#ede9fe' : '#fff', cursor: 'pointer', textAlign: 'center', position: 'relative', transition: 'all 0.15s' }}
                                  >
                                    {isSel && <span style={{ position: 'absolute', top: 6, right: 6, background: '#7c3aed', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
                                    <div style={{ fontSize: 26 }}>{skill.icon}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: isSel ? '#7c3aed' : '#374151', marginTop: 4 }}>{skill.name}</div>
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{skill.rate_unit_label}</div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                {skillsErr && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>⚠️ {skillsErr}</p>}
              </div>

              {/* Selected skills detail: sub-skills, experience, rate */}
              {selected.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: '0 0 12px' }}>⚙️ Configure Your Skills</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {selected.map(sel => {
                      // Find skill object
                      let skillObj: Skill | undefined
                      for (const cat of categories) {
                        skillObj = cat.skills.find(s => s.id === sel.skill_id)
                        if (skillObj) break
                      }
                      if (!skillObj) return null

                      return (
                        <div key={sel.skill_id} style={{ background: '#f8f7ff', borderRadius: 16, border: '1.5px solid #ddd6fe', padding: '16px' }}>
                          {/* Skill header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <span style={{ fontSize: 24 }}>{skillObj.icon}</span>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#1e293b', flex: 1 }}>{skillObj.name}</p>
                            <button type="button" onClick={() => toggleSkill(skillObj!)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>✕</button>
                          </div>

                          {/* Sub-skills */}
                          {(skillObj.sub_skills || []).length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Sub-skills (optional)</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {(skillObj.sub_skills || []).map(sub => {
                                  const isSubSel = sel.sub_skill_ids.includes(sub.id)
                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() => toggleSubSkill(sel.skill_id, sub.id)}
                                      style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${isSubSel ? '#7c3aed' : '#e2e8f0'}`, background: isSubSel ? '#ede9fe' : '#fff', color: isSubSel ? '#7c3aed' : '#64748b', fontSize: 12, fontWeight: isSubSel ? 700 : 400, cursor: 'pointer' }}
                                    >
                                      {isSubSel ? '✓ ' : ''}{sub.name}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Experience Level */}
                          <div style={{ marginBottom: 14 }}>
                            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Experience Level</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {EXPERIENCE_LEVELS.map(lvl => {
                                const isActive = sel.experience_level === lvl.value
                                return (
                                  <button
                                    key={lvl.value}
                                    type="button"
                                    onClick={() => updateSkillField(sel.skill_id, 'experience_level', lvl.value)}
                                    style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: `1.5px solid ${isActive ? lvl.color : '#e2e8f0'}`, background: isActive ? `${lvl.color}15` : '#fff', cursor: 'pointer', textAlign: 'center' }}
                                  >
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: isActive ? lvl.color : '#64748b' }}>{lvl.label}</p>
                                    <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>{lvl.desc}</p>
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Rate */}
                          <div>
                            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Your Rate</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${rateErrs[sel.skill_id] ? '#f87171' : '#ddd6fe'}`, borderRadius: 12, overflow: 'hidden', background: '#fff', flex: 1 }}>
                                <span style={{ padding: '0 10px', color: '#94a3b8', fontSize: 13 }}>₹</span>
                                <input
                                  type="number" min="1" value={sel.rate}
                                  onChange={e => {
                                    const v = parseInt(e.target.value)
                                    updateSkillField(sel.skill_id, 'rate', isNaN(v) ? '' : v)
                                  }}
                                  placeholder="0"
                                  style={{ flex: 1, padding: '10px 8px', border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: '#1e293b' }}
                                />
                              </div>
                              <select
                                value={sel.rate_type}
                                onChange={e => updateSkillField(sel.skill_id, 'rate_type', e.target.value)}
                                style={{ padding: '10px 8px', border: '1.5px solid #ddd6fe', borderRadius: 12, background: '#fff', fontSize: 13, color: '#374151', outline: 'none', cursor: 'pointer' }}
                              >
                                {RATE_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                              </select>
                            </div>
                            {rateErrs[sel.skill_id] && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {rateErrs[sel.skill_id]}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {apiErr && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>❌ {apiErr}</div>}

              <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                {loading ? '⏳ Saving...' : '🚀 Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
