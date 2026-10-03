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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_user_id_fkey"
            columns: ["parent_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      app_settings: {
        Row: {
          automation_threshold: number
          created_at: string
          document_retention_days: number | null
          email_notifications: boolean
          require_review: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_threshold?: number
          created_at?: string
          document_retention_days?: number | null
          email_notifications?: boolean
          require_review?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_threshold?: number
          created_at?: string
          document_retention_days?: number | null
          email_notifications?: boolean
          require_review?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
          user_id?: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      document_extractions: {
        Row: {
          completed_at: string | null
          confidence: number | null
          created_at: string
          document_id: string
          error_message: string | null
          extracted_data: Json
          id: string
          model: string | null
          provider: string
          raw_text: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["extraction_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          document_id: string
          error_message?: string | null
          extracted_data?: Json
          id?: string
          model?: string | null
          provider: string
          raw_text?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["extraction_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          document_id?: string
          error_message?: string | null
          extracted_data?: Json
          id?: string
          model?: string | null
          provider?: string
          raw_text?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["extraction_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_document_id_user_id_fkey"
            columns: ["document_id", "user_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      documents: {
        Row: {
          confidence: number | null
          counterparty_name: string | null
          counterparty_tax_id: string | null
          created_at: string
          currency: string | null
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          due_date: string | null
          id: string
          issue_date: string | null
          metadata: Json
          mime_type: string
          original_filename: string
          sha256: string | null
          size_bytes: number
          status: Database["public"]["Enums"]["document_status"]
          storage_path: string
          subtotal: number | null
          total_amount: number | null
          updated_at: string
          user_id: string
          vat_amount: number | null
        }
        Insert: {
          confidence?: number | null
          counterparty_name?: string | null
          counterparty_tax_id?: string | null
          created_at?: string
          currency?: string | null
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          due_date?: string | null
          id?: string
          issue_date?: string | null
          metadata?: Json
          mime_type: string
          original_filename: string
          sha256?: string | null
          size_bytes: number
          status?: Database["public"]["Enums"]["document_status"]
          storage_path: string
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          vat_amount?: number | null
        }
        Update: {
          confidence?: number | null
          counterparty_name?: string | null
          counterparty_tax_id?: string | null
          created_at?: string
          currency?: string | null
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          due_date?: string | null
          id?: string
          issue_date?: string | null
          metadata?: Json
          mime_type?: string
          original_filename?: string
          sha256?: string | null
          size_bytes?: number
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          vat_amount?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          counterparty_name: string
          counterparty_tax_id: string | null
          created_at: string
          currency: string
          direction: Database["public"]["Enums"]["invoice_direction"]
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          source_document_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string
          vat_amount: number
        }
        Insert: {
          counterparty_name: string
          counterparty_tax_id?: string | null
          created_at?: string
          currency?: string
          direction: Database["public"]["Enums"]["invoice_direction"]
          id?: string
          invoice_number: string
          issue_date: string
          notes?: string | null
          source_document_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number
        }
        Update: {
          counterparty_name?: string
          counterparty_tax_id?: string | null
          created_at?: string
          currency?: string
          direction?: Database["public"]["Enums"]["invoice_direction"]
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          source_document_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          line_number: number
          product_name: string
          quantity: number
          sku: string | null
          subtotal: number
          total_amount: number
          unit: string
          unit_price: number
          user_id: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          line_number: number
          product_name: string
          quantity: number
          sku?: string | null
          subtotal: number
          total_amount: number
          unit?: string
          unit_price: number
          user_id?: string
          vat_amount: number
          vat_rate?: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          line_number?: number
          product_name?: string
          quantity?: number
          sku?: string | null
          subtotal?: number
          total_amount?: number
          unit?: string
          unit_price?: number
          user_id?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: []
      }
      price_sheets: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          purchase_invoice_id: string
          sheet_date: string
          sheet_number: number
          status: Database["public"]["Enums"]["price_sheet_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          purchase_invoice_id: string
          sheet_date: string
          sheet_number?: number
          status?: Database["public"]["Enums"]["price_sheet_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          purchase_invoice_id?: string
          sheet_date?: string
          sheet_number?: number
          status?: Database["public"]["Enums"]["price_sheet_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      price_sheet_items: {
        Row: {
          additional_cost: number
          created_at: string
          id: string
          invoice_item_id: string
          line_number: number
          markup_percent: number
          price_sheet_id: string
          product_name: string
          purchase_price: number
          quantity: number
          sale_price: number
          sku: string | null
          unit: string
          user_id: string
          vat_rate: number
        }
        Insert: {
          additional_cost?: number
          created_at?: string
          id?: string
          invoice_item_id: string
          line_number: number
          markup_percent?: number
          price_sheet_id: string
          product_name: string
          purchase_price: number
          quantity: number
          sale_price: number
          sku?: string | null
          unit: string
          user_id?: string
          vat_rate?: number
        }
        Update: {
          additional_cost?: number
          created_at?: string
          id?: string
          invoice_item_id?: string
          line_number?: number
          markup_percent?: number
          price_sheet_id?: string
          product_name?: string
          purchase_price?: number
          quantity?: number
          sale_price?: number
          sku?: string | null
          unit?: string
          user_id?: string
          vat_rate?: number
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          approved_at: string | null
          created_at: string
          description: string
          entry_date: string
          entry_number: number
          id: string
          posted_at: string | null
          source_document_id: string | null
          status: Database["public"]["Enums"]["entry_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          description: string
          entry_date: string
          entry_number?: number
          id?: string
          posted_at?: string | null
          source_document_id?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          description?: string
          entry_date?: string
          entry_number?: number
          id?: string
          posted_at?: string | null
          source_document_id?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_source_document_id_user_id_fkey"
            columns: ["source_document_id", "user_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ledger_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          currency: string
          debit: number
          description: string | null
          entry_id: string
          exchange_rate: number
          id: string
          line_number: number
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          currency?: string
          debit?: number
          description?: string | null
          entry_id: string
          exchange_rate?: number
          id?: string
          line_number: number
          user_id?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          currency?: string
          debit?: number
          description?: string | null
          entry_id?: string
          exchange_rate?: number
          id?: string
          line_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_lines_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "ledger_lines_entry_id_user_id_fkey"
            columns: ["entry_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ledger_entries"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          base_currency: string
          company_name: string | null
          created_at: string
          display_name: string | null
          fiscal_year_start: number
          id: string
          idno: string | null
          locale: string
          updated_at: string
          vat_code: string | null
        }
        Insert: {
          base_currency?: string
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          fiscal_year_start?: number
          id: string
          idno?: string | null
          locale?: string
          updated_at?: string
          vat_code?: string | null
        }
        Update: {
          base_currency?: string
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          fiscal_year_start?: number
          id?: string
          idno?: string | null
          locale?: string
          updated_at?: string
          vat_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_invoice: {
        Args: {
          p_counterparty_name: string
          p_counterparty_tax_id: string
          p_currency: string
          p_direction: Database["public"]["Enums"]["invoice_direction"]
          p_invoice_number: string
          p_issue_date: string
          p_items: Json
        }
        Returns: string
      }
      create_journal_entry: {
        Args: {
          p_amount: number
          p_credit_account_id: string
          p_currency: string
          p_debit_account_id: string
          p_description: string
          p_entry_date: string
          p_source_document_id: string | null
        }
        Returns: string
      }
      create_price_sheet: {
        Args: {
          p_additional_cost: number
          p_markup_percent: number
          p_purchase_invoice_id: string
          p_sheet_date: string
        }
        Returns: string
      }
    }
    Enums: {
      account_type:
        | "asset"
        | "liability"
        | "equity"
        | "revenue"
        | "expense"
        | "off_balance"
      document_status:
        | "uploaded"
        | "processing"
        | "needs_review"
        | "ready"
        | "posted"
        | "failed"
        | "rejected"
      document_type:
        | "invoice"
        | "receipt"
        | "bank_statement"
        | "payment_order"
        | "contract"
        | "timesheet"
        | "payroll"
        | "fixed_asset"
        | "tax_document"
        | "trial_balance"
        | "other"
      entry_status: "draft" | "approved" | "posted" | "voided"
      extraction_status: "pending" | "processing" | "completed" | "failed"
      invoice_direction: "purchase" | "sale"
      invoice_status: "draft" | "confirmed" | "cancelled"
      price_sheet_status: "draft" | "approved" | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: [
        "asset",
        "liability",
        "equity",
        "revenue",
        "expense",
        "off_balance",
      ],
      document_status: [
        "uploaded",
        "processing",
        "needs_review",
        "ready",
        "posted",
        "failed",
        "rejected",
      ],
      document_type: [
        "invoice",
        "receipt",
        "bank_statement",
        "payment_order",
        "contract",
        "timesheet",
        "payroll",
        "fixed_asset",
        "tax_document",
        "trial_balance",
        "other",
      ],
      entry_status: ["draft", "approved", "posted", "voided"],
      extraction_status: ["pending", "processing", "completed", "failed"],
      invoice_direction: ["purchase", "sale"],
      invoice_status: ["draft", "confirmed", "cancelled"],
      price_sheet_status: ["draft", "approved", "cancelled"],
    },
  },
} as const

