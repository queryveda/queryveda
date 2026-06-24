# Excel Progress on Profile Page — Design Spec

## Goal

Add Excel skill tree progress and achievements to the profile page (both owner and shared views), computed from Supabase's `skill_tree_progress` table.

## Data Source

Query the existing `skill_tree_progress` table with `track = "excel"` filter. Map `exercise_id` values back to `excelSkillTreeNodes` to determine which node each exercise belongs to and whether it's a conceptual question or hands-on exercise.

No new tables or columns needed — the Excel cloud sync already writes to this table with `track: "excel"`.

## ProfileStats Changes

Extend the `ProfileStats` interface in `lib/profile.ts` with:

```typescript
excelStats: {
  totalCompleted: number;    // conceptual + exercises completed
  totalItems: number;        // total conceptual + exercises across all nodes
  starredCount: number;      // nodes at 100% mastery
  nodeMasteries: { nodeId: string; title: string; completed: number; total: number }[];
  achievements: Achievement[];
}
```

## Stats Computation

In `computeProfileStats`, after computing SQL stats, query `skill_tree_progress` where `user_id` matches and `track = "excel"`. For each completed row, determine if it's a conceptual question or exercise by checking against `excelSkillTreeNodes` data. Compute:

1. **Per-node mastery:** For each node, count completed conceptual questions and exercises (including bonus) vs total
2. **Total completed/items:** Sum across all nodes
3. **Starred count:** Nodes where completed === total
4. **6 Excel achievements:** Same rules as `app/progress/page.tsx` lines 76-123:
   - First Formula (1+ completed)
   - Warmup King (10+ conceptual)
   - Cell Master (cell-references node starred)
   - Spreadsheet Student (50% completed)
   - Triple Star (3+ starred)
   - Excel Grandmaster (all nodes starred)

## Profile Page UI

Add two sections below the existing SQL content in `profile-client.tsx`:

1. **Excel Learning Progress** — Same layout as the progress page: node title + `MasteryBar` for each node, with a total completed/items subtitle
2. **Excel Achievements** — Reuse the existing `Achievements` component with `title="Excel Achievements"`

## Share Card

Add a single line to the canvas card: "Excel: X/Y completed" next to the existing SQL stats.

## What This Does NOT Include

- Excel skill radar (no topic breakdown for Excel — it's node-based)
- Excel streak tracking (not tracked separately)
- Changes to the progress page (already has Excel sections)
