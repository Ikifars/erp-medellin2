export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: User['role']
          status: User['status']
          avatar_url: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: User['role']
          status?: User['status']
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: User['role']
          status?: User['status']
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          sku: string
          category_id: string | null
          description: string | null
          quantity: number
          min_stock: number
          cost_price: number
          sale_price: number
          margin: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          sku: string
          category_id?: string | null
          description?: string | null
          quantity?: number
          min_stock?: number
          cost_price?: number
          sale_price?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          sku?: string
          category_id?: string | null
          description?: string | null
          quantity?: number
          min_stock?: number
          cost_price?: number
          sale_price?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          type: 'entrada' | 'saida' | 'ajuste'
          quantity: number
          reason: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          type: 'entrada' | 'saida' | 'ajuste'
          quantity: number
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          type?: 'entrada' | 'saida' | 'ajuste'
          quantity?: number
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          document: string | null
          phone: string | null
          whatsapp: string | null
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          document?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          document?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          number: string
          customer_id: string | null
          status: Order['status']
          subtotal: number
          discount: number
          total: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          number?: string
          customer_id?: string | null
          status?: Order['status']
          subtotal?: number
          discount?: number
          total?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          number?: string
          customer_id?: string | null
          status?: Order['status']
          subtotal?: number
          discount?: number
          total?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          created_at?: string
        }
      }
      financial_transactions: {
        Row: {
          id: string
          type: 'entrada' | 'saida' | 'investimento'
          category: Transaction['category']
          description: string
          amount: number
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          due_date: string | null
          paid_at: string | null
          status: 'pendente' | 'pago' | 'cancelado'
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          type: 'entrada' | 'saida' | 'investimento'
          category: Transaction['category']
          description: string
          amount: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          due_date?: string | null
          paid_at?: string | null
          status?: 'pendente' | 'pago' | 'cancelado'
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          type?: 'entrada' | 'saida' | 'investimento'
          category?: Transaction['category']
          description?: string
          amount?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          due_date?: string | null
          paid_at?: string | null
          status?: 'pendente' | 'pago' | 'cancelado'
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      user_role: 'admin' | 'gerente' | 'operador' | 'visualizador'
      user_status: 'ativo' | 'inativo'
      order_status: 'recebido' | 'em_processamento' | 'faturado' | 'entregue' | 'cancelado'
    }
  }
}

export type User = {
  role: 'admin' | 'gerente' | 'operador' | 'visualizador'
  status: 'ativo' | 'inativo'
}

export type Order = {
  status: 'recebido' | 'em_processamento' | 'faturado' | 'entregue' | 'cancelado'
}

export type Transaction = {
  category: 'vendas' | 'recebimentos' | 'fornecedores' | 'salarios' | 'impostos' | 'operacionais' | 'marketing' | 'infraestrutura' | 'equipamentos'
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type StockMovement = Database['public']['Tables']['stock_movements']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type OrderType = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
