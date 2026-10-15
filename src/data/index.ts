import type { Store } from '../types'
import { createLocalStore } from './localStore'
import { createSupabaseStore } from './supabaseStore'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const store: Store = url && key ? createSupabaseStore(url, key) : createLocalStore()
