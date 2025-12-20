# BetFriends - Social Betting Web App

## Overview
BetFriends is a **social betting platform** where users can create challenges (bets) with friends, participate in bets, submit proof, vote on winners, and earn/lose points. The app is built with a **mobile-first approach** and designed to eventually be wrapped in Capacitor for iOS/Android deployment, so it must feel like a native mobile app, not a traditional website.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL database, Authentication, Realtime subscriptions)
- **State Management**: React Query / Server Actions
- **Future**: Capacitor wrapper for iOS/Android

## Design Philosophy (CRITICAL)
- **Mobile-First**: All UI must work perfectly on mobile devices
- **Native Feel**: Must feel like a native app, not a website
- **Bottom Navigation**: Fixed bottom navigation bar (NO top header navigation)
- **Touch Targets**: All buttons/inputs minimum 44px height for accessibility
- **No Hover Effects**: Mobile doesn't have hover, use active states instead
- **Responsive Layout**: Use `w-full` and proper padding, avoid fixed widths

## Core Features (Currently Implemented)

### 1. User Authentication & Profiles
- Supabase authentication (email/password)
- User profiles with username, name, avatar
- Points system (starting balance: 1000 points)
- Achievement system (tracking unlocked achievements)
- Profile pages (own profile + friend profiles)

### 2. Betting System
- **Create Bets**: Users can create betting challenges with:
  - Title, description, stake amount (points)
  - Deadline (with quick presets: 3 days, 7 days, 31 days)
  - Privacy settings: Public, Private (invite code), Friends-only
  - Friend invitations (for friends-only bets)
- **Bet States**: open → active → voting → completed
- **Bet Types**:
  - Public: Anyone can see and request to join
  - Private: Requires invite code to join
  - Friends-only: Only invited friends can join
- **Join Requests**: For public bets, users can request to join (creator must accept)

### 3. Bet Participation
- **Participants**: Users join bets by paying stake amount (points deducted)
- **Proof Submission**: Participants can upload proof images
- **Voting System**: 
  - All participants vote on who won
  - Each participant votes for one person
  - Votes must be confirmed (cannot be changed after confirmation)
  - Bet completes when all votes are confirmed OR deadline passes
- **Winner Determination**: 
  - If unanimous winner (100% votes): Winner gets entire pot
  - If tie/no unanimous winner: All participants get their stake refunded
- **Points Distribution**: Automatic point distribution/refunds when bet completes

### 4. Social Features
- **Friends System**: 
  - Search users by username
  - Send/accept/decline friend requests
  - View friend profiles
  - See friend's stats (locked points, potential wins, achievements)
- **Friend Invitations**: Invite friends to bets
- **Social Page**: Central hub showing:
  - Friend requests (pending, incoming)
  - Friends list
  - Join requests (for bets you created)
  - Bet invitations (invites you received)
  - Notification badges with counts

### 5. Activity Feed
- **Dedicated Activity Page**: Chronological feed of all user activities
- **Activity Types**:
  - Bet events: Created, joined, won, tied/lost, deleted, invited
  - Social events: Friend requests (sent, accepted, declined), friend added/removed
  - Achievement events: Achievement unlocked
  - Join requests: Sent, accepted, declined (for both creator and requester)
- **Smart Linking**: Activities link to relevant pages (bets, profiles, social, etc.)
- Activities persist even when bets are deleted (for history)

### 6. Points & Stats
- **Points System**: 
  - Starting balance: 1000 points
  - Deducted when joining/creating bets
  - Awarded when winning bets (entire pot)
  - Refunded for ties or bet cancellations
- **Locked Points**: Points currently in active bets
- **Potential Win**: Sum of all pot sizes from bets user participates in
- **User Stats**: Betting statistics, win/loss record

### 7. Achievement System
- Achievement tracking and unlocking
- New achievement notifications
- Achievement display on profiles

### 8. Navigation Structure
- **Bottom Navigation Bar** (mobile): Dashboard, Browse, Create, Social, Activity, Profile
- **Sidebar** (desktop): Same navigation items
- **Notification Badges**: Show counts for:
  - Social page: Total pending requests/invitations/join requests
  - Profile page: New achievements count

## Key Pages

1. **Dashboard** (`/`): Shows active bets user participates in
2. **Browse** (`/browse`): Browse and discover public bets
3. **Create Bet** (`/create`): Create new betting challenges
4. **Bet Detail** (`/bets/[id]`): View bet details, submit proof, vote, manage participants
5. **Social** (`/social`): Friends, friend requests, invitations, join requests
6. **Activity** (`/activity`): Activity feed with all events
7. **Profile** (`/profile`): Own profile with stats, achievements, bet history
8. **Friend Profile** (`/profile/[id]`): View friend's profile

## Database Structure (Supabase/PostgreSQL)

### Main Tables:
- `profiles`: User profiles with points, achievements tracking
- `bets`: Betting challenges (title, description, stake, deadline, status, privacy)
- `bet_participants`: Participation records (pending, accepted, declined)
- `votes`: Voting records (voter, voted_for, confirmed status)
- `proofs`: Proof images submitted by participants
- `friends`: Friendship relationships (bidirectional)
- `friend_requests`: Friend request records (pending, accepted, declined)
- `activities`: Activity feed entries

### Key Features:
- Row Level Security (RLS) policies for data access control
- PostgreSQL functions for atomic operations (point deduction/addition)
- Cascade deletes for related data
- Activities table uses SET NULL on bet deletion (preserves history)

## Current UI/UX Patterns

### Components:
- Card-based layouts
- Bottom navigation (mobile) / Sidebar (desktop)
- Modal dialogs for actions
- Notification badges
- Status badges (bet status, participant status)
- Activity feed with icons and timestamps

### User Flows:
1. **Create Bet**: Select privacy → Add details → Invite friends (optional) → Create
2. **Join Bet**: Browse → View details → Request to join (public) or Join directly (private with code)
3. **Participate**: Upload proof → Vote for winner → Confirm vote
4. **Complete Bet**: Auto-completes when all votes confirmed or deadline passes → Points distributed
5. **Social**: Send friend requests → Accept → Invite to bets

## What's Working Well
- ✅ Core betting functionality
- ✅ Voting and bet completion logic
- ✅ Points system with atomic operations
- ✅ Friend system
- ✅ Activity feed
- ✅ Mobile-first responsive design
- ✅ Bottom navigation
- ✅ Notification badges

## Areas for Potential Enhancement
I'm looking for ideas to:
- **Improve User Experience**: Better onboarding, tutorials, helpful tooltips
- **Engagement Features**: Leaderboards, streaks, daily challenges
- **Social Features**: Bet commenting, sharing, reactions
- **UI/UX Polish**: Animations, transitions, micro-interactions
- **Gamification**: More achievements, badges, rewards
- **Discovery**: Better bet discovery, recommendations, trending bets
- **Notifications**: Push notifications, email notifications
- **Bet Types**: Different bet formats (team bets, tournament-style)
- **Analytics**: User stats, bet analytics
- **Quality of Life**: Filters, search, sorting options

Please suggest:
1. **New Features** that would enhance the social betting experience
2. **UX Improvements** to make the app more intuitive and engaging
3. **Gamification Elements** to increase user retention
4. **UI Polish Ideas** to make it feel more premium and native
5. **Technical Improvements** that would enhance performance or user experience

