// Example: How to fetch batches from your Hono backend
import { useState, useEffect } from 'react'
import { api } from '~/lib/api.client'
import { useAuth } from '~/hooks/useAuth'

interface Batch {
    id: string
    name: string
    start_date: string
    end_date: string
    status: 'active' | 'upcoming' | 'completed'
}

export function useBatches() {
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { getAccessToken } = useAuth()

    useEffect(() => {
        async function fetchBatches() {
            try {
                setLoading(true)
                const token = await getAccessToken()
                const data = await api.get<{ batches: Batch[] }>('/api/batches', token)
                setBatches(data.batches)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch batches')
            } finally {
                setLoading(false)
            }
        }

        fetchBatches()
    }, [])

    const createBatch = async (batchData: Omit<Batch, 'id'>) => {
        try {
            const token = await getAccessToken()
            const data = await api.post<{ batch: Batch }>('/api/batches', batchData, token)
            setBatches([...batches, data.batch])
            return { success: true, batch: data.batch }
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Failed to create batch'
            }
        }
    }

    const updateBatch = async (id: string, batchData: Partial<Batch>) => {
        try {
            const token = await getAccessToken()
            const data = await api.put<{ batch: Batch }>(`/api/batches/${id}`, batchData, token)
            setBatches(batches.map(b => b.id === id ? data.batch : b))
            return { success: true, batch: data.batch }
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Failed to update batch'
            }
        }
    }

    const deleteBatch = async (id: string) => {
        try {
            const token = await getAccessToken()
            await api.delete(`/api/batches/${id}`, token)
            setBatches(batches.filter(b => b.id !== id))
            return { success: true }
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Failed to delete batch'
            }
        }
    }

    return {
        batches,
        loading,
        error,
        createBatch,
        updateBatch,
        deleteBatch,
    }
}
