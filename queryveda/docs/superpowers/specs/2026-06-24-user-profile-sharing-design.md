# User Profile & Stats Sharing — Design Spec

## Goal

Let users share their QueryVeda progress with others via a shareable profile link that shows stats, achievements, and skill mastery — with an auto-generated OG image for social media previews.

## Privacy Model

Profiles are **private by default**. Sharing is opt-in via a unique share token.

- `/profile/[userId]` is only accessible to the owning user (logged in). All other visitors see "This profile is private."
- When a user opts to share, a random UUID `share_token` is generated and stored in `user_profiles`.
- The public URL is `/profile/share/[shareToken]` — anyone with this URL can view the read-only stats page.
- The share token can be regenerated (invalidates old links) or revoked (sets token to null, disabling sharing).
- Guessing or iterating user IDs gives no access to any profile data.

## Database

### New table: `user_profiles`

| Column | Type | Constraints |
|--------|------|-------------|
| `user_id` | uuid | PK, references auth.users |
| `display_name` | text | nullable — null means use deterministic anonymous name |
| `share_token` | text | unique, nullable — null means sharing is disabled |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | default now() |

### RLS Policies

- **SELECT:** public (needed for shared profile pages and OG image endpoint)
- **INSERT/UPDATE:** only where `auth.uid() = user_id`
- **DELETE:** only where `auth.uid() = user_id`

Note: The SELECT being public is safe because `user_profiles` only contains display_name and share_token — no sensitive data. The actual stats come from `user_progress`, which is queried by share_token lookup (not by iterating user IDs).

### Stats Computation

All stats are computed on-the-fly from the existing `user_progress` table — no new stats tables needed:

1. **Solved count:** count rows where status = 'solved'
2. **Completion %:** solved / 75 * 100
3. **Difficulty breakdown:** join with question metadata (Easy/Medium/Hard counts)
4. **Topic mastery:** join with question metadata (5 topics, solved/total per topic)
5. **Achievements:** apply the same 13 achievement rules from `lib/storage.ts` to the fetched data
6. **Streak:** compute from solved_at dates (consecutive days)
7. **Active days:** count distinct dates from solved_at
8. **Member since:** min(solved_at) or user created_at

## Routes

### `/profile/[userId]` — Private profile page

- **Auth required:** must be logged in as the owning user
- If not the owner (or not logged in): show "This profile is private" with a link back to home
- If the owner: show the full profile page (same layout as the shared view) + a "Share My Profile" section with:
  - If share_token exists: show the shareable URL, "Copy Link" button, "Regenerate Link" button, "Revoke Link" button
  - If share_token is null: show "Share My Profile" button that generates a token

### `/profile/share/[shareToken]` — Public shared profile page

- **No auth required**
- Looks up `user_profiles` by share_token
- If token not found or null: show "This link is no longer valid"
- If found: fetch user_progress for that user_id, compute stats, render the profile

### `/api/og/profile/[shareToken]` — OG image endpoint

- Uses Next.js `ImageResponse` from `next/og`
- Returns a 1200x630 PNG image
- Looks up user by share_token, computes stats, renders the card

## Profile Page UI

Layout (top to bottom):

### 1. Header Card
- Avatar (from OAuth metadata, or a default user icon)
- Display name (from `user_profiles.display_name`, fallback to deterministic anonymous name)
- "Member since" date
- Share button (copy URL to clipboard with "Copied!" toast) — only on shared view

### 2. Stats Row
4 cards in a horizontal row:
- **Problems Solved:** e.g. "42/75"
- **Completion:** e.g. "56%"
- **Current Streak:** e.g. "8 days"
- **Active Days:** e.g. "23"

### 3. Difficulty Breakdown
3 progress bars:
- Easy: 20/25
- Medium: 15/25
- Hard: 7/25

### 4. Skill Radar
Reuse the existing `SkillRadar` component (5-axis polygon chart showing mastery % per topic: JOINs, Windows, Cumulative, Sequences, Analytics).

### 5. Achievements
Grid of achievement badges. Earned ones shown in full color, unearned ones greyed out / locked. Reuse existing achievement display logic.

## Edit Profile

On the existing `/progress` page, add a small section at the top (only for logged-in users):
- Text input for display name (max 30 chars, alphanumeric + spaces)
- Save button
- Creates `user_profiles` row on first save if it doesn't exist (upsert)

On `/profile/[userId]` (own profile), show a subtle "Edit Display Name" link pointing to `/progress`.

## OG Image Card

**Endpoint:** `/api/og/profile/[shareToken]`
**Dimensions:** 1200x630

**Layout (dark background):**
- **Left column (~40%):** Avatar circle, display name, "QueryVeda" branding text
- **Right column (~60%):**
  - Top row: Solved count (large number), Completion %, Streak days
  - Middle row: Difficulty bars (Easy/Medium/Hard with solved/total counts)
  - Bottom row: Top 3-4 earned achievement names as pill badges

**Skill mastery:** Shown as 5 horizontal bars (one per topic) instead of a radar polygon, because Satori (the OG image renderer) doesn't support SVG `<polygon>`. Horizontal bars convey the same data reliably.

**Styling:** Inline CSS only (Satori requirement). Dark gradient background, white text, accent color highlights matching the app's primary palette.

**Meta tags on profile pages:**
```html
<meta property="og:image" content="/api/og/profile/[shareToken]" />
<meta property="og:title" content="[Display Name]'s QueryVeda Profile" />
<meta property="og:description" content="Solved 42/75 problems · 8-day streak · 56% completion" />
```

## What This Does NOT Include

- Social-specific share buttons (Twitter, LinkedIn, etc.) — the OG image handles previews; users just copy the URL
- Profile customization beyond display name (no bio, no custom avatar upload)
- Excel skill tree progress on the profile (SQL-only for now)
- Leaderboard integration (profiles and leaderboard remain independent)
- Email notifications or activity feed
