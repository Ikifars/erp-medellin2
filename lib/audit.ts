import { createClient } from '@/lib/supabase/client'

export async function logAudit(
  action: string,
  entity: string,
  entityId: string | null = null,
  oldValues: any = null,
  newValues: any = null
) {
  try {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      entity,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error logging audit:', error)
  }
}
