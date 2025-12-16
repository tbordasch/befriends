# BetFriends - Current Status

**Last Updated:** Based on current codebase analysis

## ✅ Your Supabase Schema Status

Your database has **ALL required tables and columns**:
- ✅ `profiles` (with username)
- ✅ `bets` (with invite_code)
- ✅ `bet_participants`
- ✅ `friend_requests`
- ✅ `friends`
- ✅ `proofs`
- ✅ `votes`

## 🎯 Application Routes

**Pages:**
- `/` - Dashboard (Home)
- `/login` - Login page
- `/signup` - Signup page (with username)
- `/create` - Create bet page
- `/bets/[id]` - Bet detail page
- `/bets/[id]/edit` - Edit bet page (creator only)
- `/friends` - Friends management page
- `/profile` - User profile page

**API Routes:**
- `/auth/callback` - Supabase auth callback

## 🔧 Server Actions (src/lib/actions/)

### bets.ts
- `joinBet(betId, userId)` - Join a bet, deduct points

### betInvites.ts
- `inviteUsersToBet(betId, userIds, creatorId)` - Invite users to bet (creator only)

### friends.ts
- `searchUsersByUsername(query, currentUserId)` - Search for users
- `getUserFriends(userId)` - Get user's friends (checks both directions)
- `removeFriend(userId, friendId)` - Remove friend (bidirectional)

### friendRequests.ts
- `sendFriendRequest(requesterId, receiverId)` - Send friend request
- `getFriendRequests(userId)` - Get pending requests
- `acceptFriendRequest(requestId, userId)` - Accept request, create friendship
- `declineFriendRequest(requestId, userId)` - Decline request

### invitations.ts
- `getPendingInvitations(userId)` - Get bet invitations
- `getLatestPendingInvitation(userId)` - Get latest pending invitation
- `acceptInvitation(userId, invitationId)` - Accept bet invitation, deduct points
- `declineInvitation(userId, invitationId)` - Decline bet invitation

### points.ts
- `getLockedPoints(userId)` - Calculate locked points (in active bets)
- `deductPoints(userId, amount)` - Deduct points
- `refundPoints(userId, amount)` - Refund points

## 🎨 Components Structure

### Layout Components
- `BottomNavigation` - Mobile navigation bar
- `Sidebar` - Desktop navigation sidebar
- `UserMenu` - Logout menu

### Bet Components
- `BetCard` - Bet card display
- `EditBetForm` - Edit bet form
- `FriendSelector` - Select friends/users for invitations
- `InviteFriendsButton` - Invite friends to existing bet
- `JoinBetButton` - Join bet button
- `CopyInviteLinkButton` - Copy invite link

### Friends Components
- `FriendsList` - Display friends list
- `FriendRequests` - Display friend requests (sent/received)
- `SearchUsers` - Search and add friends

### Invitations Components
- `InvitationCard` - Single invitation card with accept/decline
- `InvitationsList` - List of pending invitations

### Points Components
- `PointsDisplay` - Display available and locked points

## 🚨 Known Issues

1. **Bet Participant Invites (RLS)**: When inviting friends to bets, you may get "new row violates row-level security policy" error
   - **Solution**: Ensure `check_bet_creator()` function exists in Supabase
   - Run this if missing:
   ```sql
   CREATE OR REPLACE FUNCTION public.check_bet_creator(bet_id_param UUID, creator_id_param UUID)
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM public.bets
       WHERE bets.id = bet_id_param AND bets.creator_id = creator_id_param
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   
   GRANT EXECUTE ON FUNCTION public.check_bet_creator(UUID, UUID) TO authenticated;
   ```

## 📋 Features Status

### ✅ Fully Working
- Authentication (Email/Password)
- User registration with username
- Bet creation (public, private, friends_only)
- Bet viewing and editing
- Friend system (search, request, accept, decline, remove)
- Bet invitations
- Points system (available vs locked)
- Dashboard with latest invitation
- Profile page

### ❌ Not Yet Implemented
- Proof upload UI (backend ready)
- Voting system UI (backend ready)
- Automatic bet status transitions
- Points distribution on bet completion
- Bet deletion
- Real-time updates

## 🔄 Data Flow

**Creating a Bet:**
1. User fills form → Creates bet in `bets` table
2. If `friends_only`: Creates `bet_participants` entries (status: 'pending')
3. Points NOT deducted (only when participant accepts)

**Accepting Invitation:**
1. User sees invitation → Clicks accept
2. Points deducted from user
3. `bet_participants` status updated to 'accepted'

**Joining Public Bet:**
1. User clicks "Join Bet" → `joinBet()` called
2. Points deducted
3. `bet_participants` entry created (status: 'accepted')

**Friend Request Flow:**
1. User A sends request → `friend_requests` entry (status: 'pending')
2. User B accepts → `friend_requests` status → 'accepted', `friends` entry created (B → A)
3. Both see each other because `getUserFriends()` checks both directions

## 🎯 Next Steps

To fix the bet invite issue:
1. Check if `check_bet_creator()` function exists in Supabase
2. If not, create it (see Known Issues above)
3. Verify RLS policy for `bet_participants` INSERT uses this function

For future features:
- Implement proof upload UI
- Implement voting system UI
- Add bet status transitions (cron job or edge function)
- Add points distribution logic

