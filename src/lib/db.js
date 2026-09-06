import { supabase, currentUserId } from './supabase'

// Every read returns plain application shapes so pages never handle column
// names. Every write throws on failure so callers can surface a real error
// instead of silently pretending the record was saved.

// ── Alumni ───────────────────────────────────────────────────────────────────

function toAlumnus(row) {
  return {
    id: row.id,
    name: row.full_name,
    classYear: row.hbs_class_year ? String(row.hbs_class_year) : '',
    company: row.company,
    title: row.title,
    linkedinUrl: row.linkedin_url,
    verifiedAt: row.verified_at,
  }
}

export async function loadAlumniDirectory() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('alumni')
    .select('id, full_name, hbs_class_year, company, title, linkedin_url, verified_at')
    .eq('is_current_role', true)
    .order('company')
    .order('full_name')
  if (error) throw error
  return data.map(toAlumnus)
}

export async function countAlumni() {
  if (!supabase) return 0
  const { count, error } = await supabase
    .from('alumni')
    .select('id', { count: 'exact', head: true })
    .eq('is_current_role', true)
  if (error) throw error
  return count ?? 0
}

export async function submitAlumniCandidate(candidate) {
  if (!supabase) return { preview: true }
  const userId = await currentUserId()
  if (!userId) throw new Error('Sign in before submitting an alum.')
  const { error } = await supabase.from('alumni_submissions').insert({
    full_name: candidate.fullName,
    hbs_class_year: candidate.classYear || null,
    company: candidate.company,
    title: candidate.title,
    linkedin_url: candidate.linkedinUrl,
    notes: candidate.notes || '',
    submitted_by: userId,
  })
  if (error) throw error
  return { preview: false }
}

// ── Member profile ───────────────────────────────────────────────────────────

function toProfile(row) {
  if (!row) return null
  return {
    name: row.full_name,
    classYear: row.hbs_class,
    careerStage: row.career_stage || '',
    functions: row.target_functions || [],
    sectors: row.target_sectors || [],
    locations: row.target_locations || [],
    onboardingComplete: Boolean(row.full_name && row.hbs_class),
    updatedAt: row.updated_at,
  }
}

export async function loadMemberProfile() {
  if (!supabase) return null
  const userId = await currentUserId()
  if (!userId) return null
  const { data, error } = await supabase
    .from('member_profiles')
    .select('full_name, hbs_class, career_stage, target_functions, target_sectors, target_locations, updated_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return toProfile(data)
}

export async function saveMemberProfile(profile, email) {
  if (!supabase) return null
  const userId = await currentUserId()
  if (!userId) throw new Error('Sign in before saving your profile.')
  const { data, error } = await supabase
    .from('member_profiles')
    .upsert({
      id: userId,
      email,
      full_name: profile.name,
      hbs_class: profile.classYear,
      career_stage: profile.careerStage || null,
      target_functions: profile.functions || [],
      target_sectors: profile.sectors || [],
      target_locations: profile.locations || [],
      updated_at: new Date().toISOString(),
    })
    .select('full_name, hbs_class, career_stage, target_functions, target_sectors, target_locations, updated_at')
    .single()
  if (error) throw error
  return toProfile(data)
}

// ── Opportunities ────────────────────────────────────────────────────────────

const OPPORTUNITY_COLUMNS =
  'id, company, title, location, work_mode, opportunity_type, job_function, sector, description, mba_signal, source_name, source_url, application_deadline, verified_on, status, featured, created_at'

export function toOpportunity(row) {
  return {
    id: row.id,
    company: row.company,
    title: row.title,
    location: row.location || '',
    workMode: row.work_mode || '',
    type: row.opportunity_type,
    function: row.job_function,
    sector: row.sector,
    deadline: row.application_deadline || '',
    verifiedOn: row.verified_on || '',
    source: row.source_name,
    sourceUrl: row.source_url,
    status: row.status,
    featured: Boolean(row.featured),
    description: row.description || '',
    mbaSignal: row.mba_signal,
  }
}

export async function loadOpportunities() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('opportunities')
    .select(OPPORTUNITY_COLUMNS)
    .eq('status', 'approved')
    .order('verified_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(toOpportunity)
}

export async function submitOpportunity(draft) {
  if (!supabase) return { preview: true }
  const userId = await currentUserId()
  if (!userId) throw new Error('Sign in before submitting a role.')
  const { error } = await supabase.from('opportunities').insert({
    company: draft.company,
    title: draft.title,
    opportunity_type: draft.type,
    job_function: draft.function,
    sector: draft.sector,
    mba_signal: draft.mbaSignal,
    source_name: 'Member submission',
    source_url: draft.sourceUrl,
    status: 'draft',
    submitted_by: userId,
  })
  if (error) throw error
  return { preview: false }
}

// ── Tracker ──────────────────────────────────────────────────────────────────

export async function loadTracker() {
  if (!supabase) return null
  const userId = await currentUserId()
  if (!userId) return []
  const { data, error } = await supabase
    .from('saved_opportunities')
    .select(`stage, notes, saved_at, opportunity:opportunities(${OPPORTUNITY_COLUMNS})`)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
  if (error) throw error
  return data
    .filter(row => row.opportunity)
    .map(row => ({ ...toOpportunity(row.opportunity), stage: row.stage, notes: row.notes || '', savedAt: row.saved_at }))
}

export async function saveTrackedOpportunity(opportunityId) {
  if (!supabase) return
  const userId = await currentUserId()
  if (!userId) throw new Error('Sign in before saving a role.')
  const { error } = await supabase
    .from('saved_opportunities')
    .upsert({ user_id: userId, opportunity_id: opportunityId }, { onConflict: 'user_id,opportunity_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function updateTrackedOpportunity(opportunityId, patch) {
  if (!supabase) return
  const userId = await currentUserId()
  if (!userId) throw new Error('Sign in before updating your tracker.')
  const { error } = await supabase
    .from('saved_opportunities')
    .update(patch)
    .eq('user_id', userId)
    .eq('opportunity_id', opportunityId)
  if (error) throw error
}

export async function removeTrackedOpportunity(opportunityId) {
  if (!supabase) return
  const userId = await currentUserId()
  if (!userId) throw new Error('Sign in before updating your tracker.')
  const { error } = await supabase
    .from('saved_opportunities')
    .delete()
    .eq('user_id', userId)
    .eq('opportunity_id', opportunityId)
  if (error) throw error
}

// ── Officer desk ─────────────────────────────────────────────────────────────

export async function loadOfficerQueue() {
  if (!supabase) return { alumni: [], opportunities: [], publishedCount: 0 }
  const [alumniResult, opportunityResult, publishedResult] = await Promise.all([
    supabase
      .from('alumni_submissions')
      .select('id, full_name, hbs_class_year, company, title, linkedin_url, notes, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('opportunities')
      .select(OPPORTUNITY_COLUMNS)
      .eq('status', 'draft')
      .order('created_at', { ascending: false }),
    supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ])
  if (alumniResult.error) throw alumniResult.error
  if (opportunityResult.error) throw opportunityResult.error
  if (publishedResult.error) throw publishedResult.error
  return {
    alumni: alumniResult.data.map(row => ({
      id: row.id,
      name: row.full_name,
      classYear: row.hbs_class_year ? String(row.hbs_class_year) : '',
      company: row.company,
      title: row.title,
      linkedinUrl: row.linkedin_url,
      notes: row.notes || '',
      submittedAt: row.created_at,
    })),
    opportunities: opportunityResult.data.map(toOpportunity),
    publishedCount: publishedResult.count ?? 0,
  }
}

export async function approveAlumniSubmission(submission) {
  if (!supabase) return
  const userId = await currentUserId()
  // Publish first. If the insert fails the submission stays pending, which is
  // the safe direction: a duplicate review costs less than a lost record.
  const { error: insertError } = await supabase.from('alumni').insert({
    full_name: submission.name,
    hbs_class_year: submission.classYear ? Number(submission.classYear) : null,
    company: submission.company,
    title: submission.title,
    linkedin_url: submission.linkedinUrl,
    is_current_role: true,
    verified_at: new Date().toISOString(),
  })
  if (insertError) throw insertError
  const { error } = await supabase
    .from('alumni_submissions')
    .update({ status: 'approved', reviewed_by: userId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', submission.id)
  if (error) throw error
}

export async function rejectAlumniSubmission(submissionId) {
  if (!supabase) return
  const userId = await currentUserId()
  const { error } = await supabase
    .from('alumni_submissions')
    .update({ status: 'rejected', reviewed_by: userId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', submissionId)
  if (error) throw error
}

export async function setOpportunityStatus(opportunityId, status) {
  if (!supabase) return
  const { error } = await supabase
    .from('opportunities')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', opportunityId)
  if (error) throw error
}
