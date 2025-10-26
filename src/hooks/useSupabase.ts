import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export function useSupabaseAuth() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      toast.error(error.message)
      return false
    }
    return true
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    if (error) {
      toast.error(error.message)
      return false
    }
    return true
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      return false
    }
    return true
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}

export function useSupabaseData<T>(
  table: string,
  options?: {
    select?: string
    filter?: any
    orderBy?: { column: string; ascending?: boolean }
    range?: { from: number; to: number }
  }
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      let query = supabase.from(table).select(options?.select || '*')

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        })
      }

      if (options?.range) {
        query = query.range(options.range.from, options.range.to)
      }

      const { data: result, error } = await query

      if (error) throw error

      setData(result || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [table, JSON.stringify(options)])

  const refetch = () => fetchData()

  return { data, loading, error, refetch }
}

export function useSupabaseMutation() {
  const [loading, setLoading] = useState(false)

  const insert = async (table: string, data: any) => {
    try {
      setLoading(true)
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single()

      if (error) throw error

      toast.success('Registro criado com sucesso!')
      return result
    } catch (err: any) {
      toast.error(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const update = async (table: string, id: string, data: any) => {
    try {
      setLoading(true)
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      toast.success('Registro atualizado com sucesso!')
      return result
    } catch (err: any) {
      toast.error(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const remove = async (table: string, id: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.from(table).delete().eq('id', id)

      if (error) throw error

      toast.success('Registro excluído com sucesso!')
      return true
    } catch (err: any) {
      toast.error(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { insert, update, remove, loading }
}