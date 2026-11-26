# Catalogue schema · version 1

The local JSON file has a version number and a `models` array. `scripts/validate.mjs` validates data before pages are generated. The build escapes text and accepts HTTPS source URLs. Stable public model IDs double as page slugs. Preserve published IDs when revising specifications.

| Field | Type and meaning |
|---|---|
| `id` | Unique lowercase slug for a documented platform |
| `manufacturer`, `name`, `series`, `platform`, `summary` | Display identity, processor family or generation and concise documented summary |
| `machineTypes` | Lenovo’s four-character machine types checked in the linked support source. An empty list means none verified. Codes shown may be a subset. |
| `aliases` | Alternate spellings for the same platform only. Search also recognises the listed machine type and a ten-character MTM beginning with that type. |
| `sources` | Map from source ID to `title`, HTTPS `url`, applicable `section` and ISO `checked` date. The `identity` key is required. |
| `memory` | `type`, `speed`, replaceable `sockets`, `module` format, `note`, `source` key and `configurations` array |
| `memory.configurations[]` | Stable row `id`, `solderedGB`, `documentedMaxGB`, `factoryGB`, `independentTestGB`, optional `independentSource` and `note`. A non-null independent figure requires its own source. |
| `storage` | `positions`, a `rule` for configuration restrictions, `absoluteLimitGB` and a `source` key |
| `storage.positions[]` | `position`, `form`, `interface`, `link` (documented drive or slot connection), documented `offering`, `note` and claim `source` key. Repeated position labels describe alternative drive options where the rule specifies exclusivity. |
| `notes` | Additional source-backed notes or evidence limitations |

Use `null` for unknown scalars or unrecorded capacity evidence. Zero sockets means fully soldered. Zero soldered GB means all installed RAM is socketed. Use an empty array for missing configuration or position records. The form value `M.2` records a verified family with unknown length and matches the Unknown details filter. Use `null` if the family itself is unknown. Keep optional or configuration-specific details alongside the affected claim.

A model groups variants only where the primary source documents one platform. Keep each soldered capacity in a separate row with its own supported total. When a different generation, CPU platform or machine type has conflicting hardware, create its own sourced model record. Never combine incompatible numbers into a universal maximum.

## Worked example

To reproduce the existing E14 Gen 2 (Intel) record in an empty catalogue, read its Lenovo PSREF pages 2–3 and the linked support heading. Add one object with ID `thinkpad-e14-gen-2-intel`, machine types `20TA` and `20TB`, and the CPU designation Intel Core 11th Gen. Use the two sources and their actual checked dates.

Enter DDR4 at 3200 MT/s with one SO-DIMM socket. Its memory configuration row has ID `socketed`, `solderedGB: 0`, `documentedMaxGB: 32`, `factoryGB: null` and `independentTestGB: null`. In storage, make one row for the 2242 PCIe 3.0 ×4 slot and one for the 2280 PCIe 4.0 ×4 slot. Put 512 GB and 1 TB in the respective Lenovo offering strings. Use `absoluteLimitGB: null` and record the note about Lenovo’s PCIe 3.0 ×4 factory drive listings for the 2280 slot. The complete example is in [the catalogue](../data/catalogue.json). Build and inspect the new detail page, then test alias search and comparison.
