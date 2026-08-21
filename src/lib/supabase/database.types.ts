export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          name: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          type: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          name: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          user_id?: string
          vat_number?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      lead_actions: {
        Row: {
          action_date: string
          author_name: string | null
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          lead_id: string
          user_id: string
        }
        Insert: {
          action_date?: string
          author_name?: string | null
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          lead_id: string
          user_id?: string
        }
        Update: {
          action_date?: string
          author_name?: string | null
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_contacts: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_deleted: boolean
          landline: string | null
          lead_id: string
          name: string | null
          phone: string | null
          position: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean
          landline?: string | null
          lead_id: string
          name?: string | null
          phone?: string | null
          position?: string | null
          user_id?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean
          landline?: string | null
          lead_id?: string
          name?: string | null
          phone?: string | null
          position?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_origins: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          name: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          position?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      lead_statuses: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          name: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          position?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          campaign_platform: string | null
          campaign_we_are: string | null
          campaign_we_want: string | null
          contact_email: string | null
          contact_landline: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_position: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_deleted: boolean
          name: string
          next_step: string | null
          origin_id: string | null
          sort_order: number | null
          status_id: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          campaign_platform?: string | null
          campaign_we_are?: string | null
          campaign_we_want?: string | null
          contact_email?: string | null
          contact_landline?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_position?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          next_step?: string | null
          origin_id?: string | null
          sort_order?: number | null
          status_id?: string | null
          user_id?: string
          website?: string | null
        }
        Update: {
          campaign_platform?: string | null
          campaign_we_are?: string | null
          campaign_we_want?: string | null
          contact_email?: string | null
          contact_landline?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_position?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          next_step?: string | null
          origin_id?: string | null
          sort_order?: number | null
          status_id?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "lead_origins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "lead_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          can_access_crm: boolean
          can_access_finance: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_admin: boolean
        }
        Insert: {
          can_access_crm?: boolean
          can_access_finance?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          is_admin?: boolean
        }
        Update: {
          can_access_crm?: boolean
          can_access_finance?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean
        }
        Relationships: []
      }
      transaction_vat_lines: {
        Row: {
          created_at: string
          id: string
          net: number
          position: number
          transaction_id: string
          user_id: string
          vat_amount: number
          vat_rate_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          net: number
          position?: number
          transaction_id: string
          user_id?: string
          vat_amount?: number
          vat_rate_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          net?: number
          position?: number
          transaction_id?: string
          user_id?: string
          vat_amount?: number
          vat_rate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_vat_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_vat_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions_expanded"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_vat_lines_vat_rate_id_fkey"
            columns: ["vat_rate_id"]
            isOneToOne: false
            referencedRelation: "vat_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_withheld_lines: {
        Row: {
          created_at: string
          id: string
          net: number
          position: number
          transaction_id: string
          user_id: string
          withheld_amount: number
          withheld_rate_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          net: number
          position?: number
          transaction_id: string
          user_id?: string
          withheld_amount?: number
          withheld_rate_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          net?: number
          position?: number
          transaction_id?: string
          user_id?: string
          withheld_amount?: number
          withheld_rate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_withheld_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_withheld_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions_expanded"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_withheld_lines_withheld_rate_id_fkey"
            columns: ["withheld_rate_id"]
            isOneToOne: false
            referencedRelation: "withheld_tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          category_id: string | null
          created_at: string
          date: string
          deleted_at: string | null
          description: string
          entity_id: string | null
          id: string
          invoice_date: string
          invoice_month: number | null
          invoice_not_required: boolean
          is_deleted: boolean
          is_reconciled: boolean
          net: number
          to_wallet_id: string | null
          type: string
          user_id: string
          vat_amount: number
          vat_rate_id: string | null
          wallet_id: string
          withheld_amount: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          date: string
          deleted_at?: string | null
          description: string
          entity_id?: string | null
          id?: string
          invoice_date: string
          invoice_month?: number | null
          invoice_not_required?: boolean
          is_deleted?: boolean
          is_reconciled?: boolean
          net: number
          to_wallet_id?: string | null
          type: string
          user_id?: string
          vat_amount?: number
          vat_rate_id?: string | null
          wallet_id: string
          withheld_amount?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          date?: string
          deleted_at?: string | null
          description?: string
          entity_id?: string | null
          id?: string
          invoice_date?: string
          invoice_month?: number | null
          invoice_not_required?: boolean
          is_deleted?: boolean
          is_reconciled?: boolean
          net?: number
          to_wallet_id?: string | null
          type?: string
          user_id?: string
          vat_amount?: number
          vat_rate_id?: string | null
          wallet_id?: string
          withheld_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet_balances"
            referencedColumns: ["wallet_id"]
          },
          {
            foreignKeyName: "transactions_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vat_rate_id_fkey"
            columns: ["vat_rate_id"]
            isOneToOne: false
            referencedRelation: "vat_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet_balances"
            referencedColumns: ["wallet_id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      vat_rates: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          name: string
          rate: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          rate: number
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          rate?: number
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          name: string
          starting_balance: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          starting_balance?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          starting_balance?: number
          user_id?: string
        }
        Relationships: []
      }
      withheld_tax_rates: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          name: string
          rate: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          rate: number
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          rate?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      transactions_expanded: {
        Row: {
          category_id: string | null
          category_name: string | null
          created_at: string | null
          date: string | null
          description: string | null
          entity_id: string | null
          entity_name: string | null
          id: string | null
          invoice_date: string | null
          invoice_month: number | null
          invoice_not_required: boolean | null
          is_deleted: boolean | null
          is_reconciled: boolean | null
          net: number | null
          to_wallet_id: string | null
          to_wallet_name: string | null
          total: number | null
          type: string | null
          user_id: string | null
          vat_amount: number | null
          vat_rate: number | null
          vat_rate_id: string | null
          vat_rate_name: string | null
          wallet_id: string | null
          wallet_name: string | null
          withheld_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet_balances"
            referencedColumns: ["wallet_id"]
          },
          {
            foreignKeyName: "transactions_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vat_rate_id_fkey"
            columns: ["vat_rate_id"]
            isOneToOne: false
            referencedRelation: "vat_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet_balances"
            referencedColumns: ["wallet_id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_balances: {
        Row: {
          balance: number | null
          wallet_id: string | null
        }
        Insert: {
          balance?: never
          wallet_id?: string | null
        }
        Update: {
          balance?: never
          wallet_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
