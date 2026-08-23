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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
      assisted_applications: {
        Row: {
          assignment_id: string | null
          created_at: string
          guest_id: string | null
          id: string
          interpretation: string | null
          items: Json
          metadata: Json
          observations: string | null
          patient_id: string | null
          professional_id: string | null
          scale_name: string | null
          scale_type: string
          session_id: string | null
          total_score: number | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          interpretation?: string | null
          items?: Json
          metadata?: Json
          observations?: string | null
          patient_id?: string | null
          professional_id?: string | null
          scale_name?: string | null
          scale_type: string
          session_id?: string | null
          total_score?: number | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          interpretation?: string | null
          items?: Json
          metadata?: Json
          observations?: string | null
          patient_id?: string | null
          professional_id?: string | null
          scale_name?: string | null
          scale_type?: string
          session_id?: string | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'assisted_applications_assignment_id_fkey'
            columns: ['assignment_id']
            isOneToOne: false
            referencedRelation: 'scale_assignments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assisted_applications_guest_id_fkey'
            columns: ['guest_id']
            isOneToOne: false
            referencedRelation: 'guests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assisted_applications_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assisted_applications_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'anamnesis_sessions'
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
          fas_score: number | null
          ftdrs_score: number | null
          gad7_score: number | null
          global_severity: string | null
          hama_score: number | null
          hamd_score: number | null
          id: string
          is_accurate: boolean | null
          meem_score: number | null
          moca_score: number | null
          phq9_score: number | null
          session_id: string | null
          snap_iv_hyperactivity: number | null
          snap_iv_inattention: number | null
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
          fas_score?: number | null
          ftdrs_score?: number | null
          gad7_score?: number | null
          global_severity?: string | null
          hama_score?: number | null
          hamd_score?: number | null
          id?: string
          is_accurate?: boolean | null
          meem_score?: number | null
          moca_score?: number | null
          phq9_score?: number | null
          session_id?: string | null
          snap_iv_hyperactivity?: number | null
          snap_iv_inattention?: number | null
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
          fas_score?: number | null
          ftdrs_score?: number | null
          gad7_score?: number | null
          global_severity?: string | null
          hama_score?: number | null
          hamd_score?: number | null
          id?: string
          is_accurate?: boolean | null
          meem_score?: number | null
          moca_score?: number | null
          phq9_score?: number | null
          session_id?: string | null
          snap_iv_hyperactivity?: number | null
          snap_iv_inattention?: number | null
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
      clinical_reports: {
        Row: {
          content: Json
          created_at: string
          id: string
          patient_id: string
          professional_id: string | null
          risk_level: string | null
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          patient_id: string
          professional_id?: string | null
          risk_level?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          patient_id?: string
          professional_id?: string | null
          risk_level?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clinical_reports_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
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
          session_id: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          reservation_id?: string | null
          session_id?: string | null
          status: string
          subject: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          reservation_id?: string | null
          session_id?: string | null
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
          {
            foreignKeyName: 'email_logs_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'anamnesis_sessions'
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
          address: string | null
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
          profession: string | null
          responsible_name: string | null
          tcle_accepted: boolean | null
          tcle_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
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
          profession?: string | null
          responsible_name?: string | null
          tcle_accepted?: boolean | null
          tcle_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
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
          profession?: string | null
          responsible_name?: string | null
          tcle_accepted?: boolean | null
          tcle_accepted_at?: string | null
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
      patient_materials: {
        Row: {
          citations: Json | null
          content: string
          created_at: string
          created_by: string | null
          format: string
          id: string
          patient_id: string | null
          target_audience: string
          title: string
          tone: string
          topic: string
          updated_at: string
        }
        Insert: {
          citations?: Json | null
          content: string
          created_at?: string
          created_by?: string | null
          format?: string
          id?: string
          patient_id?: string | null
          target_audience?: string
          title: string
          tone?: string
          topic: string
          updated_at?: string
        }
        Update: {
          citations?: Json | null
          content?: string
          created_at?: string
          created_by?: string | null
          format?: string
          id?: string
          patient_id?: string | null
          target_audience?: string
          title?: string
          tone?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'patient_materials_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          created_at: string
          gender: string | null
          id: string
          initials: string
          photo_url: string | null
          responsible_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          initials: string
          photo_url?: string | null
          responsible_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          initials?: string
          photo_url?: string | null
          responsible_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          crm: string | null
          full_name: string | null
          guest_id: string | null
          has_completed_onboarding: boolean
          id: string
          photo_url: string | null
          privacy_consent: boolean | null
          privacy_consent_accepted_at: string | null
          role: string
          signature_url: string | null
          specialty: string | null
        }
        Insert: {
          created_at?: string
          crm?: string | null
          full_name?: string | null
          guest_id?: string | null
          has_completed_onboarding?: boolean
          id: string
          photo_url?: string | null
          privacy_consent?: boolean | null
          privacy_consent_accepted_at?: string | null
          role?: string
          signature_url?: string | null
          specialty?: string | null
        }
        Update: {
          created_at?: string
          crm?: string | null
          full_name?: string | null
          guest_id?: string | null
          has_completed_onboarding?: boolean
          id?: string
          photo_url?: string | null
          privacy_consent?: boolean | null
          privacy_consent_accepted_at?: string | null
          role?: string
          signature_url?: string | null
          specialty?: string | null
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
      scale_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          completed_at: string | null
          created_at: string
          guest_id: string | null
          id: string
          patient_id: string | null
          scale_type: string
          session_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          patient_id?: string | null
          scale_type: string
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          patient_id?: string | null
          scale_type?: string
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scale_assignments_guest_id_fkey'
            columns: ['guest_id']
            isOneToOne: false
            referencedRelation: 'guests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scale_assignments_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scale_assignments_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'anamnesis_sessions'
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
      accept_guest_tcle: { Args: { p_guest_id: string }; Returns: boolean }
      cleanup_unauthorized_data: { Args: never; Returns: Json }
      complete_assignment: {
        Args: { p_assignment_id: string }
        Returns: boolean
      }
      decrypt_pii: { Args: { p_cipher: string }; Returns: string }
      encrypt_pii: { Args: { p_text: string }; Returns: string }
      find_guest_by_document: {
        Args: { p_document: string }
        Returns: {
          out_address: string
          out_birth_date: string
          out_document: string
          out_first_name: string
          out_id: string
          out_last_name: string
          out_profession: string
          out_responsible_name: string
          out_tcle_accepted: boolean
        }[]
      }
      get_clinical_prevalence_stats: {
        Args: never
        Returns: {
          condition_name: string
          patient_count: number
          total_evaluated: number
        }[]
      }
      get_encryption_key: { Args: never; Returns: string }
      get_guest_assessment_results: {
        Args: { p_guest_id: string }
        Returns: {
          assigned_at: string
          assignment_id: string
          completed_at: string
          responses: Json
          scale_type: string
          session_id: string
          severity: string
          status: string
          total_score: number
        }[]
      }
      get_guest_assignments: {
        Args: { p_guest_id: string }
        Returns: {
          assigned_at: string
          completed_at: string
          id: string
          scale_type: string
          status: string
        }[]
      }
      get_guest_full: {
        Args: { p_guest_id: string }
        Returns: {
          address: string
          birth_date: string
          document: string
          email: string
          first_name: string
          id: string
          last_name: string
          profession: string
          responsible_name: string
        }[]
      }
      get_guest_tcle_status: {
        Args: { p_guest_id: string }
        Returns: {
          tcle_accepted: boolean
          tcle_accepted_at: string
        }[]
      }
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
      get_session_validation: {
        Args: { p_session_id: string }
        Returns: {
          assessment_type: string
          clinic_name: string
          clinician_crm: string
          clinician_name: string
          clinician_rqe: string
          completed_at: string
          patient_initials: string
          session_id: string
          started_at: string
          status: string
        }[]
      }
      get_user_guest_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      identify_guest_public: {
        Args: {
          p_address: string
          p_birth_date: string
          p_document: string
          p_first_name: string
          p_last_name: string
          p_profession: string
          p_responsible_name: string
        }
        Returns: {
          out_address: string
          out_birth_date: string
          out_document: string
          out_first_name: string
          out_id: string
          out_last_name: string
          out_profession: string
          out_responsible_name: string
        }[]
      }
      is_encrypted: { Args: { p_text: string }; Returns: boolean }
      list_guests_admin: {
        Args: never
        Returns: {
          birth_date: string
          created_at: string
          document: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
        }[]
      }
      upsert_guest_document_admin: {
        Args: { p_document: string; p_guest_id: string }
        Returns: string
      }
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
