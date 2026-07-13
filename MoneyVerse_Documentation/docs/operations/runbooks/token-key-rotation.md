# Token Key Rotation Runbook

1. Generate new key in managed secrets.
2. Publish verification material with new key ID.
3. Begin signing new tokens with new key.
4. Retain old verification key for the minimum overlap.
5. Revoke affected sessions if compromise is suspected.
6. Remove old key after expiry window.
7. Audit and document rotation.
