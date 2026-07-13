# Backup and Restore

## Requirements

- Encrypted backups
- Documented retention
- Point-in-time recovery where supported
- Separate backup credentials
- Restore testing
- Recovery point objective
- Recovery time objective
- Corruption-detection process
- Accidental-deletion process

## Restore validation

A restore test must confirm:

- Schema integrity
- Authorization and RLS remain active
- Revoked sessions do not become valid
- Deleted integrations do not reconnect
- Audit records remain protected
- Application starts with valid configuration
