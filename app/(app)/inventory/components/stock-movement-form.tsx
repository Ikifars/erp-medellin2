'use client'

import { useEffect, useState } from 'react'
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
import { useAuth } from '@/hooks/use-auth'

const movementSchema = z.object({
  type: z.enum(['entrada', 'saida', 'ajuste'], {
    errorMap: () => ({ message: 'Tipo de movimento é obrigatório' }),
  }),
  quantity: z.coerce.number().min(1, 'Quantidade deve ser maior que zero'),
  reason: z.string().optional().or(z.literal('')),
})

type MovementFormValues = z.infer<typeof movementSchema>

interface StockMovementFormProps {
  productId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function StockMovementForm({ productId, onSuccess, onCancel }: StockMovementFormProps) {
  const supabase = createClient()
  const { profile } = useAuth()

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'entrada',
      quantity: 0,
      reason: '',
    },
  })

  async function onSubmit(data: MovementFormValues) {
    try {
      // Get current product quantity
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single()

      if (productError) throw productError

      const currentQty = product?.quantity || 0
      let newQty = currentQty

      if (data.type === 'entrada') {
        newQty = currentQty + data.quantity
      } else if (data.type === 'saida') {
        newQty = currentQty - data.quantity
        if (newQty < 0) {
          toast.error('Quantidade insuficiente em estoque')
          return
        }
      } else if (data.type === 'ajuste') {
        newQty = data.quantity
      }

      // Create movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason || null,
          created_by: profile?.id || null,
        })

      if (movementError) throw movementError

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: newQty })
        .eq('id', productId)

      if (updateError) throw updateError

      await logAudit('create', 'stock_movements', null, null, {
        product_id: productId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
      })

      toast.success('Movimento de estoque registrado com sucesso')
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating movement:', error)
      toast.error('Erro ao registrar movimento')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Movimento</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="entrada">Entrada de Estoque</SelectItem>
                  <SelectItem value="saida">Saída de Estoque</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl>
                <Input placeholder="0" type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo</FormLabel>
              <FormControl>
                <Textarea placeholder="Motivo do movimento" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Registrando...' : 'Registrar Movimento'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
