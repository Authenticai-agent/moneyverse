# Vendor Register

| Vendor | Purpose | Data shared | Child data | Enabled | Review status |
|---|---|---|---|---|---|
| Hosting provider | Application hosting | Encrypted application data | Possible | TBD | Required |
| Database provider | PostgreSQL hosting | Application records | Possible | TBD | Required |
| Error reporting | Diagnostics | Redacted errors | No by policy | Disabled | Required |
| Email provider | Adult account email | Adult email | No child email by default | Disabled | Required |
| Plaid | Future financial data | Adult-authorized financial data | No credentials | Disabled | Future review |
| LLM provider | Future optional generation | Minimized prompts | Restricted | Disabled | Future review |
| Payment provider | Future subscription | Adult payment tokens | No raw card data | Disabled | Future review |

No SDK or provider may be added without updating this register.
