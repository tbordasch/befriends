# BetFriends - Actual Database Schema

**Last Verified**: Based on live Supabase database

---

## 📊 Tables Overview

Your database contains **7 tables**:

1. `profiles` - User profiles
2. `bets` - Betting entries
3. `bet_participants` - Participants in bets
4. `votes` - Voting records
5. `friends` - Friendship relationships
6. `friend_requests` - Friend request records
7. `proofs` - Proof images for bets

---

## 📋 Detailed Table Structure

### 1. `profiles`

Extends Supabase `auth.users` table.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | - | Primary Key (FK → auth.users.id) |
| `name` | TEXT | YES | NULL | User's display name |
| `email` | TEXT | YES | NULL | User's email (UNIQUE) |
| `username` | TEXT | YES | NULL | User's username (UNIQUE, format: `^[a-zA-Z0-9_-]{3,20}$`) |
| `avatar_url` | TEXT | YES | NULL | URL to user's avatar image |
| `current_points` | INTEGER | NO | `1000` | User's current available points |
| `created_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Last update timestamp |

**Auto-creation**: Profile is automatically created when user signs up via trigger `handle_new_user()`.

---

### 2. `bets`

Betting entries created by users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary Key |
| `title` | TEXT | NO | NULL | Bet title |
| `description` | TEXT | YES | NULL | Bet description |
| `creator_id` | UUID | NO | NULL | Foreign Key → profiles.id |
| `stake_amount` | INTEGER | NO | NULL | Points stake per participant (must be > 0) |
| `status` | `bet_status` ENUM | NO | `'open'` | Bet status: `'open'`, `'active'`, `'voting'`, `'completed'` |
| `deadline` | TIMESTAMPTZ | NO | NULL | Bet deadline |
| `is_private` | BOOLEAN | NO | `false` | Whether bet is private (requires invite code) |
| `invite_code` | TEXT | YES | NULL | Unique invite code for private bets |
| `created_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Last update timestamp |

**Status Flow**:
- `open`: Just created, waiting for participants
- `active`: Has participants, deadline not reached
- `voting`: Participants can vote
- `completed`: Voting finished, points distributed

---

### 3. `bet_participants`

Participants in bets (includes creator).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary Key |
| `bet_id` | UUID | NO | NULL | Foreign Key → bets.id |
| `user_id` | UUID | NO | NULL | Foreign Key → profiles.id |
| `status` | `participant_status` ENUM | NO | `'pending'` | Status: `'pending'`, `'accepted'`, `'declined'` |
| `created_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Last update timestamp |

**Unique Constraint**: (`bet_id`, `user_id`) - User can only participate once per bet

**Status Meanings**:
- `pending`: Invited but not yet accepted
- `accepted`: Joined/accepted invitation (points deducted)
- `declined`: Declined invitation

---

### 4. `votes`

Voting records for bets.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary Key |
| `bet_id` | UUID | NO | NULL | Foreign Key → bets.id |
| `voter_id` | UUID | NO | NULL | Foreign Key → profiles.id (who voted) |
| `voted_for_user_id` | UUID | NO | NULL | Foreign Key → profiles.id (who they voted for) |
| `created_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Vote timestamp |
| `confirmed_at` | TIMESTAMPTZ | YES | NULL | When vote was confirmed (finalized) |

**Unique Constraint**: (`bet_id`, `voter_id`) - Each participant can vote once per bet

**Index**: `idx_votes_confirmed_at` on (`bet_id`, `confirmed_at`) for faster queries

**Voting Flow**:
1. User clicks participant card → Vote is cast (can be revoked)
2. After all participants voted → "OK - Confirm Vote" button appears
3. User confirms → `confirmed_at` is set
4. When all votes confirmed OR deadline passed → Bet completion logic runs

---

### 5. `friends`

Friendship relationships (unidirectional).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary Key |
| `user_id` | UUID | NO | NULL | Foreign Key → profiles.id |
| `friend_id` | UUID | NO | NULL | Foreign Key → profiles.id |
| `created_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Friendship creation timestamp |

**Unique Constraint**: (`user_id`, `friend_id`) - Prevents duplicate friendships

**Check Constraint**: `user_id != friend_id` - User cannot friend themselves

**Note**: Friendship is unidirectional. Use `getUserFriends()` which checks both directions.

---

### 6. `friend_requests`

Friend request records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary Key |
| `requester_id` | UUID | NO | NULL | Foreign Key → profiles.id (who sent request) |
| `receiver_id` | UUID | NO | NULL | Foreign Key → profiles.id (who received request) |
| `status` | TEXT | NO | `'pending'` | Status: `'pending'`, `'accepted'`, `'declined'` |
| `created_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Request creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Last update timestamp |

**Unique Constraint**: (`requester_id`, `receiver_id`) - Prevents duplicate requests

**Check Constraint**: `requester_id != receiver_id` - User cannot request themselves

**Status Flow**:
- `pending`: Request sent, waiting for response
- `accepted`: Request accepted, friendship created
- `declined`: Request declined

---

### 7. `proofs`

Proof images uploaded by participants.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary Key |
| `bet_id` | UUID | NO | NULL | Foreign Key → bets.id |
| `user_id` | UUID | NO | NULL | Foreign Key → profiles.id |
| `image_url` | TEXT | NO | NULL | URL to image in Supabase Storage |
| `created_at` | TIMESTAMPTZ | NO | `timezone('utc', now())` | Upload timestamp |

**Unique Constraint**: (`bet_id`, `user_id`) - One proof per user per bet

**Storage**: Images stored in Supabase Storage bucket `proofs` at path `proofs/{betId}/{userId}_{timestamp}.{ext}`

---

## 🔗 Relationships

```
profiles (1) ──┬──> (many) bets (creator_id)
               ├──> (many) bet_participants (user_id)
               ├──> (many) votes (voter_id, voted_for_user_id)
               ├──> (many) friends (user_id, friend_id)
               ├──> (many) friend_requests (requester_id, receiver_id)
               └──> (many) proofs (user_id)

bets (1) ──┬──> (many) bet_participants (bet_id)
           ├──> (many) votes (bet_id)
           └──> (many) proofs (bet_id)
```

---

## 🎯 Custom Types (ENUMs)

### `bet_status`
- `'open'` - Bet just created, waiting for participants
- `'active'` - Bet has participants, deadline not reached
- `'voting'` - Participants can vote
- `'completed'` - Voting finished, points distributed

### `participant_status`
- `'pending'` - Invited but not yet accepted
- `'accepted'` - Joined/accepted invitation
- `'declined'` - Declined invitation

---

## 🔐 Row Level Security (RLS)

**All tables have RLS enabled** with comprehensive policies:

### `profiles`
- ✅ SELECT: Everyone can view
- ✅ INSERT: Users can create their own profile
- ✅ UPDATE: Users can only update their own profile

### `bets`
- ✅ SELECT: Public bets OR user is creator OR user is participant
- ✅ INSERT: Users can create bets (creator_id must match auth.uid())
- ✅ UPDATE: Only creator can update
- ✅ DELETE: Only creator can delete

### `bet_participants`
- ✅ SELECT: Users can see participants of bets they participate in
- ✅ INSERT: Users can join (user_id = auth.uid()) OR creator can invite (via `check_bet_creator()` function)
- ✅ UPDATE: Users can update their own status

### `votes`
- ✅ SELECT: Votes are viewable by participants of the bet
- ✅ INSERT: Users can cast their own vote (voter_id = auth.uid())
- ✅ UPDATE: Users can update their own votes
- ✅ DELETE: Users can delete their own votes

### `friends`
- ✅ SELECT: Users can see friendships where they are user_id or friend_id
- ✅ INSERT: Users can create friendships (user_id = auth.uid())
- ✅ DELETE: Users can delete friendships where they are user_id or friend_id

### `friend_requests`
- ✅ SELECT: Users can see requests they sent or received
- ✅ INSERT: Users can create requests (requester_id = auth.uid())
- ✅ UPDATE: Users can update requests they received (receiver_id = auth.uid())
- ✅ DELETE: Users can delete their own requests or accepted requests they sent or declined requests they received

### `proofs`
- ✅ SELECT: Proofs are viewable by participants of the bet
- ✅ INSERT: Users can upload their own proof (user_id = auth.uid())

---

## 🔧 PostgreSQL Functions

Your database includes these custom functions:

1. **`atomic_deduct_points(user_id, amount)`** - Atomically deduct points
2. **`atomic_add_points(user_id, amount)`** - Atomically add points
3. **`atomic_refund_points_bulk(user_ids[], amount)`** - Atomically refund points to multiple users
4. **`handle_new_user()`** - Trigger function: Creates profile on signup
5. **`handle_updated_at()`** - Trigger function: Auto-updates updated_at timestamp
6. **`check_bet_creator(bet_id, creator_id)`** - SECURITY DEFINER: Checks if user is bet creator
7. **`generate_invite_code()`** - Generates unique invite code for private bets
8. **`insert_bet_participant_invites(bet_id, creator_id, user_ids[])`** - SECURITY DEFINER: Inserts participant records
9. **`is_user_participant(bet_id, user_id)`** - Checks if user is a participant in a bet

---

## ✅ Summary

Your database structure is **complete and matches the codebase perfectly**! All tables, columns, relationships, and RLS policies are correctly set up.

**Key Features Confirmed**:
- ✅ Authentication with email/password
- ✅ User profiles with username
- ✅ Points system (current_points)
- ✅ Bet creation and management
- ✅ Friend system (friends + friend_requests)
- ✅ Voting system with confirmation (confirmed_at)
- ✅ Proof upload capability
- ✅ Complete RLS security

Everything is ready for production! 🚀

