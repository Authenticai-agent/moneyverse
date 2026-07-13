# Data Retention

| Data | Default retention | Deletion trigger | Backup handling |
|---|---|---|---|
| Failed login security logs | 90 days | Automatic expiry | Expires with backup lifecycle |
| Active session records | Session life plus security window | Revocation/expiry | Restored sessions remain revoked where possible |
| Child lesson progress | Account life or lawful school need | Authorized deletion | Purged after documented backup expiry |
| Virtual ledger entries | Account life | Authorized deletion | Purged after documented backup expiry |
| Audit events | Policy-defined security period | Retention expiry | Protected, then expired |
| Refresh-token hashes | Session life plus investigation window | Revocation/expiry | Never restored as active |
| Data exports | Short download window | Automatic expiry | Excluded from long-term backup where possible |
| Plaid tokens | Connection life | Disconnect/consent withdrawal | Cryptographic deletion and backup policy |
| LLM request logs | Disabled by default; minimized if enabled | Short expiry | No child free text by default |

Every data type requires an owner, classification, retention basis, deletion method, and verification test.
