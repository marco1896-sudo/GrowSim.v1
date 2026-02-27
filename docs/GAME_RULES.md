# GrowSim – Game Rules (Simulation V1)

## Event schema (observed + normalized)
Events are loaded from `./data/events.json` (fallback `./events.json`) and normalized into:
- `id`
- `title`
- `description`
- `chancePerHour` (if `>1` treated as percent, else probability)
- `durationHours` (optional)
- `effectsPerMinute` (optional)
- `condition` (`all`/`any` rules)
- `actions[]` with `id`, `label`, `effects`, `resolvesEvent`, optional `delayed[]`

Supported source aliases:
- `eventId` or `id`
- `text` / `description` / `body`
- `choices` or `actions`

## Core tick model
- Real tick: `1000ms`
- Ingame: `1 minute / tick`
- Engine pauses when event modal is open (`pause reason: modal`)

## Plant base rules (per minute)
All stats are clamped to `0..100`:
- `water -= 0.18`
- `nutrition -= 0.12`
- `stress += 0.10` if `water < 30` OR `nutrition < 30`
- `stress += 0.06` if `water < 15` OR `nutrition < 15`
- `stress -= 0.08` if `water > 55` AND `nutrition > 55`
- `health -= 0.10` if `stress > 70`
- `health -= 0.18` if `stress > 90`
- `health += 0.06` if `water > 45` AND `nutrition > 45` AND `stress < 40`
- `growth += 0.10` if `water > 45` AND `nutrition > 45` AND `stress < 55`
- `growth += 0.04` if `water > 35` AND `nutrition > 35` AND `stress < 70`
- `growth -= 0.06` if `water < 20` OR `nutrition < 20`
- In `flower` stage: positive growth gain multiplied by `0.5`

## Stage transitions
- `seedling -> veg` when `growth >= 35`
- `veg -> flower` when `growth >= 70`

## Risk model (0..100)
- `+40` if `water < 25`
- `+40` if `nutrition < 25`
- `+30` if `stress > 75`
- `+30` if `health < 35`
- `+20` if active/current event exists
- Clamped `0..100`

## UI state mapping
- `warning` if `risk > 60` OR `water < 30` OR `nutrition < 30` OR `stress > 70`
- `critical` if `health < 25` OR `stress > 90` OR `risk > 85`

## Event spawning rules
- Roll interval: every `10 ingame minutes`
- Global cooldown after trigger: `20 minutes`
- While `currentEvent` (modal) or `activeEvent` exists: no new spawn
- Effective roll chance per event:
  - `effectiveChance = chancePerHour * (10 / 60)`
- If multiple candidates pass, one random candidate is chosen

## Event runtime handling
- Duration event (`durationHours > 0`):
  - Creates `activeEvent` with `remainingMinutes`
  - Applies `effectsPerMinute` every minute
  - Ends on timer (`remainingMinutes <= 0`) or resolving action
- Instant event:
  - Opens modal and waits for action
- Actions:
  - Apply one-shot `effects`
  - Optional delayed effects queued by `inMin`
  - `resolvesEvent` controls immediate event closure

## Ads and limits
- Daily limit: `6`
- Daily reset keys in state: `adViewsToday`, `adDayStamp (YYYY-MM-DD)`
- Reward types:
  - `analysis`: unlock analysis
  - `rescue`: only if `health <= 40` or `uiState == critical`, applies `health +30`, `stress -18`
  - `skip-time`: triggers fast-forward `+30` minutes

## Fast-forward
- `+30 Min Boost` runs 30 minute simulation steps without per-step render
- Uses plant + delayed + active-event systems; suppresses new spawn during fast-forward

## Game over
- Trigger: `health <= 0`
- Logs game over, resets run state, preserves short history + telemetry.
