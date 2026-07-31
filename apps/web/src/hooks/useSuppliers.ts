import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '../lib/api'
import { useAuth } from '@clerk/clerk-react'

export interface Supplier {
  id: string
  nombre: string
  contacto?: string | null
  telefono?: string | null
  email?: string | null
  createdAt?: string
}

export function useSuppliers() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  // 1. Obtener la lista de proveedores
  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await fetchWithAuth(getToken, '/api/v1/suppliers')
      return (response?.data || []) as Supplier[]
    },
  })

  // 2. Crear un proveedor
  const createSupplierMutation = useMutation({
    mutationFn: async (data: Omit<Supplier, 'id'>) => {
      const response = await fetchWithAuth(getToken, '/api/v1/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })

  // 3. Editar un proveedor
  const updateSupplierMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<Supplier, 'id'>>
    }) => {
      const response = await fetchWithAuth(
        getToken,
        `/api/v1/suppliers/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })

  // 4. Eliminar un proveedor
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(
        getToken,
        `/api/v1/suppliers/${id}`,
        {
          method: 'DELETE',
        }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })

  return {
    suppliers: suppliersQuery.data ?? [],
    isLoading: suppliersQuery.isLoading,
    isError: suppliersQuery.isError,
    createSupplier: createSupplierMutation.mutateAsync,
    updateSupplier: updateSupplierMutation.mutateAsync,
    deleteSupplier: deleteSupplierMutation.mutateAsync,
  }
}
