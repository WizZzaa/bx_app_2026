# User data storage inventory

Read-only source inventory for the current Desktop renderer and the Web workspace that imports it. This document records names and code contracts only: no stored values, browser profiles, production rows or user files were read.

## localStorage

### Exact keys

| Area | Keys |
| --- | --- |
| Authentication and device | `bx_installation_token_v1`, `bx_needs_telegram_migration`, `bx_pending_ref`, `bx_pin_hash`, `bx_pin_enabled`, `bx_pin_attempts`, `bx_plan_cache` |
| Workspace and preferences | `bx_active_company`, `bx_theme`, `bx_sidebar_collapsed`, `bx_admin_sidebar`, `bx_ui_density`, `bx_font_scale`, `bx_translator_workspace_mode_v2`, `bx_document_workspace_view_mode_v2`, `bx_notify_days`, `bx_idle_lock`, `bx_tools_last`, `bx_calc_last`, `bx_last_backup_at`, `bx_site_session_last_url`, `bx_ai_provider`, `bx_ollama_host`, `bx_ollama_model` |
| Calendar and navigation | `bx_cal_show_tax`, `bx_cal_show_tasks`, `bx_cal_show_holidays`, `bx_planner_open_event_id`, `bx_currency_extra_codes` |
| User-entered local data | `bx_company_requisites`, `bx_support_contact_name`, `bx_support_contact_phone`, `bx_support_remote_id`, `bx_support_draft`, `bx_translation_history`, `bx_translation_history_enabled`, `bx_translator_tutorial_v2`, `bx_calc_history_v1`, `bx_calc_prefill`, `bx_checklist_templates`, `bx_inn_check_history`, `bx_n2w_history`, `bx_quick_notes`, `bx_network_checker_custom_sites`, `bx_widget_translation_history`, `bx_local_chats` |
| Offline snapshots and notifications | `bx_boards_cache_v1`, `bx_tasks_cache_v2`, `bx_events_cache_v1`, `bx_kb_cloud_cache`, `bx_kb_category_cache`, `bx_services_cloud_cache`, `bx_cached_indicators`, `bx_notified_events`, `bx_read_notification_ids`, `bx_shown_notification_ids` |
| Bix | `bx_bix_state_v1`, `bx_bix_settings_v1`, `bx_bix_intro_seen_v1`, `bx_bix_economy_queue_v1` |
| ECP and sync | `bx_ecp_keys`, `bx_ecp_keys_enc`, `bx_sync_queue_v1` |

The table contains 63 exact application keys.

### Dynamic key families

| Pattern | Qualifier |
| --- | --- |
| `bx_local_msgs_${chatId}` | Local AI messages by chat ID |
| `bx_cards_cache_${boardId}` | Planner cards by board ID |
| `bx_company_details_${companyId}` | Organization details by company ID |
| `bx_${kind}_favorites_v1` | `kind` is currently `calculator` or `utility`, producing `bx_calculator_favorites_v1` and `bx_utility_favorites_v1` |
| `sb-${projectRef}-auth-token` | Supabase Auth default persistent-session key. With the bundled fallback project it is `sb-bqejnrsuvcscimyptxwl-auth-token`; another configured Supabase hostname produces another project reference. |

Legacy cleanup code also recognizes the prefixes `bx_cache_*`, `bx_transactions_*` and `bx_employees_*`. Prefix recognition is not evidence that every possible matching key currently exists.

## sessionStorage

The shared renderer uses one dynamic family:

```text
bx_calc_rate_ack_v1:${calculatorId}:${fingerprint}
```

It stores the string `1` after the user manually confirms calculator regulatory values and expires with the browser/Electron session.

## IndexedDB / Dexie

Database: `BusinessBxDatabase`, schema version `4`.

| Store | Index declaration |
| --- | --- |
| `transactions` | `id, company_id, date, type` |
| `employees` | `id, company_id, full_name, status` |
| `counterparties` | `id, company_id, inn, name` |
| `conflicts` | `id, entity, targetId` |
| `templates` | `id, category, title` |
| `exchange_rates` | `code, date` |

## Offline queues and Cache Storage

- `bx_sync_queue_v1` stores unsynchronized `transactions` and `employees` insert/update/delete operations. It must not be cleared or replayed without idempotency and conflict tests.
- `bx_bix_economy_queue_v1` stores pending Bix economy operations, is capped at 100 records and filters replay by user ID.
- Current App/Web source contains no application service worker or direct `CacheStorage` API use. The Electron site-session utility clears only the isolated partition of a user-selected external origin.

## IP Web/PWA boundary

The canonical IP runtime source and a live browser snapshot are not present in this repository/worktree, so the following contracts come from the migration registry and design audit, not from a new inspection of stored data:

```text
ip_profile
ip_reminders
ip_calc_history
ip_hidden_presets
ip_ai_messages
Cache Storage: ip-shell-v1
```

No `ip_*` value was read, copied, renamed, transformed or cleared. These keys and the PWA cache remain frozen until the canonical source, anonymized counts, a recoverable backup, export/restore, dual-read, idempotency and rollback are available.

## Retention rules

- Opening Planner must not delete `bx_boards_cache_v1` or `bx_cards_cache_*`; caches may be replaced only after a successful canonical refresh/reconciliation.
- `bx_support_draft` remains stored through entitlement checks and failed submissions. It is cleared only after ticket creation returns a confirmed ticket ID.
- The Settings export is not a complete backup of every key, queue or Dexie store and must not be used as authorization for a storage migration.
- No prefix clear, schema change or key rename is safe without exact counts, a recoverable backup, old/new readers and a tested rollback.

## Source references

- `src/renderer/lib/db/localDb.ts`
- `src/renderer/lib/db/syncQueue.ts`
- `src/renderer/lib/bixEconomy.ts`
- `src/renderer/lib/db/supabase.ts`
- `src/renderer/pages/Planner.tsx`
- `src/renderer/pages/Support.tsx`
- `src/renderer/components/calculators/RegulatoryRateGate.tsx`
- `../../docs/storage-migration-registry.json`
