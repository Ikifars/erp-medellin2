'use client'

import { useEffect } from 'react'
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

const transactionSchema = z.object({
  type: z.enum(['entrada', 'saida', 'investimento']),
  category: z.enum([
    'vendas', 'recebimentos', 'fornecedores', 'salarios',
    'impostos', 'operacionais', 'marketing', 'infraestrutura', 'equipamentos'
  ]),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  transaction_date: z.string().min(1, 'Data é obrigatória'),
  due_date: z.string().optional().or(z.literal('')),
  status: z.enum(['pendente', 'pago', 'cancelado']),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  transactionId?: string
  initialData?: any
  onSuccess?: () => void
}

const categoryLabels = {
  vendas: 'Vendas',
  recebimentos: 'Recebimentos',
  fornecedores: 'Fornecedores',
  salarios: 'Salários',
  impostos: 'Impostos',
  operacionais: 'Operacionais',
  marketing: 'Marketing',
  infraestrutura: 'Infraestrutura',
  equipamentos: 'Equipamentos',
}

export function TransactionForm({ transactionId, initialData, onSuccess }: TransactionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!transactionId

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'entrada',
      category: 'vendas',
      description: '',
      amount: 0,
      transaction_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'pendente',
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    }
  }, [initialData, form])

  async function onSubmit(data: TransactionFormValues) {
    try {
      const cleanData = {
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        transaction_date: data.transaction_date,
        due_date: data.due_date || null,
        status: data.status,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('financial_transactions')
          .update(cleanData)
          .eq('id', transactionId)

        if (error) throw error

        await logAudit('update', 'financial_transactions', transactionId, initialData, cleanData)
        toast.success('Transação atualizada com sucesso')
      } else {
        const { data: newTrans, error } = await supabase
          .from('financial_transactions')
          .insert([cleanData])
          .select()

        if (error) throw error

        await logAudit('create', 'financial_transactions', newTrans?.[0]?.id, null, cleanData)
        toast.success('Transação criada com sucesso')
      }

      onSuccess?.()
      if (!onSuccess) {
        router.push('/financial')
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
      toast.error('Erro ao salvar transação')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Transação *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input placeholder="Descrição da transação" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor *</FormLabel>
              <FormControl>
                <Input placeholder="0.00" type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="transaction_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Transação *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Vencimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Transação'}
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
