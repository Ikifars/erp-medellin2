'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { ProductForm } from '../../components/product-form'
import { toast } from 'sonner'
import type { Product } from '@/types/database'

export default function EditProductPage() {
  const params = useParams()
  const productId = params.id as string
  const supabase = createClient()

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProduct()
  }, [productId])

  async function loadProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .is('deleted_at', null)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (error) {
      console.error('Error loading product:', error)
      toast.error('Erro ao carregar produto')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Produto não encontrado</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        <Header title="Editar Produto" subtitle={`Editando: ${product.name}`} />

        <main className="flex-1 p-6">
          <div className="max-w-2xl">
            <Card className="glass-card p-6">
              <ProductForm productId={productId} initialData={product} />
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
