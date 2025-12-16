export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type BetStatus = "open" | "active" | "voting" | "completed"
export type ParticipantStatus = "pending" | "accepted" | "declined"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          username: string | null
          avatar_url: string | null
          current_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          username?: string | null
          avatar_url?: string | null
          current_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          username?: string | null
          avatar_url?: string | null
          current_points?: number
          created_at?: string
          updated_at?: string
        }
      }
      bets: {
        Row: {
          id: string
          title: string
          description: string | null
          creator_id: string
          stake_amount: number
          status: BetStatus
          deadline: string
          is_private: boolean
          invite_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          creator_id: string
          stake_amount: number
          status?: BetStatus
          deadline: string
          is_private?: boolean
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          creator_id?: string
          stake_amount?: number
          status?: BetStatus
          deadline?: string
          is_private?: boolean
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bet_participants: {
        Row: {
          id: string
          bet_id: string
          user_id: string
          status: ParticipantStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          user_id: string
          status?: ParticipantStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          user_id?: string
          status?: ParticipantStatus
          created_at?: string
          updated_at?: string
        }
      }
      proofs: {
        Row: {
          id: string
          bet_id: string
          user_id: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          user_id: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          user_id?: string
          image_url?: string
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          bet_id: string
          voter_id: string
          voted_for_user_id: string
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          voter_id: string
          voted_for_user_id: string
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          voter_id?: string
          voted_for_user_id?: string
          confirmed_at?: string | null
          created_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          created_at?: string
        }
      }
      friend_requests: {
        Row: {
          id: string
          requester_id: string
          receiver_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          receiver_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          receiver_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_bet_creator: {
        Args: {
          bet_id_param: string
          creator_id_param: string
        }
        Returns: boolean
      }
    }
    Enums: {
      bet_status: BetStatus
      participant_status: ParticipantStatus
    }
  }
}

// Helper types for easier usage
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Bet = Database["public"]["Tables"]["bets"]["Row"]
export type BetParticipant = Database["public"]["Tables"]["bet_participants"]["Row"]
export type Proof = Database["public"]["Tables"]["proofs"]["Row"]
export type Vote = Database["public"]["Tables"]["votes"]["Row"]
export type Friend = Database["public"]["Tables"]["friends"]["Row"]
export type FriendRequest = Database["public"]["Tables"]["friend_requests"]["Row"]

// Extended types for queries with joins
export type BetWithDetails = Bet & {
  creator: Profile
  participants: (BetParticipant & { user: Profile })[]
  proof_count?: number
  vote_count?: number
  pot_size?: number // Calculated: stake_amount * participants count
}

