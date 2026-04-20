import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const TOTAL_STEPS = 4

const STEP_META = [
  {
    title: 'Who Are You?',
    subtitle: 'Tell us a bit about yourself.',
  },
  {
    title: 'Upload Your Resume',
    subtitle: 'Optional — lets us personalize job fit scores for you.',
  },
  {
    title: 'Your Experience',
    subtitle: 'Help us understand your background.',
  },
  {
    title: 'What Are You Looking For?',
    subtitle: 'Pick the roles and sectors that interest you most.',
  },
]

const GRAD_YEARS = ['2025', '2026', '2027', '2028', '2029+']
const EXP_YEARS = ['0', '1–2', '3–5', '5+']
const EXP_LEVELS = ['Student', 'Entry Level', 'Mid Level', 'Senior']
const ROLE_TYPES = [
  'Strategy', 'Operations', 'Marketing', 'Sales',
  'Analytics', 'Media', 'Finance', 'Legal', 'Technology', 'Sponsorship',
]
const SECTORS = [
  { id: 'teams-franchises',         label: 'Teams & Franchises' },
  { id: 'media-broadcasting',       label: 'Media & Broadcasting' },
  { id: 'sponsorship-endorsements', label: 'Sponsorship & Endorsements' },
  { id: 'sports-tech-analytics',    label: 'Sports Tech & Analytics' },
  { id: 'facilities-infrastructure',label: 'Facilities & Infrastructure' },
  { id: 'apparel-equipment',        label: 'Apparel & Equipment' },
  { id: 'betting-gaming',           label: 'Betting & Gaming' },
  { id: 'ticketing-fan-experience', label: 'Ticketing & Fan Experience' },
  { id: 'athlete-agencies',         label: 'Athlete Agencies' },
  { id: 'health-wellness',          label: 'Health & Wellness' },
  { id: 'leagues',                  label: 'Leagues & Competitions' },
  { id: 'athlete-ventures',         label: 'Athlete Ventures' },
  { id: 'youth-sports',             label: 'Youth & Emerging Sports' },
]

// ── Shared primitives ─────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <p className="text-muted text-xs uppercase tracking-widest mb-3">
      {children}
    </p>
  )
}

function Input({ error, ...props }) {
  return (
    <div>
      <input
        className={`w-full bg-surface border ${error ? 'border-red-500' : 'border-border'} text-subtle rounded px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  )
}

function Select({ children, ...props }) {
  return (
    <div className="relative">
      <select
        className="w-full appearance-none bg-surface border border-border text-subtle rounded px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors cursor-pointer"
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted text-xs">
        ▾
      </span>
    </div>
  )
}

function Pill({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-sm border transition-colors select-none cursor-pointer ${
        selected
          ? 'border-accent text-accent bg-accent/10'
          : 'border-border text-muted hover:border-subtle hover:text-subtle'
      }`}
    >
      {children}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [resumeStatus, setResumeStatus] = useState('idle') // idle | parsing | done | error
  const [resumeFileName, setResumeFileName] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    school: '',
    gradYear: '',
    jobTitle: '',
    company: '',
    yearsExperience: '',
    experienceLevel: '',
    targetRoles: [],
    targetSectors: [],
    resume: null,
  })

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggle = (field, value) =>
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))

  const validate = () => {
    if (step !== 1) return true
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (!validate()) return
    setErrors({})
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
    } else {
      save()
    }
  }

  const back = () => {
    setErrors({})
    setStep(s => s - 1)
  }

  const save = () => {
    localStorage.setItem(
      'sl_user_profile',
      JSON.stringify({ ...form, completedAt: new Date().toISOString() })
    )
    navigate('/dashboard')
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setResumeStatus('error')
      return
    }
    setResumeFileName(file.name)
    setResumeStatus('parsing')

    const reader = new FileReader()
    reader.onload = async () => {
      const base64data = reader.result.split(',')[1]
      try {
        const res = await fetch('/api/parseresume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64data, fileName: file.name, fileType: file.type }),
        })
        if (!res.ok) throw new Error()
        const parsed = await res.json()
        setForm(prev => ({
          ...prev,
          resume: parsed,
          jobTitle: parsed.current_role || prev.jobTitle,
          company: parsed.experience?.[0]?.company || prev.company,
        }))
        setResumeStatus('done')
      } catch {
        setResumeStatus('error')
      }
    }
    reader.readAsDataURL(file)
  }

  const resetResume = () => {
    setResumeStatus('idle')
    setResumeFileName('')
    set('resume', null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const progressPct = (step / TOTAL_STEPS) * 100
  const { title, subtitle } = STEP_META[step - 1]
  const isParsing = resumeStatus === 'parsing'

  return (
    <div className="field-bg min-h-screen flex flex-col">

      {/* Progress bar */}
      <div className="h-px bg-border w-full">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="pt-10 text-center">
        <span className="text-muted text-xs tracking-widest uppercase">
          Step {step} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">

          {/* Heading */}
          <h1 className="font-display text-5xl tracking-wider text-secondary mb-1">
            {title}
          </h1>
          <p className="text-muted text-sm mb-10">{subtitle}</p>

          {/* ── Step 1: Identity ── */}
          {step === 1 && (
            <div className="space-y-4">
              <Input
                placeholder="Full Name"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                error={errors.name}
              />
              <Input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                error={errors.email}
              />
              <Input
                placeholder="University / School"
                value={form.school}
                onChange={e => set('school', e.target.value)}
              />
              <Select
                value={form.gradYear}
                onChange={e => set('gradYear', e.target.value)}
              >
                <option value="" disabled>Graduation Year</option>
                {GRAD_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
          )}

          {/* ── Step 2: Resume upload ── */}
          {step === 2 && (
            <div className="space-y-4">

              {(resumeStatus === 'idle' || resumeStatus === 'error') && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-3 hover:border-accent hover:bg-accent/5 transition-colors group"
                  >
                    <svg
                      className="text-muted group-hover:text-accent transition-colors"
                      width="32" height="32" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.5"
                    >
                      <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 20h16" strokeLinecap="round" />
                    </svg>
                    <div className="text-center">
                      <p className="text-subtle text-sm">Click to upload your resume</p>
                      <p className="text-muted text-xs mt-1">PDF only</p>
                    </div>
                  </button>
                  {resumeStatus === 'error' && (
                    <p className="text-red-400 text-xs text-center">
                      Could not parse that file. Please upload a PDF.
                    </p>
                  )}
                </>
              )}

              {resumeStatus === 'parsing' && (
                <div className="w-full border border-border rounded-lg p-12 flex flex-col items-center gap-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-subtle text-sm">Parsing {resumeFileName}…</p>
                </div>
              )}

              {resumeStatus === 'done' && form.resume && (
                <div className="border border-accent/30 bg-accent/5 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-accent text-sm">✓</span>
                    <span className="text-accent text-sm font-medium">Resume parsed</span>
                  </div>
                  {form.resume.name && (
                    <div>
                      <p className="text-subtle text-sm font-medium">{form.resume.name}</p>
                      {form.resume.current_role && (
                        <p className="text-muted text-xs mt-0.5">{form.resume.current_role}</p>
                      )}
                    </div>
                  )}
                  {form.resume.skills?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {form.resume.skills.slice(0, 6).map(skill => (
                        <span
                          key={skill}
                          className="text-xs border border-border text-muted rounded px-2 py-0.5"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={resetResume}
                    className="text-xs text-muted hover:text-subtle underline underline-offset-2 transition-colors"
                  >
                    Replace
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          )}

          {/* ── Step 3: Experience ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Input
                  placeholder="Job Title"
                  value={form.jobTitle}
                  onChange={e => set('jobTitle', e.target.value)}
                />
                <Input
                  placeholder="Company"
                  value={form.company}
                  onChange={e => set('company', e.target.value)}
                />
              </div>
              <div>
                <Label>Years of Experience in Sports</Label>
                <div className="flex gap-2 flex-wrap">
                  {EXP_YEARS.map(y => (
                    <Pill
                      key={y}
                      selected={form.yearsExperience === y}
                      onClick={() => set('yearsExperience', y)}
                    >
                      {y}
                    </Pill>
                  ))}
                </div>
              </div>
              <div>
                <Label>Experience Level</Label>
                <div className="flex gap-2 flex-wrap">
                  {EXP_LEVELS.map(l => (
                    <Pill
                      key={l}
                      selected={form.experienceLevel === l}
                      onClick={() => set('experienceLevel', l)}
                    >
                      {l}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Interests ── */}
          {step === 4 && (
            <div className="space-y-10">
              <div>
                <Label>Target Role Types</Label>
                <div className="flex gap-2 flex-wrap">
                  {ROLE_TYPES.map(r => (
                    <Pill
                      key={r}
                      selected={form.targetRoles.includes(r)}
                      onClick={() => toggle('targetRoles', r)}
                    >
                      {r}
                    </Pill>
                  ))}
                </div>
              </div>
              <div>
                <Label>Target Sectors</Label>
                <div className="flex gap-2 flex-wrap">
                  {SECTORS.map(s => (
                    <Pill
                      key={s.id}
                      selected={form.targetSectors.includes(s.id)}
                      onClick={() => toggle('targetSectors', s.id)}
                    >
                      {s.label}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                className="px-5 py-2.5 rounded text-sm border border-border text-subtle hover:border-subtle transition-colors"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-4">
              {step === 2 && resumeStatus !== 'done' && (
                <button
                  type="button"
                  onClick={next}
                  className="text-sm text-muted hover:text-subtle transition-colors"
                >
                  Skip for now
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={isParsing}
                className="px-6 py-2.5 rounded text-sm font-semibold bg-accent text-black hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === TOTAL_STEPS ? 'Finish →' : 'Next →'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
