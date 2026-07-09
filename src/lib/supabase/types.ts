// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      anamnesis_responses: {
        Row: {
          created_at: string
          id: string
          question_key: string
          question_label: string | null
          response_value: Json
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_key: string
          question_label?: string | null
          response_value?: Json
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          question_key?: string
          question_label?: string | null
          response_value?: Json
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'anamnesis_responses_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'anamnesis_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      anamnesis_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          guest_token: string | null
          id: string
          profile_id: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          guest_token?: string | null
          id?: string
          profile_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          guest_token?: string | null
          id?: string
          profile_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'anamnesis_sessions_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      beta_feedback: {
        Row: {
          child_experience: string | null
          created_at: string
          id: string
          parent_comments: string | null
          rating: number
          session_id: string | null
          user_id: string
        }
        Insert: {
          child_experience?: string | null
          created_at?: string
          id?: string
          parent_comments?: string | null
          rating: number
          session_id?: string | null
          user_id: string
        }
        Update: {
          child_experience?: string | null
          created_at?: string
          id?: string
          parent_comments?: string | null
          rating?: number
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'beta_feedback_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'focus_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      calibration_logs: {
        Row: {
          created_at: string
          device_id: string | null
          device_model: string | null
          duration_ms: number | null
          id: string
          mae: number | null
          metadata: Json | null
          platform: string | null
          rmse: number | null
          samples: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          device_model?: string | null
          duration_ms?: number | null
          id?: string
          mae?: number | null
          metadata?: Json | null
          platform?: string | null
          rmse?: number | null
          samples?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          device_model?: string | null
          duration_ms?: number | null
          id?: string
          mae?: number | null
          metadata?: Json | null
          platform?: string | null
          rmse?: number | null
          samples?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'calibration_logs_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'focus_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      checkout_sessions: {
        Row: {
          channel: string | null
          check_in_date: string
          check_out_date: string
          created_at: string
          guest_data: Json
          id: string
          spa_services: Json | null
          status: string
          suite_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          channel?: string | null
          check_in_date: string
          check_out_date: string
          created_at?: string
          guest_data: Json
          id?: string
          spa_services?: Json | null
          status?: string
          suite_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          channel?: string | null
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          guest_data?: Json
          id?: string
          spa_services?: Json | null
          status?: string
          suite_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'checkout_sessions_suite_id_fkey'
            columns: ['suite_id']
            isOneToOne: false
            referencedRelation: 'suites'
            referencedColumns: ['id']
          },
        ]
      }
      clinical_feedback: {
        Row: {
          admin_edited_interpretation: string | null
          asrs18_score: number | null
          assq_score: number | null
          cognitive_vrc: number | null
          comments: string | null
          created_at: string
          doctor_id: string | null
          gad7_score: number | null
          hama_score: number | null
          hamd_score: number | null
          id: string
          is_accurate: boolean | null
          meem_score: number | null
          moca_score: number | null
          phq9_score: number | null
          session_id: string | null
          snap_iv_score: number | null
          system_suggestion: string | null
        }
        Insert: {
          admin_edited_interpretation?: string | null
          asrs18_score?: number | null
          assq_score?: number | null
          cognitive_vrc?: number | null
          comments?: string | null
          created_at?: string
          doctor_id?: string | null
          gad7_score?: number | null
          hama_score?: number | null
          hamd_score?: number | null
          id?: string
          is_accurate?: boolean | null
          meem_score?: number | null
          moca_score?: number | null
          phq9_score?: number | null
          session_id?: string | null
          snap_iv_score?: number | null
          system_suggestion?: string | null
        }
        Update: {
          admin_edited_interpretation?: string | null
          asrs18_score?: number | null
          assq_score?: number | null
          cognitive_vrc?: number | null
          comments?: string | null
          created_at?: string
          doctor_id?: string | null
          gad7_score?: number | null
          hama_score?: number | null
          hamd_score?: number | null
          id?: string
          is_accurate?: boolean | null
          meem_score?: number | null
          moca_score?: number | null
          phq9_score?: number | null
          session_id?: string | null
          snap_iv_score?: number | null
          system_suggestion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'clinical_feedback_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'anamnesis_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      clinical_references: {
        Row: {
          category: string
          code: string | null
          content: string
          created_at: string
          id: string
          keywords: string[] | null
          metadata: Json | null
          section: string
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          code?: string | null
          content: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          metadata?: Json | null
          section: string
          source: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string | null
          content?: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          metadata?: Json | null
          section?: string
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      disponibilidade: {
        Row: {
          bloqueado: boolean
          created_at: string
          data: string
          disponivel: boolean
          id: string
          motivo_bloqueio: string | null
          suite_id: string | null
          tarifa_ajustada: number
          updated_at: string
        }
        Insert: {
          bloqueado?: boolean
          created_at?: string
          data: string
          disponivel?: boolean
          id?: string
          motivo_bloqueio?: string | null
          suite_id?: string | null
          tarifa_ajustada?: number
          updated_at?: string
        }
        Update: {
          bloqueado?: boolean
          created_at?: string
          data?: string
          disponivel?: boolean
          id?: string
          motivo_bloqueio?: string | null
          suite_id?: string | null
          tarifa_ajustada?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'disponibilidade_suite_id_fkey'
            columns: ['suite_id']
            isOneToOne: false
            referencedRelation: 'suites'
            referencedColumns: ['id']
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          reservation_id: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          reservation_id?: string | null
          status: string
          subject: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          reservation_id?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: 'email_logs_reservation_id_fkey'
            columns: ['reservation_id']
            isOneToOne: false
            referencedRelation: 'reservations'
            referencedColumns: ['id']
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      focus_biofeedback_logs: {
        Row: {
          bpm: number | null
          id: string
          session_id: string | null
          timestamp: string
          vrc: number | null
        }
        Insert: {
          bpm?: number | null
          id?: string
          session_id?: string | null
          timestamp?: string
          vrc?: number | null
        }
        Update: {
          bpm?: number | null
          id?: string
          session_id?: string | null
          timestamp?: string
          vrc?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'focus_biofeedback_logs_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'focus_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      focus_sessions: {
        Row: {
          capture_method: string | null
          completed_at: string | null
          crystals_earned: number | null
          id: string
          master_crystals: number | null
          settings: Json | null
          started_at: string
          status: string | null
          user_id: string | null
          vrc: number | null
        }
        Insert: {
          capture_method?: string | null
          completed_at?: string | null
          crystals_earned?: number | null
          id?: string
          master_crystals?: number | null
          settings?: Json | null
          started_at?: string
          status?: string | null
          user_id?: string | null
          vrc?: number | null
        }
        Update: {
          capture_method?: string | null
          completed_at?: string | null
          crystals_earned?: number | null
          id?: string
          master_crystals?: number | null
          settings?: Json | null
          started_at?: string
          status?: string | null
          user_id?: string | null
          vrc?: number | null
        }
        Relationships: []
      }
      guests: {
        Row: {
          birth_date: string | null
          created_at: string
          document: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          marketing_consent: boolean | null
          phone: string | null
          preferences: string | null
          preferred_suite_id: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          marketing_consent?: boolean | null
          phone?: string | null
          preferences?: string | null
          preferred_suite_id?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          marketing_consent?: boolean | null
          phone?: string | null
          preferences?: string | null
          preferred_suite_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'guests_preferred_suite_id_fkey'
            columns: ['preferred_suite_id']
            isOneToOne: false
            referencedRelation: 'suites'
            referencedColumns: ['id']
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          id: string
          min_quantity: number
          name: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          min_quantity?: number
          name: string
          quantity?: number
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          min_quantity?: number
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      ota_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ota_sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          ota_name: string
          payload: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          ota_name: string
          payload?: Json | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          ota_name?: string
          payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      pacotes: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          image_url: string | null
          itens: Json
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          image_url?: string | null
          itens?: Json
          nome: string
          preco?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          image_url?: string | null
          itens?: Json
          nome?: string
          preco?: number
          updated_at?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          checkout_session_id: string | null
          data_atualizacao: string
          data_criacao: string
          id: string
          mercado_pago_id: number | null
          metodo_pagamento: string | null
          preference_id: string | null
          reserva_id: string | null
          resposta_api: Json | null
          status: string
          valor_total: number
        }
        Insert: {
          checkout_session_id?: string | null
          data_atualizacao?: string
          data_criacao?: string
          id?: string
          mercado_pago_id?: number | null
          metodo_pagamento?: string | null
          preference_id?: string | null
          reserva_id?: string | null
          resposta_api?: Json | null
          status?: string
          valor_total?: number
        }
        Update: {
          checkout_session_id?: string | null
          data_atualizacao?: string
          data_criacao?: string
          id?: string
          mercado_pago_id?: number | null
          metodo_pagamento?: string | null
          preference_id?: string | null
          reserva_id?: string | null
          resposta_api?: Json | null
          status?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: 'pagamentos_checkout_session_id_fkey'
            columns: ['checkout_session_id']
            isOneToOne: false
            referencedRelation: 'checkout_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pagamentos_reserva_id_fkey'
            columns: ['reserva_id']
            isOneToOne: false
            referencedRelation: 'reservations'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          guest_id: string | null
          has_completed_onboarding: boolean
          id: string
          privacy_consent: boolean | null
          privacy_consent_accepted_at: string | null
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          guest_id?: string | null
          has_completed_onboarding?: boolean
          id: string
          privacy_consent?: boolean | null
          privacy_consent_accepted_at?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          guest_id?: string | null
          has_completed_onboarding?: boolean
          id?: string
          privacy_consent?: boolean | null
          privacy_consent_accepted_at?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_guest_id_fkey'
            columns: ['guest_id']
            isOneToOne: false
            referencedRelation: 'guests'
            referencedColumns: ['id']
          },
        ]
      }
      regras_reserva: {
        Row: {
          ativo: boolean
          created_at: string
          dias_semana: number[] | null
          id: string
          suite_id: string | null
          tipo_regra: string
          valor: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dias_semana?: number[] | null
          id?: string
          suite_id?: string | null
          tipo_regra: string
          valor?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dias_semana?: number[] | null
          id?: string
          suite_id?: string | null
          tipo_regra?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'regras_reserva_suite_id_fkey'
            columns: ['suite_id']
            isOneToOne: false
            referencedRelation: 'suites'
            referencedColumns: ['id']
          },
        ]
      }
      reservations: {
        Row: {
          channel: string
          check_in_date: string
          check_out_date: string
          commission_amount: number
          created_at: string
          external_reservation_id: string | null
          guest_id: string | null
          id: string
          notes: string | null
          paid_amount: number
          status: string
          suite_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          channel?: string
          check_in_date: string
          check_out_date: string
          commission_amount?: number
          created_at?: string
          external_reservation_id?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          status?: string
          suite_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          channel?: string
          check_in_date?: string
          check_out_date?: string
          commission_amount?: number
          created_at?: string
          external_reservation_id?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          status?: string
          suite_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reservations_guest_id_fkey'
            columns: ['guest_id']
            isOneToOne: false
            referencedRelation: 'guests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservations_suite_id_fkey'
            columns: ['suite_id']
            isOneToOne: false
            referencedRelation: 'suites'
            referencedColumns: ['id']
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean | null
          comment: string | null
          created_at: string
          guest_id: string | null
          guest_name: string | null
          id: string
          rating: number
          reservation_id: string | null
        }
        Insert: {
          approved?: boolean | null
          comment?: string | null
          created_at?: string
          guest_id?: string | null
          guest_name?: string | null
          id?: string
          rating: number
          reservation_id?: string | null
        }
        Update: {
          approved?: boolean | null
          comment?: string | null
          created_at?: string
          guest_id?: string | null
          guest_name?: string | null
          id?: string
          rating?: number
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_guest_id_fkey'
            columns: ['guest_id']
            isOneToOne: false
            referencedRelation: 'guests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_reservation_id_fkey'
            columns: ['reservation_id']
            isOneToOne: false
            referencedRelation: 'reservations'
            referencedColumns: ['id']
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string
          details: Json | null
          email: string | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          email?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          email?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      spa_appointments: {
        Row: {
          appointment_date: string
          created_at: string
          end_time: string
          guest_id: string | null
          id: string
          preferences: string | null
          service_id: string | null
          start_time: string
          status: string
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          end_time: string
          guest_id?: string | null
          id?: string
          preferences?: string | null
          service_id?: string | null
          start_time: string
          status?: string
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          end_time?: string
          guest_id?: string | null
          id?: string
          preferences?: string | null
          service_id?: string | null
          start_time?: string
          status?: string
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'spa_appointments_guest_id_fkey'
            columns: ['guest_id']
            isOneToOne: false
            referencedRelation: 'guests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'spa_appointments_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'spa_services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'spa_appointments_therapist_id_fkey'
            columns: ['therapist_id']
            isOneToOne: false
            referencedRelation: 'therapists'
            referencedColumns: ['id']
          },
        ]
      }
      spa_service_consumables: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          quantity_used: number
          service_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          quantity_used?: number
          service_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          quantity_used?: number
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'spa_service_consumables_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'inventory_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'spa_service_consumables_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'spa_services'
            referencedColumns: ['id']
          },
        ]
      }
      spa_services: {
        Row: {
          additional_images: string[] | null
          category: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          additional_images?: string[] | null
          category: string
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          additional_images?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      stress_test_logs: {
        Row: {
          actual_output: Json | null
          created_at: string
          expected_risk_level: string | null
          expected_suggestion: string | null
          id: string
          input_text: string | null
          is_success: boolean | null
          latency_ms: number | null
          rag_sources: Json | null
          scenario_name: string | null
          test_tag: string | null
        }
        Insert: {
          actual_output?: Json | null
          created_at?: string
          expected_risk_level?: string | null
          expected_suggestion?: string | null
          id?: string
          input_text?: string | null
          is_success?: boolean | null
          latency_ms?: number | null
          rag_sources?: Json | null
          scenario_name?: string | null
          test_tag?: string | null
        }
        Update: {
          actual_output?: Json | null
          created_at?: string
          expected_risk_level?: string | null
          expected_suggestion?: string | null
          id?: string
          input_text?: string | null
          is_success?: boolean | null
          latency_ms?: number | null
          rag_sources?: Json | null
          scenario_name?: string | null
          test_tag?: string | null
        }
        Relationships: []
      }
      suites: {
        Row: {
          amenidades: string[] | null
          andar: number | null
          ativo: boolean | null
          capacity: number
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          imagens_adicionais: string[] | null
          name: string
          price_per_night: number
          status: string
          updated_at: string
        }
        Insert: {
          amenidades?: string[] | null
          andar?: number | null
          ativo?: boolean | null
          capacity?: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          imagens_adicionais?: string[] | null
          name: string
          price_per_night?: number
          status?: string
          updated_at?: string
        }
        Update: {
          amenidades?: string[] | null
          andar?: number | null
          ativo?: boolean | null
          capacity?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          imagens_adicionais?: string[] | null
          name?: string
          price_per_night?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      system_updates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          payload: Json | null
          resolved_by: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          payload?: Json | null
          resolved_by?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          payload?: Json | null
          resolved_by?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      tarifas: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          motivo: string | null
          percentual_ajuste: number
          suite_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          motivo?: string | null
          percentual_ajuste?: number
          suite_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          motivo?: string | null
          percentual_ajuste?: number
          suite_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tarifas_suite_id_fkey'
            columns: ['suite_id']
            isOneToOne: false
            referencedRelation: 'suites'
            referencedColumns: ['id']
          },
        ]
      }
      therapists: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fee_amount: number
          gateway_transaction_id: string | null
          id: string
          installments: number
          payment_method: string
          reservation_id: string | null
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          fee_amount?: number
          gateway_transaction_id?: string | null
          id?: string
          installments?: number
          payment_method: string
          reservation_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fee_amount?: number
          gateway_transaction_id?: string | null
          id?: string
          installments?: number
          payment_method?: string
          reservation_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_reservation_id_fkey'
            columns: ['reservation_id']
            isOneToOne: false
            referencedRelation: 'reservations'
            referencedColumns: ['id']
          },
        ]
      }
      user_onboarding: {
        Row: {
          created_at: string
          id: string
          is_first_access: boolean
          onboarding_completed_at: string | null
          paired_sensor_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_first_access?: boolean
          onboarding_completed_at?: string | null
          paired_sensor_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_first_access?: boolean
          onboarding_completed_at?: string | null
          paired_sensor_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          data_recebimento: string
          id: string
          mercado_pago_id: number | null
          payload: Json | null
          processado: boolean | null
          tipo_evento: string | null
        }
        Insert: {
          data_recebimento?: string
          id?: string
          mercado_pago_id?: number | null
          payload?: Json | null
          processado?: boolean | null
          tipo_evento?: string | null
        }
        Update: {
          data_recebimento?: string
          id?: string
          mercado_pago_id?: number | null
          payload?: Json | null
          processado?: boolean | null
          tipo_evento?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_unauthorized_data: { Args: never; Returns: Json }
      decrypt_pii: { Args: { p_cipher: string }; Returns: string }
      encrypt_pii: { Args: { p_text: string }; Returns: string }
      get_encryption_key: { Args: never; Returns: string }
      get_session_responses_decrypted: {
        Args: { p_session_id: string }
        Returns: {
          created_at: string
          id: string
          question_key: string
          question_label: string
          response_value: string
        }[]
      }
      get_user_guest_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      is_encrypted: { Args: { p_text: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
