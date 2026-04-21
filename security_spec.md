# Security Specification

## Data Invariants
1. `entries` are absolutely immutable. Updates are rejected.
2. A `statehead` can only read/write entries for their assigned `branchId`, determined by a relational check on `/databases/$(database)/documents/users/$(request.auth.uid)`.
3. Only `admin`s can create, update, or delete `branches`.
4. Users cannot modify their own `role` or `branchId` directly to elevate privileges.

## The "Dirty Dozen" Payloads
1. **Payload 1 (Spoof UID)**: A statehead creating an entry where `authorId` does not match `request.auth.uid`.
2. **Payload 2 (Admin Elevation)**: A statehead attempting to update their `users/{userId}` document with `role: 'admin'`.
3. **Payload 3 (Immutable Edit)**: A statehead attempting `update` on `branches/{branchId}/entries/{entryId}`.
4. **Payload 4 (Cross-Branch Write)**: A statehead with `branchId == 'branch_1'` trying to write an entry into `/branches/branch_2/entries/{entryId}`.
5. **Payload 5 (Future Time Travel)**: Client sending a future timestamp instead of `request.time` for `createdAt`.
6. **Payload 6 (Massive Array Injection)**: Sending 5,000 items in the `items` array to exhaust database limits.
7. **Payload 7 (Admin Blanket Query)**: An admin doing an unbound list query without rule validation evaluating their identity.
8. **Payload 8 (Statehead Global Query)**: A statehead running an unbound list query on all entries across the app.
9. **Payload 9 (ID Poisoning)**: Sending a 1.5MB string as `branchId` or `entryId`.
10. **Payload 10 (Ghost PII Field)**: Sending an extra field like `ssn` on User creation that bypasses the schema.
11. **Payload 11 (Orphan Entry)**: Creating an entry where the parent `branchId` does not exist in the database.
12. **Payload 12 (Unauthorized Branch Mod)**: A statehead trying to change the `monthlyTarget` of a branch.

## TDD Acceptance
* Tests will assert `PERMISSION_DENIED` for all listed payload attempts.
