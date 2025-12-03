import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '~/lib/supabase'
import { ensureUserExists } from '~/lib/auth.helpers'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [role, setRole] = useState<'admin' | 'student' | 'instructor' | 'user' | null>(null)
    // const supabase = createClient() // Removed

    useEffect(() => {
        let mounted = true
        let requestCounter = 0

        async function getProfile(session: Session | null) {
            const requestId = ++requestCounter
            try {
                if (session?.user && session?.access_token) {
                    // Get user profile from our backend to know the role
                    console.log('Fetching profile for user:', session.user.email)
                    const profile = await ensureUserExists(
                        session.access_token,
                        session.user.email!,
                        session.user.user_metadata?.full_name
                    )
                    console.log('Fetched profile:', profile)
                    if (mounted && requestId === requestCounter) {
                        setRole(profile.role)
                    }
                } else if (mounted && requestId === requestCounter) {
                    setRole(null)
                }
            } catch (error) {
                console.error('Error fetching user profile:', error)
                if (mounted && requestId === requestCounter) {
                    setRole(null)
                }
            } finally {
                if (mounted && requestId === requestCounter) {
                    setLoading(false)
                }
            }
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                setSession(session)
                setUser(session?.user ?? null)
                if (session) {
                    getProfile(session)
                } else {
                    setLoading(false)
                }
            }
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session)
                setUser(session?.user ?? null)
                if (session) {
                    // Only fetch profile if we have a session and role is not set or session user changed
                    // For simplicity, we fetch on every auth change that has a session
                    getProfile(session)
                } else {
                    if (mounted) {
                        setRole(null)
                        setLoading(false)
                    }
                }
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { data, error }
    }

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })
        return { data, error }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        setRole(null)
        return { error }
    }

    const getAccessToken = async () => {
        const { data } = await supabase.auth.getSession()
        return data.session?.access_token
    }

    return {
        user,
        session,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        getAccessToken,
    }
}
