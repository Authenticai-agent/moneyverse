# Future Plaid Integration

## Default state

`PLAID_ENABLED=false`  
`BANK_CONNECTIONS_ENABLED=false`  
`REAL_TRANSACTION_IMPORT_ENABLED=false`

## Allowed initial future scope

- Adult-authorized Link flow
- Read-only balances
- Read-only transaction sync
- Educational categorization
- Easy disconnection and deletion

## Security requirements

- Adult authentication and explicit consent
- Link token generated server-side
- Public token exchanged server-side
- Access token encrypted with managed keys
- Access token never returned to browser
- Provider products minimized
- Sandbox first
- Verified, replay-protected, idempotent webhooks
- No production credentials in local development
- No actual balances in leaderboards
- No child social status based on real money
- Separate simulated and imported data models

## Prohibited default scope

- Payment initiation
- Money movement
- Child credential collection
- Credit decisions
- Investment recommendations

## Disable behavior

When disabled, no routes, UI, jobs, SDK initialization, secrets, or network calls exist.
