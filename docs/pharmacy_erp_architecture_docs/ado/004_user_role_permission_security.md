# Phase 4 — User, Role, Permission & Security Management

## 1. Objective

Establish the complete application security and authorization foundation for the Pharmacy ERP.

This phase builds on the security architecture established in Phase 1 and the Party/Employee foundation established in Phase 3.

The intended model is:

```text
User
  │
  ├── UserRole
  │      │
  │      └── Role
  │             │
  │             └── RolePermission
  │                    │
  │                    └── Permission
  │
  └── Employee / Party
```

The security model must remain distinct from business roles.

```text
Business role:
Customer
Supplier
Doctor
Employee

Security role:
Administrator
Pharmacist
Cashier
Manager
Inventory Manager
...
```

A Party's business role does not automatically grant application permissions.

---

# 2. Scope

## In Scope

- User master
- User account lifecycle
- Employee-to-user association
- Username/login identifier
- Password credential management
- User status
- Role master
- Permission master
- Role-permission mapping
- User-role mapping
- Permission checks
- Authentication foundation
- Authorization foundation
- Session/token handling contract
- Login/logout
- Password change
- Password reset workflow foundation
- Account lock/disable rules
- Branch/company access scope
- Permission-aware API guards
- Permission-aware UI
- Security audit events
- Security error handling
- Security testing
- Brute-force/rate-limit protection foundation
- Secure secret/configuration handling

## Out of Scope

The following are intentionally deferred or handled elsewhere:

- Party master creation
- Customer/Supplier/Doctor/Employee master creation
- Purchase authorization business rules
- Sales authorization business rules
- Inventory-specific permissions
- Financial transaction authorization rules
- Full audit-reporting UI
- External identity providers unless explicitly added later
- Advanced SSO/OIDC integration unless separately approved

---

# 3. ADO Hierarchy

```text
EPIC-004 — User, Role, Permission & Security Management
│
├── FEAT-038 — User Account Management
├── FEAT-039 — Employee/User Association
├── FEAT-040 — Authentication
├── FEAT-041 — Password & Credential Management
├── FEAT-042 — Role Management
├── FEAT-043 — Permission Management
├── FEAT-044 — Role-Permission Management
├── FEAT-045 — User-Role Management
├── FEAT-046 — Authorization & Access Control
├── FEAT-047 — Company & Branch Access Scope
├── FEAT-048 — Session & Token Management
├── FEAT-049 — Security Monitoring & Audit
├── FEAT-050 — Security Hardening
└── FEAT-051 — Security Integration Foundation
```

---

# 4. Epic

## EPIC-004 — User, Role, Permission & Security Management

### Description

Provide secure authentication and fine-grained authorization for the Pharmacy ERP.

The system must establish who the user is, what roles they have, what permissions those roles provide, and what company/branch scope they can access.

### Business Value

Security must be centralized rather than implemented independently in each business module.

Later modules should be able to ask:

```text
Can this user perform this operation?
```

without implementing their own authorization framework.

### Epic Completion Criteria

- User accounts can be created and managed.
- Users can be associated with Employees.
- Roles can be created and managed.
- Permissions can be defined.
- Roles can be assigned permissions.
- Users can be assigned roles.
- Authentication is implemented.
- Password security is implemented.
- Sessions/tokens are handled securely.
- API authorization is enforced.
- UI authorization is enforced.
- Company/branch scope is enforced.
- Account lifecycle is supported.
- Security events are auditable.
- Security hardening is implemented.
- Automated security tests pass.

---

# 5. Feature: User Account Management

## FEAT-038 — User Account Management

## US-085 — Create user account

**User Story**

As an authorized administrator, I want to create a user account so that an employee can access the ERP.

### Acceptance Criteria

1. Authorized administrators can create users.
2. Username/login identifier is unique.
3. Required user information is validated.
4. User status is initialized according to configured rules.
5. User account is associated with the appropriate Employee where required.
6. Password credentials are never stored in plaintext.
7. User creation is auditable.
8. Unauthorized users cannot create accounts.

### Tasks

**TASK-554 — Define User model requirements**

**TASK-555 — Define User identity and login fields**

**TASK-556 — Define User status model**

**TASK-557 — Implement User Prisma model**

**TASK-558 — Define User indexes and unique constraints**

**TASK-559 — Create User migration**

**TASK-560 — Implement User create DTO**

**TASK-561 — Implement User validation**

**TASK-562 — Implement User service**

**TASK-563 — Implement User create API**

**TASK-564 — Implement User creation UI**

**TASK-565 — Add User authorization**

**TASK-566 — Add User creation tests**

---

## US-086 — View and search users

### Acceptance Criteria

1. Authorized administrators can search users.
2. Users can be filtered by status.
3. Users can be filtered by role.
4. Users can be filtered by branch/company scope where applicable.
5. Password/hash information is never exposed.
6. Deleted/inactive users follow lifecycle visibility rules.

### Tasks

**TASK-567 — Implement User list API**

**TASK-568 — Implement User search**

**TASK-569 — Implement User status filtering**

**TASK-570 — Implement User role filtering**

**TASK-571 — Implement User scope filtering**

**TASK-572 — Implement User list UI**

**TASK-573 — Implement User pagination/sorting**

**TASK-574 — Add User list tests**

---

## US-087 — Update user account

### Acceptance Criteria

1. Authorized administrators can update permitted user attributes.
2. Login identifier uniqueness is maintained.
3. Security-sensitive changes are validated.
4. Changes are auditable.
5. Optimistic locking is applied where appropriate.

### Tasks

**TASK-575 — Define editable User attributes**

**TASK-576 — Implement User update DTO**

**TASK-577 — Implement User update service**

**TASK-578 — Implement User update API**

**TASK-579 — Implement User edit UI**

**TASK-580 — Implement optimistic-lock handling**

**TASK-581 — Add User update tests**

---

## US-088 — Activate/deactivate/lock user

### Acceptance Criteria

1. Authorized administrators can disable accounts.
2. Disabled accounts cannot authenticate.
3. Locked accounts follow defined security rules.
4. Account state changes are auditable.
5. Historical records remain intact.

### Tasks

**TASK-582 — Define User lifecycle states**

**TASK-583 — Implement User activation**

**TASK-584 — Implement User deactivation**

**TASK-585 — Implement User lock/unlock**

**TASK-586 — Implement User lifecycle API**

**TASK-587 — Implement User lifecycle UI**

**TASK-588 — Add lifecycle audit integration**

**TASK-589 — Add lifecycle tests**

---

# 6. Feature: Employee/User Association

## FEAT-039 — Employee/User Association

## US-089 — Associate user with employee

**User Story**

As an administrator, I want to associate a user account with an Employee so that application access can be tied to a known organizational person.

### Acceptance Criteria

1. A user can reference an Employee where required.
2. The same Employee cannot unintentionally have multiple active user accounts.
3. Employee status is checked.
4. Invalid associations are rejected.
5. Association changes are auditable.

### Tasks

**TASK-590 — Define Employee/User relationship rules**

**TASK-591 — Implement User-to-Employee relationship**

**TASK-592 — Add relationship constraints**

**TASK-593 — Implement Employee selection API**

**TASK-594 — Implement Employee selection UI**

**TASK-595 — Implement association service**

**TASK-596 — Implement association API**

**TASK-597 — Add Employee/User association tests**

---

## US-090 — Handle employee lifecycle impact on user access

### Acceptance Criteria

1. Employee deactivation can trigger the appropriate user-access behavior.
2. Employee termination does not physically delete historical user/security data.
3. Business rules determine whether access is immediately disabled.
4. Changes are auditable.

### Tasks

**TASK-598 — Define Employee-to-User lifecycle rules**

**TASK-599 — Implement employee lifecycle security hook**

**TASK-600 — Implement access-disable behavior**

**TASK-601 — Add lifecycle integration tests**

---

# 7. Feature: Authentication

## FEAT-040 — Authentication

## US-091 — Login to ERP

**User Story**

As an authorized user, I want to securely log in so that I can access ERP functionality according to my permissions.

### Acceptance Criteria

1. Valid credentials allow authentication.
2. Invalid credentials are rejected.
3. Disabled/locked users cannot log in.
4. Authentication failures do not disclose whether username or password was incorrect.
5. Successful authentication establishes a secure session/token.
6. Login event is auditable.
7. Authentication endpoint is protected against abuse.

### Tasks

**TASK-602 — Define authentication flow**

**TASK-603 — Define authentication response contract**

**TASK-604 — Implement credential verification service**

**TASK-605 — Implement login API**

**TASK-606 — Implement authentication guard**

**TASK-607 — Implement frontend authentication service**

**TASK-608 — Implement login UI**

**TASK-609 — Implement authentication state management**

**TASK-610 — Implement login error handling**

**TASK-611 — Add login audit event**

**TASK-612 — Add login tests**

---

## US-092 — Logout from ERP

### Acceptance Criteria

1. Authenticated users can log out.
2. Session/token invalidation follows the selected security strategy.
3. Logout is auditable where appropriate.
4. Protected screens are no longer accessible after logout.

### Tasks

**TASK-613 — Implement logout API**

**TASK-614 — Implement frontend logout**

**TASK-615 — Clear client authentication state**

**TASK-616 — Implement token/session invalidation**

**TASK-617 — Add logout tests**

---

## US-093 — Protect unauthenticated access

### Acceptance Criteria

1. Protected APIs reject unauthenticated requests.
2. Protected UI routes redirect appropriately.
3. Public endpoints are explicitly identified.
4. Authentication cannot be bypassed through direct API calls.

### Tasks

**TASK-618 — Implement global authentication guard**

**TASK-619 — Define public API allowlist**

**TASK-620 — Implement Angular route guard**

**TASK-621 — Implement HTTP authentication interceptor**

**TASK-622 — Add unauthenticated-access tests**

---

# 8. Feature: Password & Credential Management

## FEAT-041 — Password & Credential Management

## US-094 — Store passwords securely

### Acceptance Criteria

1. Plaintext passwords are never stored.
2. Password hashes use an approved adaptive password-hashing algorithm.
3. Password hashes are never returned through APIs.
4. Password verification is centralized.
5. Password handling does not expose secrets through logs.

### Tasks

**TASK-623 — Select password hashing strategy**

**TASK-624 — Implement password hashing service**

**TASK-625 — Implement password verification service**

**TASK-626 — Add password security configuration**

**TASK-627 — Add password hashing tests**

---

## US-095 — Change password

### Acceptance Criteria

1. Authenticated users can change their own password.
2. Current password is verified where required.
3. New password follows policy.
4. Password hash is replaced securely.
5. Existing sessions are handled according to security policy.
6. Password change is audited.

### Tasks

**TASK-628 — Define password policy**

**TASK-629 — Implement password change DTO**

**TASK-630 — Implement password change service**

**TASK-631 — Implement password change API**

**TASK-632 — Implement password change UI**

**TASK-633 — Implement session invalidation strategy**

**TASK-634 — Add password-change audit event**

**TASK-635 — Add password-change tests**

---

## US-096 — Reset forgotten password

### Acceptance Criteria

1. Password reset does not reveal account existence unnecessarily.
2. Reset tokens are short-lived.
3. Reset tokens are single-use.
4. Tokens are securely generated.
5. Password reset is auditable.
6. Reset flow does not expose credentials.

### Tasks

**TASK-636 — Define password reset workflow**

**TASK-637 — Define reset-token model/strategy**

**TASK-638 — Implement secure reset-token generation**

**TASK-639 — Implement reset-token expiry**

**TASK-640 — Implement reset-token consumption**

**TASK-641 — Implement password reset API**

**TASK-642 — Implement password reset UI**

**TASK-643 — Add reset audit events**

**TASK-644 — Add password reset security tests**

---

# 9. Feature: Role Management

## FEAT-042 — Role Management

## US-097 — Create security role

**User Story**

As an administrator, I want to create security roles so that permissions can be grouped into reusable access profiles.

### Acceptance Criteria

1. Authorized administrators can create roles.
2. Role names are unique within the appropriate scope.
3. Role descriptions are supported.
4. Role status is supported.
5. System-critical roles cannot be modified without explicit rules.

### Tasks

**TASK-645 — Define Role model**

**TASK-646 — Implement Role Prisma model**

**TASK-647 — Create Role migration**

**TASK-648 — Implement Role DTOs**

**TASK-649 — Implement Role service**

**TASK-650 — Implement Role API**

**TASK-651 — Implement Role management UI**

**TASK-652 — Add Role authorization**

**TASK-653 — Add Role tests**

---

## US-098 — Update/deactivate role

### Acceptance Criteria

1. Authorized administrators can modify permitted roles.
2. Roles assigned to users cannot be removed in a way that leaves invalid security state.
3. Deactivated roles no longer grant permissions.
4. Historical role assignment information remains available as required.

### Tasks

**TASK-654 — Implement Role update API**

**TASK-655 — Implement Role lifecycle**

**TASK-656 — Implement Role lifecycle UI**

**TASK-657 — Add Role dependency validation**

**TASK-658 — Add Role lifecycle tests**

---

# 10. Feature: Permission Management

## FEAT-043 — Permission Management

## US-099 — Define application permissions

**User Story**

As a security administrator, I want permissions to represent specific application capabilities so that access can be controlled at a granular level.

### Recommended permission structure

```text
<Module>.<Resource>.<Action>
```

Examples:

```text
Party.View
Party.Create
Party.Update
Party.Delete

Customer.View
Customer.Create
Customer.Update

Purchase.View
Purchase.Create
Purchase.Approve

Sales.View
Sales.Create
Sales.Cancel

Inventory.View
Inventory.Adjust

Financial.View
Financial.Post
Financial.Reverse
```

### Acceptance Criteria

1. Permissions have stable identifiers.
2. Permissions are unique.
3. Permission naming follows a consistent convention.
4. Permissions are not arbitrary user-entered strings.
5. Permission definitions can be extended as modules are introduced.

### Tasks

**TASK-659 — Define Permission model**

**TASK-660 — Implement Permission Prisma model**

**TASK-661 — Create Permission migration**

**TASK-662 — Define permission naming convention**

**TASK-663 — Define permission action taxonomy**

**TASK-664 — Define permission module taxonomy**

**TASK-665 — Implement Permission service**

**TASK-666 — Implement Permission API**

**TASK-667 — Implement Permission catalog UI**

**TASK-668 — Add Permission tests**

---

# 11. Feature: Role-Permission Management

## FEAT-044 — Role-Permission Management

## US-100 — Assign permissions to role

### Acceptance Criteria

1. Authorized administrators can assign permissions to roles.
2. Duplicate mappings are prevented.
3. Permission changes take effect according to defined session/cache rules.
4. Role permission changes are auditable.
5. Removing a permission immediately prevents future authorization where required.

### Tasks

**TASK-669 — Define RolePermission relationship**

**TASK-670 — Implement RolePermission Prisma model**

**TASK-671 — Create RolePermission migration**

**TASK-672 — Implement permission assignment service**

**TASK-673 — Implement permission assignment API**

**TASK-674 — Implement role-permission management UI**

**TASK-675 — Implement duplicate mapping prevention**

**TASK-676 — Implement permission cache invalidation strategy**

**TASK-677 — Add role-permission tests**

---

## US-101 — View effective permissions of role

### Acceptance Criteria

1. Administrators can view all permissions assigned to a role.
2. Permissions are grouped by module/resource where useful.
3. Permission changes are reflected correctly.

### Tasks

**TASK-678 — Implement role permission retrieval API**

**TASK-679 — Implement permission matrix UI**

**TASK-680 — Add effective-role-permission tests**

---

# 12. Feature: User-Role Management

## FEAT-045 — User-Role Management

## US-102 — Assign roles to user

### Acceptance Criteria

1. Authorized administrators can assign one or more security roles to a user.
2. Duplicate assignments are prevented.
3. Role status is checked.
4. User's effective permissions are recalculated/refreshed according to policy.
5. Changes are auditable.

### Tasks

**TASK-681 — Define UserRole relationship**

**TASK-682 — Implement UserRole Prisma model**

**TASK-683 — Create UserRole migration**

**TASK-684 — Implement role assignment service**

**TASK-685 — Implement role assignment API**

**TASK-686 — Implement user-role management UI**

**TASK-687 — Implement duplicate assignment prevention**

**TASK-688 — Implement effective-permission refresh**

**TASK-689 — Add user-role tests**

---

## US-103 — Remove role from user

### Acceptance Criteria

1. Authorized administrators can remove a role.
2. The system prevents invalid access states according to business rules.
3. Effective permissions are updated.
4. Changes are auditable.

### Tasks

**TASK-690 — Implement user-role removal service**

**TASK-691 — Implement role removal API**

**TASK-692 — Implement role removal UI**

**TASK-693 — Implement permission refresh**

**TASK-694 — Add role-removal tests**

---

# 13. Feature: Authorization & Access Control

## FEAT-046 — Authorization & Access Control

## US-104 — Enforce permission-based API authorization

**User Story**

As a security administrator, I want APIs to enforce permissions so that users cannot bypass UI restrictions.

### Acceptance Criteria

1. API endpoints can declare required permissions.
2. Missing permissions result in a standardized forbidden response.
3. Authorization is performed server-side.
4. UI restrictions alone are never considered sufficient security.
5. Authorization failures are logged/audited according to security policy.

### Tasks

**TASK-695 — Define authorization decorator/metadata pattern**

**TASK-696 — Implement PermissionGuard**

**TASK-697 — Implement permission resolver**

**TASK-698 — Implement effective-permission evaluation**

**TASK-699 — Implement standardized forbidden response**

**TASK-700 — Add API authorization tests**

---

## US-105 — Enforce permission-based UI authorization

### Acceptance Criteria

1. UI actions can be hidden/disabled based on permissions.
2. UI authorization never replaces backend authorization.
3. Route-level permissions can be defined.
4. Permission state is refreshed after login/role changes.

### Tasks

**TASK-701 — Implement frontend permission service**

**TASK-702 — Implement permission directive**

**TASK-703 — Implement permission-aware route guard**

**TASK-704 — Implement permission-aware button/action handling**

**TASK-705 — Implement frontend permission state refresh**

**TASK-706 — Add UI authorization tests**

---

## US-106 — Support authorization checks at service layer

### Acceptance Criteria

1. Critical business operations can enforce authorization beyond controller routing.
2. Service-level checks are reusable.
3. Authorization cannot be bypassed by internal API misuse.

### Tasks

**TASK-707 — Define service-level authorization strategy**

**TASK-708 — Implement reusable authorization service**

**TASK-709 — Add service authorization examples**

**TASK-710 — Add service-level security tests**

---

# 14. Feature: Company & Branch Access Scope

## FEAT-047 — Company & Branch Access Scope

## US-107 — Restrict user to permitted company/branch

### Acceptance Criteria

1. A user can be restricted to one or more permitted organizational scopes.
2. Scope is evaluated server-side.
3. Users cannot access data from unauthorized branches through direct API calls.
4. Administrative users can have broader scope where explicitly configured.
5. Scope changes are auditable.

### Tasks

**TASK-711 — Define organizational access-scope model**

**TASK-712 — Define User/company relationship rules**

**TASK-713 — Define User/branch relationship rules**

**TASK-714 — Implement access-scope Prisma models**

**TASK-715 — Create access-scope migrations**

**TASK-716 — Implement scope assignment service**

**TASK-717 — Implement scope assignment API**

**TASK-718 — Implement scope management UI**

**TASK-719 — Implement server-side scope resolver**

**TASK-720 — Add scope enforcement to authorization pipeline**

**TASK-721 — Add scope tests**

---

## US-108 — Select active branch context

### Acceptance Criteria

1. Users with multiple branches can select an active branch where permitted.
2. The selected context is validated against authorization.
3. APIs cannot trust a client-supplied branch identifier without authorization validation.
4. Active branch context is consistently available to business modules.

### Tasks

**TASK-722 — Define active branch context contract**

**TASK-723 — Implement branch-context API**

**TASK-724 — Implement frontend branch selector**

**TASK-725 — Implement server-side branch context validation**

**TASK-726 — Add branch-context tests**

---

# 15. Feature: Session & Token Management

## FEAT-048 — Session & Token Management

## US-109 — Secure authenticated session

### Acceptance Criteria

1. Authentication state is represented securely.
2. Tokens/sessions have appropriate expiry.
3. Client storage strategy minimizes exposure.
4. Session expiration is handled gracefully.
5. Logout invalidates the session according to the selected architecture.

### Tasks

**TASK-727 — Select session/token architecture**

**TASK-728 — Define access-token/session lifetime**

**TASK-729 — Define refresh strategy if applicable**

**TASK-730 — Implement token/session validation**

**TASK-731 — Implement session expiration handling**

**TASK-732 — Implement frontend session handling**

**TASK-733 — Add session security tests**

---

## US-110 — Refresh authentication state

### Acceptance Criteria

1. Authentication state can be renewed according to the selected strategy.
2. Expired/invalid refresh credentials are rejected.
3. Revoked users cannot continue refreshing access.
4. Refresh operations are protected from abuse.

### Tasks

**TASK-734 — Implement refresh mechanism**

**TASK-735 — Implement refresh-token/session revocation**

**TASK-736 — Implement frontend refresh handling**

**TASK-737 — Add refresh security tests**

---

# 16. Feature: Security Monitoring & Audit

## FEAT-049 — Security Monitoring & Audit

## US-111 — Audit authentication events

### Events

```text
Login success
Login failure
Logout
Password change
Password reset requested
Password reset completed
Account locked
Account unlocked
Account disabled
Account enabled
Role assigned
Role removed
Permission assigned
Permission removed
Scope changed
```

### Tasks

**TASK-738 — Define security audit event taxonomy**

**TASK-739 — Implement login success audit**

**TASK-740 — Implement login failure audit**

**TASK-741 — Implement logout audit**

**TASK-742 — Implement password audit events**

**TASK-743 — Implement account lifecycle audit events**

**TASK-744 — Implement role/permission audit events**

**TASK-745 — Implement scope audit events**

---

## US-112 — Protect security logs from sensitive information

### Acceptance Criteria

1. Passwords are never logged.
2. Authentication tokens are never logged.
3. Sensitive reset credentials are never logged.
4. Security events contain enough context for investigation without unnecessary sensitive information.

### Tasks

**TASK-746 — Review security logging**

**TASK-747 — Add secret/token redaction**

**TASK-748 — Add password redaction safeguards**

**TASK-749 — Add security-log tests**

---

# 17. Feature: Security Hardening

## FEAT-050 — Security Hardening

## US-113 — Protect authentication against brute-force attempts

### Acceptance Criteria

1. Repeated failed authentication attempts are detected.
2. Appropriate throttling/lockout is applied.
3. Legitimate users can recover access.
4. Security events are recorded.
5. The mechanism does not expose account existence.

### Tasks

**TASK-750 — Define login rate-limit policy**

**TASK-751 — Implement login throttling**

**TASK-752 — Implement account lockout policy**

**TASK-753 — Implement lockout recovery**

**TASK-754 — Add brute-force tests**

---

## US-114 — Protect sensitive APIs

### Acceptance Criteria

1. Authentication endpoints have appropriate rate limits.
2. Password/reset endpoints have stricter controls.
3. Administrative endpoints require appropriate permissions.
4. Request validation is applied.
5. Sensitive operations have appropriate audit events.

### Tasks

**TASK-755 — Define security-sensitive endpoint catalog**

**TASK-756 — Apply endpoint-specific rate limits**

**TASK-757 — Apply strict validation**

**TASK-758 — Add sensitive-operation authorization**

**TASK-759 — Add security endpoint tests**

---

## US-115 — Secure application secrets/configuration

### Acceptance Criteria

1. Password hashing configuration is not hardcoded.
2. Token signing secrets are not committed to source control.
3. Environment-specific secrets are externally configured.
4. Development and production configuration are separated.
5. Sensitive configuration is never returned through APIs.

### Tasks

**TASK-760 — Define secret-management strategy**

**TASK-761 — Remove security secrets from source**

**TASK-762 — Define environment configuration**

**TASK-763 — Add secret validation at startup**

**TASK-764 — Add secret/configuration security tests**

---

# 18. Feature: Security Integration Foundation

## FEAT-051 — Security Integration Foundation

## US-116 — Provide reusable authentication context

### Acceptance Criteria

1. Backend code can retrieve the authenticated user.
2. User ID is available consistently.
3. Employee/Party identity can be resolved where applicable.
4. Active company/branch context can be resolved.
5. Authentication context cannot be forged by client input.

### Tasks

**TASK-765 — Define AuthenticationContext**

**TASK-766 — Implement authenticated-user resolver**

**TASK-767 — Implement Employee/Party resolver**

**TASK-768 — Implement company/branch context resolver**

**TASK-769 — Add authentication-context tests**

---

## US-117 — Provide reusable authorization service

### Acceptance Criteria

1. Any module can ask whether a user has a permission.
2. Authorization logic is centralized.
3. Role/permission mappings are not duplicated in business modules.
4. Scope restrictions can be evaluated consistently.

### Tasks

**TASK-770 — Define authorization service contract**

**TASK-771 — Implement `hasPermission`**

**TASK-772 — Implement `hasAnyPermission`**

**TASK-773 — Implement `hasAllPermissions`**

**TASK-774 — Implement scoped authorization checks**

**TASK-775 — Add authorization service tests**

---

## US-118 — Provide frontend security context

### Acceptance Criteria

1. Frontend can determine authenticated state.
2. Frontend can access current user information required by UI.
3. Frontend can evaluate permissions for UI behavior.
4. Frontend can determine current branch/company context.
5. Sensitive security data is not exposed unnecessarily.

### Tasks

**TASK-776 — Implement frontend security context**

**TASK-777 — Implement current-user state**

**TASK-778 — Implement current-permission state**

**TASK-779 — Implement current-branch state**

**TASK-780 — Add frontend security-context tests**

---

# 19. Security Architecture Rules

## Rule 1 — Backend is authoritative

Never rely on Angular/UI authorization as the actual security boundary.

```text
UI Permission Check
        ↓
UX convenience

API Permission Check
        ↓
Actual security boundary
```

Every protected business operation must be secured server-side.

---

## Rule 2 — Business roles and security roles are different

```text
Party
 └── Business Role
      ├── Customer
      ├── Supplier
      ├── Doctor
      └── Employee

User
 └── Security Role
      ├── Administrator
      ├── Pharmacist
      ├── Cashier
      └── Manager
```

Do not automatically convert a business role into a security role.

---

## Rule 3 — Do not hardcode user-specific permissions

Avoid:

```text
if user.name == "admin"
```

or:

```text
if username == "akshay"
```

Use:

```text
User
  ↓
Role
  ↓
Permission
```

---

## Rule 4 — Permission names must be stable

Prefer:

```text
Purchase.Create
Purchase.Approve
Purchase.Cancel
```

over:

```text
CanCreatePurchase
AllowPurchase
PurchaseCreateButton
```

Permissions represent business capabilities, not UI controls.

---

## Rule 5 — Authorization must support future modules

The authorization layer must be reusable for:

```text
Party
Medicine
Inventory
Purchase
Sales
Prescription
Financial
Loyalty
Reports
Administration
```

---

# 20. Recommended Initial Security Roles

The following are proposed starter roles, not immutable final business rules.

```text
System Administrator
Pharmacy Administrator
Pharmacist
Inventory Manager
Purchase Manager
Sales Manager
Cashier
Accountant
Doctor/Prescription Operator
Read Only
```

The actual role-permission matrix should be finalized with business requirements.

### Tasks

**TASK-781 — Define initial security role catalog**

**TASK-782 — Define initial role descriptions**

**TASK-783 — Define initial permission matrix**

**TASK-784 — Review role/permission matrix with business stakeholders**

**TASK-785 — Seed approved initial permissions**

**TASK-786 — Seed approved initial roles**

**TASK-787 — Seed role-permission mappings**

**TASK-788 — Add seed-data tests**

---

# 21. Default Administrative Bootstrap

A new installation needs a safe mechanism to create the first administrator.

## US-119 — Bootstrap initial administrator

### Acceptance Criteria

1. First-time installation can establish an administrator.
2. Bootstrap credentials are not hardcoded.
3. Bootstrap process is disabled after initialization where appropriate.
4. Initial credentials must be changed according to policy.
5. Bootstrap activity is auditable.
6. Re-running bootstrap cannot accidentally create unlimited administrator accounts.

### Tasks

**TASK-789 — Define first-admin bootstrap strategy**

**TASK-790 — Implement bootstrap detection**

**TASK-791 — Implement secure administrator creation**

**TASK-792 — Implement bootstrap completion marker**

**TASK-793 — Implement mandatory initial credential change**

**TASK-794 — Add bootstrap security tests**

---

# 22. Database Standards

Phase 4 security models must follow the established database conventions.

### Requirements

- BIGINT primary keys.
- UUID external references where applicable.
- Singular table names.
- `createdAt`.
- `updatedAt`.
- `deletedAt` where appropriate.
- `version` where optimistic locking is applicable.
- Explicit foreign keys.
- Unique constraints for login identifiers and security mappings.
- Appropriate indexes.
- SQLite compatibility.
- PostgreSQL compatibility.

### Expected security-related tables

Depending on the finalized schema:

```text
User
Role
Permission
UserRole
RolePermission
UserCompany
UserBranch
PasswordResetToken / equivalent
Session / RefreshToken / equivalent
```

### Tasks

**TASK-795 — Review security schema naming**

**TASK-796 — Review User constraints/indexes**

**TASK-797 — Review Role constraints/indexes**

**TASK-798 — Review Permission constraints/indexes**

**TASK-799 — Review UserRole uniqueness**

**TASK-800 — Review RolePermission uniqueness**

**TASK-801 — Review organizational-scope constraints**

**TASK-802 — Validate SQLite compatibility**

**TASK-803 — Validate PostgreSQL compatibility**

---

# 23. UI Standards

Security administration screens should follow the common UI foundation.

## User Management

```text
User List
  ↓
Search / Filter
  ↓
User Details
  ├── Employee
  ├── Roles
  ├── Company/Branch Scope
  └── Status
```

## Role Management

```text
Role List
  ↓
Role Details
  └── Permission Matrix
```

## User Role Assignment

```text
User
  ↓
Assigned Roles
  ↓
Available Roles
```

## Permission Management

```text
Module
  ↓
Resource
  ↓
Action
```

### Tasks

**TASK-804 — Define User management UI**

**TASK-805 — Define Role management UI**

**TASK-806 — Define Permission matrix UI**

**TASK-807 — Define User-Role assignment UI**

**TASK-808 — Define Company/Branch access UI**

**TASK-809 — Define security status UI**

**TASK-810 — Define login/session UX**

**TASK-811 — Define password-change UX**

**TASK-812 — Define password-reset UX**

---

# 24. API Security Standards

Every API should follow the security pipeline:

```text
HTTP Request
    ↓
Authentication
    ↓
User Resolution
    ↓
Permission Check
    ↓
Company/Branch Scope Check
    ↓
DTO Validation
    ↓
Business Logic
    ↓
Database
```

Do not implement:

```text
HTTP Request
    ↓
Controller
    ↓
Database
```

for protected functionality.

### Tasks

**TASK-813 — Define security middleware/guard ordering**

**TASK-814 — Define authentication error contract**

**TASK-815 — Define authorization error contract**

**TASK-816 — Define scope violation error contract**

**TASK-817 — Implement standardized security error responses**

**TASK-818 — Add API security integration tests**

---

# 25. Testing Strategy

## Authentication

Test:

- Valid login
- Invalid login
- Disabled account
- Locked account
- Expired session/token
- Logout
- Refresh
- Password change
- Password reset

## Authorization

Test:

- User with permission
- User without permission
- Multiple roles
- Permission removal
- Role deactivation
- UI restriction
- Direct API bypass attempt

## Scope

Test:

- Authorized branch
- Unauthorized branch
- Authorized company
- Unauthorized company
- Multi-branch user
- Active branch switching
- Direct API branch manipulation

## Security

Test:

- Brute force
- Rate limiting
- Token reuse
- Reset-token reuse
- Reset-token expiration
- Password logging
- Token logging
- Privilege escalation
- IDOR-style access attempts
- Deleted/disabled user access

### Tasks

**TASK-819 — Implement authentication unit tests**

**TASK-820 — Implement authentication integration tests**

**TASK-821 — Implement authorization unit tests**

**TASK-822 — Implement authorization integration tests**

**TASK-823 — Implement scope security tests**

**TASK-824 — Implement password security tests**

**TASK-825 — Implement session/token security tests**

**TASK-826 — Implement brute-force/rate-limit tests**

**TASK-827 — Implement privilege-escalation tests**

**TASK-828 — Implement direct-API bypass tests**

**TASK-829 — Implement frontend security tests**

**TASK-830 — Implement database security integration tests**

---

# 26. Security Review Checklist

Before closing Phase 4, verify:

- [ ] Passwords are never stored in plaintext.
- [ ] Passwords never appear in logs.
- [ ] Access tokens never appear in logs.
- [ ] Reset tokens are short-lived and single-use.
- [ ] Authentication is required for protected APIs.
- [ ] Authorization is enforced server-side.
- [ ] UI authorization is only an additional UX layer.
- [ ] User roles are not confused with Party business roles.
- [ ] Permission names are stable.
- [ ] Permissions are centrally managed.
- [ ] Role mappings are centrally managed.
- [ ] Company/branch scope is enforced server-side.
- [ ] Disabled users cannot authenticate.
- [ ] Locked users cannot authenticate.
- [ ] Logout invalidates access appropriately.
- [ ] Session/token expiry works.
- [ ] Brute-force protection exists.
- [ ] Administrative APIs are protected.
- [ ] Security events are auditable.
- [ ] Sensitive audit payloads are minimized.
- [ ] SQLite compatibility is verified.
- [ ] PostgreSQL compatibility is verified.
- [ ] Security test suite passes.

---

# 27. Phase 4 Dependencies

## Depends On

```text
Phase 1 — Foundation & Architecture
Phase 2 — Organization, Geography & Configuration
Phase 3 — Party Management
```

Most importantly:

```text
Phase 3
Employee
   ↓
Phase 4
User
```

The Party architecture must remain separate from authentication.

## Used By

Almost every subsequent phase:

```text
Phase 5 — Medicine
Phase 6 — Inventory
Phase 7 — Purchase
Phase 8 — Sales
Phase 9 — Financial
Phase 10 — Prescription/Loyalty/etc.
```

---

# 28. Security Dependency Flow

```text
Employee
    ↓
User Account
    ↓
Authentication
    ↓
User
    ↓
UserRole
    ↓
Role
    ↓
RolePermission
    ↓
Permission
    ↓
Authorization
    ↓
Company/Branch Scope
    ↓
Business Operation
```

---

# 29. Example Authorization Flow

Suppose a user attempts:

```text
Create Purchase Order
```

The system should evaluate:

```text
1. Is the user authenticated?
       ↓ yes

2. Is the account active?
       ↓ yes

3. Does the user have Purchase.Create?
       ↓ yes

4. Does the user have access to this branch?
       ↓ yes

5. Is the branch active?
       ↓ yes

6. Is the request valid?
       ↓ yes

7. Execute Purchase business logic
```

If any required security condition fails:

```text
Request
   ↓
Security Check
   ↓
DENIED
```

The client must never be able to bypass the check by directly calling the API.

---

# 30. Phase 4 Completion Checklist

- [ ] User model implemented.
- [ ] User account creation implemented.
- [ ] User search implemented.
- [ ] User update implemented.
- [ ] User lifecycle implemented.
- [ ] Employee/User association implemented.
- [ ] Authentication implemented.
- [ ] Login implemented.
- [ ] Logout implemented.
- [ ] Protected API infrastructure implemented.
- [ ] Protected UI routes implemented.
- [ ] Password hashing implemented.
- [ ] Password policy implemented.
- [ ] Password change implemented.
- [ ] Password reset implemented.
- [ ] Role model implemented.
- [ ] Role management implemented.
- [ ] Permission model implemented.
- [ ] Permission catalog implemented.
- [ ] Role-permission mapping implemented.
- [ ] User-role mapping implemented.
- [ ] Permission-based API authorization implemented.
- [ ] Permission-based UI authorization implemented.
- [ ] Service-level authorization implemented.
- [ ] Company scope implemented.
- [ ] Branch scope implemented.
- [ ] Active branch context implemented.
- [ ] Session/token handling implemented.
- [ ] Security audit events implemented.
- [ ] Sensitive logging protections implemented.
- [ ] Brute-force protection implemented.
- [ ] Rate limiting implemented.
- [ ] Secret management implemented.
- [ ] Authentication context implemented.
- [ ] Reusable authorization service implemented.
- [ ] Frontend security context implemented.
- [ ] Initial role/permission seed implemented.
- [ ] Initial administrator bootstrap implemented.
- [ ] SQLite compatibility verified.
- [ ] PostgreSQL compatibility verified.
- [ ] Authentication tests completed.
- [ ] Authorization tests completed.
- [ ] Scope tests completed.
- [ ] Security hardening tests completed.
- [ ] Privilege escalation tests completed.
- [ ] Direct API bypass tests completed.
- [ ] Documentation updated.

---

# 31. Phase 4 Work Item Summary

| Type | Count |
|---|---:|
| Epic | 1 |
| Features | 14 |
| User Stories | 35 |
| Tasks | 277 |
| **Total Work Items** | **327** |

The task count is intentionally detailed so that database, backend, UI, security, authorization, scope, audit, and testing responsibilities can be separately tracked in ADO.

Tasks may be merged during sprint planning if your team prefers larger implementation units.

---

# 32. Phase Boundary

Phase 4 establishes the security platform.

It does **not** define business authorization rules for every future transaction.

Instead, it provides the reusable mechanism:

```text
User
 ↓
Role
 ↓
Permission
 ↓
Scope
 ↓
Business Module
```

Later phases consume this mechanism.

Example:

```text
Phase 7 — Purchase

Purchase.Create
Purchase.Update
Purchase.Approve
Purchase.Cancel
```

Phase 7 should define which operations require which permissions.

Phase 4 provides the framework that evaluates them.

---

# 33. Final Architecture After Phase 4

At the end of Phase 4, the foundational ERP architecture should conceptually look like:

```text
                         ┌──────────────────┐
                         │      Company     │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │      Branch      │
                         └────────┬─────────┘
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       │                          │                          │
       ▼                          ▼                          ▼
    Party                     Employee                     Config
       │                          │                          │
       ├── Customer               │                          ├── Financial Year
       ├── Supplier               ▼                          ├── Sequence
       ├── Doctor               User                         ├── Settings
       └── Employee               │                          ├── Printer
                                  ▼                          └── Barcode
                               UserRole
                                  │
                                  ▼
                                 Role
                                  │
                                  ▼
                            RolePermission
                                  │
                                  ▼
                              Permission
                                  │
                                  ▼
                           Authorization
                                  │
                                  ▼
                         Business Modules
```

This provides the security foundation required before implementing sensitive transactional modules such as Purchase, Sales, Inventory, and Financial processing.
