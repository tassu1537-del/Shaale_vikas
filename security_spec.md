# Shaale-Vikas Security Specification

## Data Invariants
1. A **Need** must belong to an existing school.
2. Only the **Headmaster** of a school can create or update needs for that school.
3. **Alumni** can create **Pledges** for open needs. They cannot modify or delete other people's pledges.
4. **Needs** cannot have a negative `costEstimate` or `amountCollected`.
5. **Users** can only edit their own profile.

## The "Dirty Dozen" (Targeted Vulnerability Scenarios)
1. **Identity Spoofing**: An alumnus attempts to create a Need on behalf of a Headmaster.
2. **State Shortcutting**: A user attempts to mark a Need as "completed" without actual fulfillment.
3. **Ghost Field Injection**: Adding an `isVerified: true` field to a User profile during registration.
4. **Cross-School Sabotage**: Headmaster A attempts to delete a Need from School B.
5. **Price Manipulation**: An alumnus attempts to change the `costEstimate` of a Need they are pledging to.
6. **Negative Pledge**: Attempting to pledge a negative amount to reduce total collected.
7. **PII Leak**: Unauthorized user attempting to read the private contact info of donors (if we had any private fields, currently we use names).
8. **Resource Exhaustion**: Sending a 1MB string as a `needId`.
9. **Timestamp Fraud**: Setting a `createdAt` in the future.
10. **Orphaned Pledge**: Creating a pledge for a non-existent Need.
11. **Relational Sync Bypass**: Updating `amountCollected` on a Need without creating a corresponding Pledge document (if we enforced balance).
12. **Status Locking Bypass**: Modifying a Need that is already marked "completed".

## Red Team Evaluation Strategy
- Use `isValidId()` for all ID path variables.
- Use `affectedKeys().hasOnly()` for all update actions.
- Enforce `request.auth.uid` matches owner fields.
- Use `exists()` and `get()` to verify relational integrity.
