# Supabase SQL Scripts

## 🚀 Quick Start

**For a fresh setup, run ONLY this file:**
```
supabase/MASTER_SETUP.sql
```

This single script contains everything you need:
- All tables (profiles, bets, bet_participants, proofs, votes, friends, friend_requests)
- All columns (including username, invite_code)
- All indexes
- All functions (including check_bet_creator)
- All RLS policies (all fixes included)

## 📁 Other Scripts (Utilities Only)

These are utility scripts for maintenance, not needed for setup:

### Maintenance Scripts
- `delete_all_data.sql` - Delete all data (keeps structure)
- `reset_all_with_auth.sql` - Delete everything including auth users
- `reset_points.sql` - Reset all users' points to 1000
- `cleanup_declined_requests.sql` - Clean up old declined friend requests

### Documentation
- `reset_everything.md` - Guide for resetting database

## ⚠️ Old Migration Scripts (Deprecated)

These are **NOT needed anymore** - all fixes are in `MASTER_SETUP.sql`:
- ❌ `schema_clean.sql` - Use MASTER_SETUP.sql instead
- ❌ `add_invite_system.sql` - Included in MASTER_SETUP.sql
- ❌ `add_username.sql` - Included in MASTER_SETUP.sql
- ❌ `add_friend_requests.sql` - Included in MASTER_SETUP.sql
- ❌ `fix_bet_participants_rls.sql` - Included in MASTER_SETUP.sql
- ❌ `fix_bet_participants_rls_insert.sql` - Included in MASTER_SETUP.sql
- ❌ `fix_bets_policy.sql` - Included in MASTER_SETUP.sql
- ❌ `fix_bets_rls_for_invitations.sql` - Included in MASTER_SETUP.sql
- ❌ `fix_friends_rls.sql` - Included in MASTER_SETUP.sql
- ❌ `fix_friends_delete_policy.sql` - Included in MASTER_SETUP.sql
- ❌ `add_friend_requests_delete_policy.sql` - Included in MASTER_SETUP.sql
- ❌ `allow_delete_accepted_requests.sql` - Included in MASTER_SETUP.sql

## 🔄 After Setup

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `MASTER_SETUP.sql`
3. Click "Run"
4. Done! ✅

## 📊 What Gets Created

- **7 Tables**: profiles, bets, bet_participants, proofs, votes, friends, friend_requests
- **All Indexes**: For performance optimization
- **All Functions**: handle_new_user, handle_updated_at, check_bet_creator, generate_invite_code
- **All Triggers**: Auto-create profiles, auto-update timestamps
- **All RLS Policies**: Complete security setup

