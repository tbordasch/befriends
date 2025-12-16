# BetFriends - Codebase Summary

## 🏗️ Architecture Overview

**Tech Stack:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, RLS)
- Lucide React (Icons)

**Project Structure:**
```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/callback/      # Supabase auth callback
│   ├── bets/[id]/          # Bet detail & edit pages
│   ├── create/             # Create bet page
│   ├── friends/            # Friends management page
│   ├── login/              # Login page
│   ├── profile/            # User profile page
│   ├── signup/             # Signup page
│   └── page.tsx            # Dashboard (Home)
├── components/
│   ├── bet/                # Bet-related components
│   ├── friends/            # Friend management components
│   ├── invitations/        # Bet invitation components
│   ├── layout/             # Navigation components
│   ├── points/             # Points display component
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── actions/            # Server Actions (database operations)
│   ├── supabase/           # Supabase client/server utilities
│   └── utils.ts            # Utility functions
└── types/
    └── database.ts         # TypeScript database types
```

## 📊 Database Schema

### Tables

**profiles** (extends auth.users)
- `id` (UUID, PK, FK to auth.users)
- `name` (TEXT)
- `email` (TEXT, UNIQUE)
- `username` (TEXT, UNIQUE) ⚠️ Added via migration
- `avatar_url` (TEXT)
- `current_points` (INTEGER, default 1000)
- `created_at`, `updated_at`

**bets**
- `id` (UUID, PK)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `creator_id` (UUID, FK to profiles)
- `stake_amount` (INTEGER, > 0)
- `status` (bet_status ENUM: 'open', 'active', 'voting', 'completed')
- `deadline` (TIMESTAMP)
- `is_private` (BOOLEAN, default false)
- `invite_code` (TEXT, UNIQUE) ⚠️ Added via migration
- `created_at`, `updated_at`

**bet_participants**
- `id` (UUID, PK)
- `bet_id` (UUID, FK to bets)
- `user_id` (UUID, FK to profiles)
- `status` (participant_status ENUM: 'pending', 'accepted', 'declined')
- `created_at`, `updated_at`
- UNIQUE(bet_id, user_id)

**proofs** (not yet implemented in UI)
- `id` (UUID, PK)
- `bet_id` (UUID, FK to bets)
- `user_id` (UUID, FK to profiles)
- `image_url` (TEXT)
- `created_at`
- UNIQUE(bet_id, user_id)

**votes** (not yet implemented in UI)
- `id` (UUID, PK)
- `bet_id` (UUID, FK to bets)
- `voter_id` (UUID, FK to profiles)
- `voted_for_user_id` (UUID, FK to profiles)
- `created_at`
- UNIQUE(bet_id, voter_id)

**friends**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `friend_id` (UUID, FK to profiles)
- `created_at`
- UNIQUE(user_id, friend_id)
- CHECK (user_id != friend_id)

**friend_requests** ⚠️ Added via migration
- `id` (UUID, PK)
- `requester_id` (UUID, FK to profiles)
- `receiver_id` (UUID, FK to profiles)
- `status` (TEXT: 'pending', 'accepted', 'declined')
- `created_at`, `updated_at`
- UNIQUE(requester_id, receiver_id)
- CHECK (requester_id != receiver_id)

### Important Functions

- `handle_new_user()` - Auto-creates profile on signup
- `handle_updated_at()` - Auto-updates updated_at timestamps
- `check_bet_creator()` - SECURITY DEFINER function for RLS bypass ⚠️ Added via migration

## 🔐 Row Level Security (RLS)

### Key Policies

**profiles:**
- SELECT: Everyone can view
- INSERT/UPDATE: Users can only modify their own profile

**bets:**
- SELECT: Public bets OR user is creator OR user is participant
- INSERT: Users can create bets (creator_id must match auth.uid())
- UPDATE: Only creator can update

**bet_participants:**
- SELECT: Users can see their own participant records
- INSERT: Users can join (user_id = auth.uid()) OR creator can invite (via check_bet_creator function)
- UPDATE: Users can update their own status

**friends:**
- SELECT: Users can see friendships where they are user_id OR friend_id
- INSERT: Users can create friendships where user_id = auth.uid()
- DELETE: Users can delete friendships where they are user_id OR friend_id

**friend_requests:**
- SELECT: Users can see requests they sent or received
- INSERT: Users can create requests where requester_id = auth.uid()
- UPDATE: Users can update requests they received
- DELETE: Users can delete their own requests OR declined requests they received

## 🎯 Core Features

### Implemented ✅

1. **Authentication**
   - Email/Password signup & login
   - Username system (unique, 3-20 chars)
   - Auto profile creation (1000 points)
   - Protected routes via middleware

2. **Points System**
   - Starting points: 1000
   - Available vs. Locked points display
   - Points deducted when joining bet
   - Points refunded when leaving bet (if implemented)

3. **Bets**
   - Create bet (public, private via link, friends_only)
   - Bet detail view
   - Edit bet (creator only)
   - Join bet
   - Invite friends to bet
   - Privacy levels:
     - `public`: Anyone can join
     - `private`: Only with invite link
     - `friends_only`: Only invited friends

4. **Friends System**
   - Search users by username
   - Send friend requests
   - Accept/decline requests
   - Remove friends (bidirectional)
   - Friends list display

5. **Bet Invitations**
   - Invite friends when creating friends_only bet
   - Pending invitations list
   - Accept/decline invitations
   - Latest pending invitation on dashboard

### Not Yet Implemented ❌

1. **Proof System** (UI exists, backend ready)
   - Upload proof images/videos
   - Display proofs on bet detail page

2. **Voting System** (backend ready)
   - Vote for winner after deadline
   - Vote display and counting

3. **Bet Status Transitions**
   - Automatic status updates based on deadline
   - active → voting → completed workflow

4. **Points Distribution**
   - Winner receives pot
   - Points redistribution logic

## 📝 Key Server Actions

**bets.ts:**
- `joinBet()` - Join a bet, deduct points, create participant record

**betInvites.ts:**
- `inviteUsersToBet()` - Invite users to a bet (creator only)

**friends.ts:**
- `searchUsersByUsername()` - Search for users
- `getUserFriends()` - Get user's friends (both directions)
- `removeFriend()` - Remove friend (both directions)

**friendRequests.ts:**
- `sendFriendRequest()` - Send friend request
- `getFriendRequests()` - Get pending requests
- `acceptFriendRequest()` - Accept request, create friendship
- `declineFriendRequest()` - Decline request

**invitations.ts:**
- `getPendingInvitations()` - Get bet invitations
- `getLatestPendingInvitation()` - Get latest pending invitation
- `acceptInvitation()` - Accept bet invitation
- `declineInvitation()` - Decline bet invitation

**points.ts:**
- `getLockedPoints()` - Get user's locked points
- `deductPoints()` - Deduct points from user
- `refundPoints()` - Refund points to user

## 🔄 Data Flow Patterns

### Friendship System
1. User A sends friend request → `friend_requests` table (pending)
2. User B accepts → `friend_requests` status → 'accepted', `friends` table entry created (B → A)
3. Both users see each other because `getUserFriends()` checks both directions

### Bet Invitation Flow
1. Creator creates `friends_only` bet → Select friends → `bet_participants` entries created (status: 'pending')
2. Invited user sees invitation in Friends page or Dashboard
3. User accepts → `bet_participants` status → 'accepted', points deducted
4. User declines → `bet_participants` status → 'declined', points not deducted

### Points Flow
- User joins bet → Points deducted immediately
- Points are "locked" until bet completes
- Available points = current_points - locked_points

## ⚠️ Important Notes

### Database Setup

**For new installations:**
- Run `supabase/MASTER_SETUP.sql` - Complete setup with all tables, functions, and RLS policies

**For existing installations (like yours):**
- Your database already has all tables and columns ✅
- You may need to ensure the `check_bet_creator()` function exists (for bet participant invites to work)
- Check if RLS policies match MASTER_SETUP.sql (especially for friends DELETE and bet_participants INSERT)

### Known Limitations

1. **Friendship Storage**: Only one direction stored (user_id → friend_id), but queries check both directions
2. **Points Refund**: Not fully implemented when leaving bet
3. **Bet Status**: Manual status updates needed (no automatic transitions)
4. **Proofs & Votes**: Backend ready, UI not implemented

## 🚀 Current State

**Working:**
- ✅ Authentication & user management
- ✅ Bet creation & management
- ✅ Friend system (requests, acceptance, removal)
- ✅ Bet invitations
- ✅ Points display (available vs locked)
- ✅ Privacy controls (public, private, friends_only)

**Needs Work:**
- ⚠️ Bet participant RLS (invite users) - SQL migration needed
- ⚠️ Proof upload & display
- ⚠️ Voting system
- ⚠️ Automatic bet status transitions
- ⚠️ Points distribution on bet completion

