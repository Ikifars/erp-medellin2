'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { logAudit } from '@/lib/audit'
import type { Category } from '@/types/database'

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  category_id: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  quantity: z.coerce.number().min(0, 'Quantidade deve ser positiva'),
  min_stock: z.coerce.number().min(0, 'Estoque mínimo deve ser positivo'),
  cost_price: z.coerce.number().min(0, 'Preço de custo deve ser positivo'),
  sale_price: z.coerce.number().min(0, 'Preço de venda deve ser positivo'),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  productId?: string
  initialData?: any
  onSuccess?: () => void
}

export function ProductForm({ productId, initialData, onSuccess }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!productId
  const [categories, setCategories] = useState<Category[]>([])

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category_id: '',
      description: '',
      quantity: 0,
      min_stock: 0,
      cost_price: 0,
      sale_price: 0,
    },
  })

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        category_id: initialData.category_id || '',
      })
    }
  }, [initialData, form])

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  async function onSubmit(data: ProductFormValues) {
    try {
      // 💡 Removido o cálculo manual da margem. 
      // Deixamos o PostgreSQL calcular a coluna gerada sozinho.
      const cleanData = {
        name: data.name,
        sku: data.sku,
        category_id: data.category_id || null,
        description: data.description || null,
        quantity: data.quantity,
        min_stock: data.min_stock,
        cost_price: data.cost_price,
        sale_price: data.sale_price,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(cleanData)
          .eq('id', productId)

        if (error) throw error

        await logAudit('update', 'products', productId, initialData, cleanData)
        toast.success('Produto atualizado com sucesso')
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([cleanData])
          .select()

        if (error) throw error

        await logAudit('create', 'products', newProduct?.[0]?.id, null, cleanData)
        toast.success('Produto criado com sucesso')
      }

      onSuccess?.()
      if (!onSuccess) {
        router.push('/inventory')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Erro ao salvar produto')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Produto *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do produto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU *</FormLabel>
                <FormControl>
                  <Input placeholder="SKU-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição do produto" rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade em Estoque *</FormLabel>
                <FormControl>
                  <Input placeholder="0" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="min_stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Mínimo *</FormLabel>
                <FormControl>
                  <Input placeholder="0" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="cost_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Custo *</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sale_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Venda *</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Produto'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
              }
