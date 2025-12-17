# BetFriends - Complete Codebase Documentation

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Core Features & Data Flow](#core-features--data-flow)
7. [Server Actions](#server-actions)
8. [Components](#components)
9. [Supabase Configuration](#supabase-configuration)
10. [Deployment](#deployment)

---

## 🏗️ Architecture Overview

**BetFriends** is a social betting platform built with Next.js 14+ App Router, where friends can create custom bets and vote on winners. The app follows a mobile-first design approach with a native app-like UI.

### Key Concepts:
- **Points System**: Virtual currency for betting (users start with 1000 points)
- **Bet Types**: Public, Private (invite-only), Friends-only
- **Voting System**: Democratic voting where all participants vote for the winner
- **Winner Determination**: 
  - If 100% votes for one person → Winner gets entire pot
  - Otherwise (tie) → All participants get their stake refunded
- **Bet Lifecycle**: `open` → `active` → `voting` → `completed`

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.10 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Deployment**: Vercel
- **State Management**: React Server Components + Server Actions

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── auth/callback/           # Supabase auth callback handler
│   │   └── route.ts
│   ├── bets/[id]/               # Bet detail & edit pages
│   │   ├── page.tsx             # Bet detail page with voting
│   │   └── edit/page.tsx        # Edit bet (creator only)
│   ├── create/                  # Create new bet
│   │   └── page.tsx
│   ├── friends/                 # Friends management
│   │   └── page.tsx
│   ├── login/                   # Login page
│   │   └── page.tsx
│   ├── profile/                 # User profile & stats
│   │   └── page.tsx
│   ├── signup/                  # Registration
│   │   └── page.tsx
│   ├── layout.tsx               # Root layout with Sidebar & BottomNav
│   ├── page.tsx                 # Dashboard (Home)
│   └── globals.css              # Global styles
│
├── components/
│   ├── bet/                     # Bet-related components
│   │   ├── BetCard.tsx          # Bet card display
│   │   ├── CopyInviteLinkButton.tsx
│   │   ├── DeleteBetButton.tsx  # Delete bet (disabled if completed)
│   │   ├── EditBetForm.tsx      # Edit bet form
│   │   ├── FriendSelector.tsx   # Select friends/users
│   │   ├── InviteFriendsButton.tsx
│   │   ├── JoinBetButton.tsx    # Join public bet
│   │   ├── ProofsDisplay.tsx    # Display proof images
│   │   ├── ProofUpload.tsx      # Upload proof images
│   │   └── VotingSection.tsx    # Voting UI (card-based, toggle)
│   │
│   ├── friends/                 # Friend management
│   │   ├── FriendRequests.tsx   # Friend requests (sent/received)
│   │   ├── FriendsList.tsx      # List of friends
│   │   └── SearchUsers.tsx      # Search & add friends
│   │
│   ├── invitations/             # Bet invitations
│   │   ├── InvitationCard.tsx   # Single invitation card
│   │   └── InvitationsList.tsx  # List of invitations
│   │
│   ├── layout/                  # Navigation
│   │   ├── BottomNavigation.tsx # Mobile bottom nav
│   │   ├── Sidebar.tsx          # Desktop sidebar with PointsDisplay
│   │   └── UserMenu.tsx         # User menu with logout
│   │
│   ├── points/
│   │   └── PointsDisplay.tsx    # Points display component
│   │
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── input.tsx
│
├── lib/
│   ├── actions/                 # Server Actions (database operations)
│   │   ├── betInvites.ts        # Invite users to bets
│   │   ├── bets.ts              # Create, join, delete bets
│   │   ├── friendRequests.ts    # Friend request management
│   │   ├── friends.ts           # Friend management
│   │   ├── invitations.ts       # Bet invitation management
│   │   ├── points.ts            # Points operations (deduct, refund, calculations)
│   │   ├── pointsClient.ts      # Client-side point calculations
│   │   ├── proofs.ts            # Proof image upload
│   │   └── votes.ts             # Voting operations
│   │
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   └── server.ts            # Server Supabase client
│   │
│   └── utils.ts                 # Utility functions (cn, etc.)
│
└── types/
    └── database.ts              # TypeScript database types

supabase/
├── MASTER_SETUP.sql             # Complete database setup (run once)
├── PROOFS_STORAGE_POLICY.sql    # Storage policies for proof images
├── CREATE_PROOFS_BUCKET.md      # Instructions for creating storage bucket
├── NEW_PROJECT_SETUP.md         # Setup guide for new Supabase projects
└── README.md                    # SQL scripts overview
```

---

## 📊 Database Schema

### Tables

#### `profiles` (extends `auth.users`)
- `id` (UUID, PK, FK → `auth.users.id`)
- `name` (TEXT)
- `email` (TEXT, UNIQUE)
- `username` (TEXT, UNIQUE, format: `^[a-zA-Z0-9_-]{3,20}$`)
- `avatar_url` (TEXT)
- `current_points` (INTEGER, default: 1000)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Auto-creation**: Trigger `handle_new_user()` creates profile on signup.

---

#### `bets`
- `id` (UUID, PK)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `creator_id` (UUID, FK → `profiles.id`)
- `stake_amount` (INTEGER, > 0)
- `status` (`bet_status` ENUM: `'open'`, `'active'`, `'voting'`, `'completed'`)
- `deadline` (TIMESTAMPTZ, NOT NULL)
- `is_private` (BOOLEAN, default: false)
- `invite_code` (TEXT, UNIQUE) - Generated for private bets
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Status Flow**:
- `open`: Just created, waiting for participants
- `active`: Has participants, deadline not reached
- `voting`: Participants can vote
- `completed`: Voting finished, points distributed

---

#### `bet_participants`
- `id` (UUID, PK)
- `bet_id` (UUID, FK → `bets.id`)
- `user_id` (UUID, FK → `profiles.id`)
- `status` (`participant_status` ENUM: `'pending'`, `'accepted'`, `'declined'`)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- UNIQUE(`bet_id`, `user_id`)

**Status Meanings**:
- `pending`: Invited, not yet accepted
- `accepted`: Joined/accepted invitation
- `declined`: Declined invitation

---

#### `votes`
- `id` (UUID, PK)
- `bet_id` (UUID, FK → `bets.id`)
- `voter_id` (UUID, FK → `profiles.id`)
- `voted_for_user_id` (UUID, FK → `profiles.id`)
- `created_at` (TIMESTAMPTZ)
- `confirmed_at` (TIMESTAMPTZ, nullable) - When vote was confirmed
- UNIQUE(`bet_id`, `voter_id`)
- Index: `idx_votes_confirmed_at` on (`bet_id`, `confirmed_at`)

**Voting Flow**:
1. User clicks participant card → Vote is cast (can be revoked)
2. After all participants voted → "OK - Confirm Vote" button appears
3. User confirms → `confirmed_at` is set
4. When all votes confirmed OR deadline passed → Bet completion logic runs

---

#### `proofs`
- `id` (UUID, PK)
- `bet_id` (UUID, FK → `bets.id`)
- `user_id` (UUID, FK → `profiles.id`)
- `image_url` (TEXT) - URL to image in Supabase Storage
- `created_at` (TIMESTAMPTZ)
- UNIQUE(`bet_id`, `user_id`)

---

#### `friends`
- `id` (UUID, PK)
- `user_id` (UUID, FK → `profiles.id`)
- `friend_id` (UUID, FK → `profiles.id`)
- `created_at` (TIMESTAMPTZ)
- UNIQUE(`user_id`, `friend_id`)
- CHECK (`user_id != friend_id`)

**Note**: Friendship is unidirectional. Use `getUserFriends()` which checks both directions.

---

#### `friend_requests`
- `id` (UUID, PK)
- `requester_id` (UUID, FK → `profiles.id`)
- `receiver_id` (UUID, FK → `profiles.id`)
- `status` (TEXT: `'pending'`, `'accepted'`, `'declined'`)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- UNIQUE(`requester_id`, `receiver_id`)
- CHECK (`requester_id != receiver_id`)

---

### PostgreSQL Functions

#### `atomic_deduct_points(user_id, amount)`
- Atomically deducts points from user
- Returns: `{ success: boolean, error_message?: text, new_balance?: integer }`
- Prevents race conditions using `UPDATE ... SET current_points = current_points - amount`

#### `atomic_add_points(user_id, amount)`
- Atomically adds points to user
- Returns: `{ success: boolean, error_message?: text, new_balance?: integer }`

#### `atomic_refund_points_bulk(user_ids[], amount)`
- Atomically refunds points to multiple users (used for bet deletion/refunds)
- Returns array of results

#### `handle_new_user()`
- Trigger function: Creates profile when user signs up
- Sets `current_points = 1000`

#### `handle_updated_at()`
- Trigger function: Auto-updates `updated_at` timestamp

#### `check_bet_creator(bet_id, creator_id)`
- SECURITY DEFINER function: Checks if user is bet creator
- Used by RLS policies to allow creators to invite participants

#### `generate_invite_code()`
- Generates unique invite code for private bets

#### `insert_bet_participant_invites(bet_id, creator_id, user_ids[])`
- SECURITY DEFINER function: Inserts participant records (bypasses RLS)
- Used when creator invites friends

#### `is_user_participant(bet_id, user_id)`
- Checks if user is a participant in a bet

---

### Row Level Security (RLS)

**All tables have RLS enabled** with policies for:
- **profiles**: Public read, users can only update their own
- **bets**: Read if public OR user is creator/participant; Insert/Update as creator
- **bet_participants**: Users can see their own; Insert via `insert_bet_participant_invites()` or self-join
- **votes**: Users can see all votes in their bets; Insert/Update their own votes
- **friends**: Users can see/manage their own friendships
- **friend_requests**: Users can see/manage their own requests
- **proofs**: Users can see proofs in their bets; Upload their own

See `supabase/MASTER_SETUP.sql` for complete RLS policies.

---

## 🔐 Authentication & Authorization

### Authentication Flow
1. User signs up → Supabase Auth creates `auth.users` record
2. Trigger `handle_new_user()` creates `profiles` record with 1000 points
3. Session stored in cookies via `@supabase/ssr`

### Authorization
- **Server Components**: Use `createClient()` from `lib/supabase/server.ts`
- **Client Components**: Use `createClient()` from `lib/supabase/client.ts`
- **RLS Policies**: Enforce data access at database level
- **Server Actions**: All actions verify user authentication before operations

### Protected Routes
- All pages (except `/login`, `/signup`) redirect to `/login` if not authenticated
- Auth callback handler at `/auth/callback` processes Supabase auth redirects

---

## 🔄 Core Features & Data Flow

### 1. Creating a Bet

**Flow**:
1. User fills form (`/create`) → `createBet()` server action
2. If private/friends_only: `inviteUsersToBet()` creates `bet_participants` with status `'pending'`
3. Points **NOT deducted** at creation (only when participant accepts)
4. If private: `generate_invite_code()` creates unique invite code

**Code**: `src/lib/actions/bets.ts` → `createBet()`

---

### 2. Joining/Accepting a Bet

**Flow**:
1. **Public Bet**: User clicks "Join Bet" → `joinBet()` → Deducts points → Creates `bet_participants` (status: `'accepted'`)
2. **Invitation**: User accepts invitation → `acceptInvitation()` → Deducts points → Updates `bet_participants` (status: `'accepted'`)

**Code**: 
- `src/lib/actions/bets.ts` → `joinBet()`
- `src/lib/actions/invitations.ts` → `acceptInvitation()`

---

### 3. Voting System

**Flow**:
1. **Cast Vote**: User clicks participant card → `toggleVote()` → Inserts/updates vote (can revoke)
2. **Confirm Vote**: After all participants voted → "OK - Confirm Vote" button → `confirmVote()` → Sets `confirmed_at`
3. **Auto-Completion**: `checkAndUpdateBetStatus()` runs when:
   - All votes are confirmed, OR
   - Deadline has passed (auto-confirms unconfirmed votes)
4. **Winner Determination**:
   - If 100% votes for one person → `distributePointsToWinner()` → Winner gets entire pot
   - Otherwise (tie) → `refundPointsToAllParticipants()` → All get stake refunded
5. Bet status updated to `'completed'`

**Code**: `src/lib/actions/votes.ts`

**UI**: `src/components/bet/VotingSection.tsx` (card-based, toggle voting)

---

### 4. Points System

**Points Calculation**:
- **Available**: `profile.current_points` (can be used for new bets)
- **In Bets**: Sum of `stake_amount` from all active bets where user is participant
- **Total**: `Available + In Bets`
- **Potential Win**: Sum of pot sizes from all active bets (info only, not included in Total)

**Atomic Operations**:
- `deductPoints()` → Uses `atomic_deduct_points()` SQL function
- `refundPoints()` → Uses `atomic_add_points()` SQL function
- `atomic_refund_points_bulk()` → Refunds multiple users (used for bet deletion/ties)

**Code**: `src/lib/actions/points.ts`

---

### 5. Friend System

**Flow**:
1. User searches for username → `searchUsersByUsername()`
2. User sends friend request → `sendFriendRequest()` → Creates `friend_requests` (status: `'pending'`)
3. Receiver accepts → `acceptFriendRequest()` → Creates `friends` entry → Updates request status to `'accepted'`
4. Friendship is unidirectional, but `getUserFriends()` checks both directions

**Code**: `src/lib/actions/friends.ts`, `src/lib/actions/friendRequests.ts`

---

### 6. Bet Deletion

**Flow**:
1. Only creator can delete
2. Cannot delete if status is `'completed'`
3. `deleteBet()` → `atomic_refund_points_bulk()` refunds all participants → Deletes bet (CASCADE deletes participants, votes, proofs)

**Code**: `src/lib/actions/bets.ts` → `deleteBet()`

---

## 📡 Server Actions

All server actions are in `src/lib/actions/` and use `"use server"` directive.

### `bets.ts`
- `createBet()` - Create new bet
- `joinBet()` - Join public bet, deduct points
- `deleteBet()` - Delete bet, refund participants

### `betInvites.ts`
- `inviteUsersToBet()` - Invite users to bet (creator only)

### `invitations.ts`
- `getPendingInvitations()` - Get all pending invitations
- `getLatestPendingInvitation()` - Get latest invitation
- `acceptInvitation()` - Accept invitation, deduct points
- `declineInvitation()` - Decline invitation

### `votes.ts`
- `toggleVote()` - Cast or revoke vote
- `castVote()` - Cast a vote
- `revokeVote()` - Revoke a vote
- `confirmVote()` - Confirm vote (finalize)
- `getVotes()` - Get all votes for a bet
- `getUserVote()` - Get current user's vote
- `checkAndUpdateBetStatus()` - Check if bet should be completed, distribute points
- `distributePointsToWinner()` - Award pot to winner
- `refundPointsToAllParticipants()` - Refund stakes on tie

### `points.ts`
- `getLockedPoints()` - Calculate locked points (in active bets)
- `getPotentialWin()` - Calculate potential win (sum of pot sizes)
- `deductPoints()` - Deduct points (atomic)
- `refundPoints()` - Refund points (atomic)

### `pointsClient.ts`
- Client-side versions of point calculations (for UI)

### `friends.ts`
- `searchUsersByUsername()` - Search users
- `getUserFriends()` - Get user's friends (checks both directions)
- `addFriend()` - Add friend (legacy, not used)
- `removeFriend()` - Remove friend (bidirectional)

### `friendRequests.ts`
- `sendFriendRequest()` - Send friend request
- `getFriendRequests()` - Get friend requests (sent/received)
- `acceptFriendRequest()` - Accept request, create friendship
- `declineFriendRequest()` - Decline request

### `proofs.ts`
- `uploadProof()` - Upload proof image (saves URL to database)
- `getProofs()` - Get proofs for a bet

---

## 🎨 Components

### Layout Components

**`Sidebar.tsx`** (Desktop)
- Shows user info, `PointsDisplay`, navigation links
- Only visible on `md:` screens and up

**`BottomNavigation.tsx`** (Mobile)
- Fixed bottom navigation bar
- Links: Dashboard, Groups (Friends), Profile
- Only visible on mobile (`md:hidden`)

**`UserMenu.tsx`**
- User avatar dropdown with logout

---

### Bet Components

**`BetCard.tsx`**
- Displays bet info (title, description, stake, participants, pot, deadline, remaining days)

**`VotingSection.tsx`**
- Card-based voting UI
- Participants displayed as cards, click to vote, click again to revoke
- Shows vote counts, "OK - Confirm Vote" button when all voted
- Displays winner/tie messages when completed

**`JoinBetButton.tsx`**
- Button to join public bets
- Handles invite code for private bets

**`InviteFriendsButton.tsx`**
- Opens dialog to invite friends to existing bet

**`DeleteBetButton.tsx`**
- Delete bet button (disabled if `status === 'completed'`)

**`EditBetForm.tsx`**
- Form to edit bet (creator only)

**`ProofUpload.tsx`**
- Upload proof images to Supabase Storage
- Displays current proof

---

### Friends Components

**`FriendsList.tsx`**
- Lists all friends

**`FriendRequests.tsx`**
- Shows sent and received friend requests
- Accept/decline buttons

**`SearchUsers.tsx`**
- Search users by username
- Send friend request button

---

### Invitations Components

**`InvitationsList.tsx`**
- Lists all pending bet invitations

**`InvitationCard.tsx`**
- Single invitation with accept/decline buttons

---

### Points Components

**`PointsDisplay.tsx`**
- Displays: Total Points, Available, In Bets, Potential Win
- Used in Sidebar and Profile page

---

## 🔧 Supabase Configuration

### Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Setup Steps

1. **Run MASTER_SETUP.sql** in Supabase SQL Editor (one-time setup)
   - Creates all tables, functions, triggers, RLS policies

2. **Create Storage Bucket** (for proof images):
   - Go to Storage → Create bucket: `proofs` (public)
   - Run `PROOFS_STORAGE_POLICY.sql` to create policies

3. **Set Redirect URL** (for auth):
   - Authentication → URL Configuration
   - Add: `https://your-domain.com/auth/callback`
   - For local dev: `http://localhost:3000/auth/callback`

### Storage Bucket

- **Name**: `proofs`
- **Public**: Yes (images accessible via URL)
- **Path**: `proofs/{betId}/{userId}_{timestamp}.{ext}`

---

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Connect to Vercel**:
   - Go to Vercel → Add New Project
   - Import GitHub repository
   - Framework: Next.js (auto-detected)

3. **Set Environment Variables** in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Update Supabase Redirect URL**:
   - Add Vercel URL: `https://your-app.vercel.app/auth/callback`

5. **Deploy** → Done! 🎉

### Auto-Deployment

Every push to `main` branch triggers automatic deployment on Vercel.

---

## 📝 Notes

- **Mobile-First Design**: UI optimized for mobile, desktop uses sidebar
- **Atomic Operations**: All point operations use PostgreSQL atomic functions to prevent race conditions
- **RLS Security**: Row Level Security enforces data access at database level
- **Server Actions**: All database operations are server actions (no API routes)
- **Type Safety**: Full TypeScript types in `src/types/database.ts`
- **No Real-time**: Currently no Supabase Realtime subscriptions (can be added later)

---

## 🔍 Key Files Reference

- **Database Setup**: `supabase/MASTER_SETUP.sql`
- **Auth Callback**: `src/app/auth/callback/route.ts`
- **Voting Logic**: `src/lib/actions/votes.ts` → `checkAndUpdateBetStatus()`
- **Points Logic**: `src/lib/actions/points.ts`
- **Bet Creation**: `src/app/create/page.tsx` + `src/lib/actions/bets.ts`
- **Voting UI**: `src/components/bet/VotingSection.tsx`

---

**Last Updated**: Based on codebase analysis
**Version**: 1.0.0 (Production-ready)

