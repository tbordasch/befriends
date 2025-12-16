# Project Brief: BetFriends
**App Type:** Social Betting Platform (P2P)
**Vibe:** Playful, Modern, Clean, Social (Not a corporate gambling look)
**Target Audience:** Friends who want to bet on everyday things (games, dares, real-life events).

## 1. Core Concept
"BetFriends" allows users to create custom betting groups with friends. Unlike sports betting, the topics are user-generated (e.g., "I bet you can't eat 10 burgers").
- **Currency:** "Points" (Virtual currency for now, prepared for real money later).
- **Winner Determination:** Democratic process. Participants vote on who won. Majority rules.
- **Proof:** Users upload images/videos to prove they won.

## 2. Tech Stack & Design System
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Component Library:** shadcn/ui (already initialized)
- **Icons:** Lucide-React
- **Database (Planned):** Supabase (PostgreSQL) or similar for real-time updates.
- **Auth:** Google OAuth & Email Magic Link.

## 3. Design Guidelines
- **Look & Feel:** Clean but fun. Use rounded corners, soft shadows, and a vibrant primary color (e.g., Indigo or Violet) against a clean background (Zinc/Slate).
- **Navigation:** Mobile-first approach. Bottom navigation bar for mobile, Sidebar for desktop.

## 4. Key Features (Roadmap)

### Phase 1: Foundation & UI Shell
- Setup global layout with Navigation (Dashboard, Create Bet, Profile).
- Design the "Bet Card" component (showing participants, pot size, status).
- Mock "Points" system in the UI (User starts with 1000 pts).

### Phase 2: Core Betting Logic (Frontend)
- **Create Bet Flow:**
  - Input: Title, Description, Stake (Points), Deadline.
  - Action: "Invite Friends" (via Link/Code or Friend List).
- **Bet Detail View:**
  - Chat/Activity feed.
  - "Upload Proof" section (UI only for now).
  - "Vote" buttons (appears after deadline).

### Phase 3: Social Features
- Friend System: Add friend by username/email.
- User Profile: Avatar, Bio, Win/Loss stats.

## 5. Data Model (Mental Draft)
- **User:** id, name, email, avatar_url, current_points.
- **Bet:** id, title, description, creator_id, stake_amount, status (open, active, voting, completed), deadline.
- **BetParticipant:** user_id, bet_id, status (accepted, declined).
- **Proof:** bet_id, user_id, image_url.
- **Vote:** bet_id, voter_id, voted_for_user_id.

## 6. Specific Rules
- **Voting:** The pot is distributed only when >50% of participants agree on the winner.
- **Privacy:** Bets can be private (invite only).

---
**Current Task:**
Please act as a Senior Frontend Developer. Rely heavily on `shadcn/ui` components to move fast. Keep the code modular.