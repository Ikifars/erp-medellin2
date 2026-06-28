'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Button as AddButton } from '@/components/ui/button'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { logAudit } from '@/lib/audit'
import type { Customer, Product } from '@/types/database'

const orderSchema = z.object({
  customer_id: z.string().min(1, 'Cliente é obrigatório'),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(z.object({
    product_id: z.string().optional(),
    product_name: z.string().min(1, 'Nome do produto é obrigatório'),
    quantity: z.coerce.number().min(1, 'Quantidade deve ser maior que zero'),
    unit_price: z.coerce.number().min(0, 'Preço deve ser positivo'),
  })).min(1, 'Adicione pelo menos um item'),
  discount: z.coerce.number().min(0, 'Desconto não pode ser negativo'),
})

type OrderFormValues = z.infer<typeof orderSchema>

interface OrderFormProps {
  orderId?: string
  initialData?: any
  onSuccess?: () => void
}

export function OrderForm({ orderId, initialData, onSuccess }: OrderFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!orderId
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: '',
      notes: '',
      items: [{ product_id: '', product_name: '', quantity: 1, unit_price: 0 }],
      discount: 0,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (initialData) {
      form.reset({
        customer_id: initialData.customer_id || '',
        notes: initialData.notes || '',
        items: initialData.order_items || [{ product_id: '', product_name: '', quantity: 1, unit_price: 0 }],
        discount: initialData.discount || 0,
      })
    }
  }, [initialData, form])

  async function loadData() {
    try {
      const [customersRes, productsRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('products')
          .select('*')
          .is('deleted_at', null)
          .order('name'),
      ])

      if (customersRes.error) throw customersRes.error
      if (productsRes.error) throw productsRes.error

      setCustomers(customersRes.data || [])
      setProducts(productsRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  async function onSubmit(data: OrderFormValues) {
    try {
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      const total = Math.max(0, subtotal - data.discount)

      const orderData = {
        customer_id: data.customer_id,
        notes: data.notes || null,
        subtotal,
        discount: data.discount,
        total,
        status: 'recebido' as const,
      }

      let orderId_new = orderId

      if (isEditing) {
        const { error } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', orderId)

        if (error) throw error

        // Delete old items and create new ones
        await supabase
          .from('order_items')
          .delete()
          .eq('order_id', orderId)
      } else {
        const { data: newOrder, error } = await supabase
          .from('orders')
          .insert([{ ...orderData, number: `PED-${Date.now()}` }])
          .select()

        if (error) throw error
        orderId_new = newOrder?.[0]?.id
      }

      // Insert order items
      const itemsData = data.items.map(item => ({
        order_id: orderId_new,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsData)

      if (itemsError) throw itemsError

      await logAudit('create', 'orders', orderId_new, null, orderData)
      toast.success(isEditing ? 'Pedido atualizado com sucesso' : 'Pedido criado com sucesso')

      onSuccess?.()
      if (!onSuccess) {
        router.push('/orders')
      }
    } catch (error) {
      console.error('Error saving order:', error)
      toast.error('Erro ao salvar pedido')
    }
  }

  const watchItems = form.watch('items')
  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const discount = form.watch('discount')
  const total = Math.max(0, subtotal - discount)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Itens do Pedido *</h3>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <AddButton type="button" size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </AddButton>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Selecionar Produto</DialogTitle>
                  <DialogDescription>Clique em um produto para adicioná-lo ao pedido</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        append({
                          product_id: product.id,
                          product_name: product.name,
                          quantity: 1,
                          unit_price: product.sale_price,
                        })
                        setIsProductDialogOpen(false)
                      }}
                      className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                      <div className="text-sm text-primary font-medium">{formatCurrency(product.sale_price)}</div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <Card key={field.id} className="glass-card p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.product_name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Produto</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do produto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Quantidade</FormLabel>
                        <FormControl>
                          <Input placeholder="0" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unit_price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Preço Unit.</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-8">
                    <div className="text-sm font-medium">
                      {formatCurrency((watchItems[index]?.quantity || 0) * (watchItems[index]?.unit_price || 0))}
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {form.formState.errors.items && (
            <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
          )}
        </div>

        {/* Summary */}
        <Card className="glass-card p-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-xs">Desconto:</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" type="number" step="0.01" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="border-t border-border/50 pt-2 flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </Card>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Notas sobre o pedido" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Pedido' : 'Criar Pedido'}
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
