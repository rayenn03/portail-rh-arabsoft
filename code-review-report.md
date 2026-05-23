# Code Review: Portail RH ArabSoft

**Date:** 5 avril 2026
**Scope:** Full-stack review (Laravel backend + React frontend) with security focus

---

## Summary

The Portail RH is a well-structured HR management application with a clear separation between a Laravel API backend and a React SPA frontend. The codebase is functional and demonstrates a good understanding of the Laravel/JWT/React stack. However, the review uncovered **several critical security vulnerabilities** that must be fixed before any production deployment, along with correctness bugs and maintainability improvements.

**Verdict: Request Changes** — the critical security issues must be addressed.

---

## Critical Issues

### 1. [CRITICAL] Secrets committed to version control
**File:** `portail-rh-backend/.env` (line 67-69)
**Severity:** 🔴 Critical

The `.env` file contains real secrets — a JWT secret key, a database password (`rayen`), and a **Gemini API key** (`AIzaSy...`). While `.env` is in `.gitignore`, the file is present in the repository mount. If this was ever committed to git history, those secrets are permanently exposed. The Gemini API key in particular is a billable credential.

**Fix:** Rotate the JWT secret (`php artisan jwt:secret`), change the DB password, regenerate the Gemini API key. Verify with `git log --all --full-history -- .env` that the file was never committed.

---

### 2. [CRITICAL] Open registration allows anyone to create admin accounts
**File:** `AuthController.php` (line 23), `api.php` (line 12)
**Severity:** 🔴 Critical

The `/register` endpoint is public and accepts a `role` field including `admin` and `chef`. Any anonymous user can create an admin account and gain full control over all employees and requests.

```php
// Current — anyone can register as admin
'role' => 'required|in:employe,chef,admin',
```

**Fix:** Either remove the public register route entirely (admin creates users) or force `role` to `employe` in the register endpoint and ignore the user-supplied value. Registration of `chef` and `admin` roles should only be possible through an authenticated admin endpoint.

---

### 3. [CRITICAL] Password stored in plain text during user update
**File:** `UserController.php` (line 61)
**Severity:** 🔴 Critical

When an admin updates a user's password, the raw password is saved without hashing:

```php
$data['password'] = $request->password;  // NOT hashed!
```

While the `User` model has a `'password' => 'hashed'` cast, this only works on Laravel 11+ with attribute casting. If running on an earlier version, passwords are stored in plain text. Even on Laravel 11+, it's better to be explicit.

**Fix:** Always hash explicitly:
```php
$data['password'] = Hash::make($request->password);
```

---

### 4. [CRITICAL] SSL verification disabled on Gemini API call
**File:** `ChatbotController.php` (line 125)
**Severity:** 🔴 Critical

```php
$response = Http::timeout(15)->withoutVerifying()->post($apiUrl, ...);
```

`withoutVerifying()` disables TLS certificate validation, making the connection vulnerable to man-in-the-middle attacks. An attacker on the network could intercept the API key and all chatbot data (which includes employee PII like names, emails, leave balances, and request details).

**Fix:** Remove `->withoutVerifying()`. If there's a CA certificate issue in development, fix the certificate chain rather than disabling verification.

---

### 5. [HIGH] Gemini API key exposed in URL query parameter
**File:** `ChatbotController.php` (line 123)
**Severity:** 🟠 High

```php
$apiUrl = "...?key={$apiKey}";
```

The API key is passed as a URL query parameter, which gets logged in server access logs, proxy logs, and potentially browser history. This is a data-leak vector.

**Fix:** Pass the key via an `x-goog-api-key` header or use the `Authorization` header instead.

---

### 6. [HIGH] Mass-assignment vulnerability — unvalidated fields in Demande creation
**File:** `DemandeController.php` (lines 48-60)
**Severity:** 🟠 High

The `store` method creates a Demande using `$request->date_debut`, `$request->montant`, etc. without any validation rules for those fields. Only `type` and `commentaire` are validated. A malicious user could inject arbitrary values for `montant`, `date_debut`, `date_fin`, or `type_document`.

**Fix:** Add validation rules for all accepted fields:
```php
$request->validate([
    'type'          => 'required|in:conge,autorisation,pret,situation,document',
    'date_debut'    => 'nullable|date',
    'date_fin'      => 'nullable|date|after_or_equal:date_debut',
    'montant'       => 'nullable|numeric|min:0',
    'duree'         => 'nullable|string|max:50',
    'motif'         => 'nullable|string|max:500',
    'type_document' => 'nullable|string|max:100',
    'commentaire'   => 'nullable|string|max:1000',
]);
```

---

### 7. [HIGH] Employee update lacks validation — allows injecting `role` field
**File:** `UserController.php` (line 47)
**Severity:** 🟠 High

The `update` method uses `$request->only([...])` but does not validate the data. A non-admin user modifying their own profile could also pass the `chef_id` field to change their supervisor. More critically, while `role` is not in the `only()` list, the `User` model's `$fillable` includes `role`, and a crafty user could exploit this if additional fields leak through.

**Fix:** Add proper validation and explicitly exclude sensitive fields for non-admin users.

---

### 8. [HIGH] No rate limiting on login or chatbot endpoints
**File:** `api.php`
**Severity:** 🟠 High

The `/login` endpoint has no rate limiting, enabling brute-force attacks. Similarly, `/chatbot` has no rate limiting, allowing abuse of the Gemini API (generating costs). The demo passwords (`123456`) make brute-force trivial.

**Fix:** Add Laravel's `throttle` middleware:
```php
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/chatbot', [ChatbotController::class, 'chat'])->middleware('throttle:20,1');
```

---

### 9. [HIGH] Hardcoded demo credentials in frontend
**File:** `Login.jsx` (line 152)
**Severity:** 🟠 High

The login page has "quick login" buttons that auto-fill `password: '123456'` for demo accounts. This is a security risk if deployed publicly. Demo accounts with known passwords and real roles (admin, chef, employe) allow full access.

**Fix:** Remove the quick-login buttons in production builds, or gate them behind an environment variable.

---

### 10. [HIGH] PII sent to external Gemini AI without user consent
**File:** `ChatbotController.php` (lines 86-119)
**Severity:** 🟠 High

The chatbot prompt includes employee PII: full name, email, department, position, leave balances, and the last 10 requests with their details, dates, and comments. All of this is sent to Google's Gemini API on every chatbot message. In an HR context, this may violate GDPR/data protection regulations.

**Fix:** Inform users that their data is processed by a third-party AI. Consider anonymizing the data or letting users opt in.

---

## Suggestions

### 11. [MEDIUM] Authorization check inconsistency — `employee` vs `employe` role
**File:** `UserController.php` (line 30) vs migration (line 16)
**Category:** Correctness

The migration defines the role enum as `['employee', 'chef', 'admin']` (with double 'e'), but the controllers and frontend consistently use `employe` (French spelling). This mismatch means the `show()` method's role check (`$user->role === 'employee'`) will never match, effectively bypassing the authorization check — any user can view any other user's profile.

**Fix:** Standardize the role enum. Either update the migration to use `employe` or update all controllers to use `employee`.

---

### 12. [MEDIUM] `DemandeController::show()` — Chef can see any Demande
**File:** `DemandeController.php` (line 94)
**Category:** Correctness

The `show` method only checks authorization for `employee` role. A chef with a valid JWT can view any demande by ID, including demandes from other departments.

**Fix:** Add authorization for chef role:
```php
if ($user->role === 'chef' && $demande->chef_id !== $user->id
    && $demande->employee->chef_id !== $user->id) {
    return response()->json(['message' => 'Accès refusé'], 403);
}
```

---

### 13. [MEDIUM] `MessageController::index()` — OR query leaks messages
**File:** `MessageController.php` (line 15)
**Category:** Correctness / Security

```php
$messages = Message::where('expediteur_id', $user->id)
    ->orWhere('destinataire_id', $user->id)
```

The `orWhere` is applied globally. If other conditions are added later (e.g., scoping), the OR will break the query logic. Use a grouped `where`:
```php
$messages = Message::where(function($q) use ($user) {
    $q->where('expediteur_id', $user->id)
      ->orWhere('destinataire_id', $user->id);
})->with(...)
```

---

### 14. [MEDIUM] Admin can delete themselves
**File:** `UserController.php` (line 107)
**Category:** Correctness

The `destroy` method doesn't check if the admin is deleting their own account. This could lock out the only admin.

---

### 15. [MEDIUM] Admin notification assumes single admin
**File:** `DemandeController.php` (line 68)
**Category:** Correctness

```php
$admin = User::where('role', 'admin')->first();
```

Only the first admin found gets notified. If there are multiple admins, others won't see notifications.

---

### 16. [MEDIUM] Frontend `PrivateRoute` only checks for token, not role
**File:** `PrivateRoute.jsx`, `App.jsx`
**Category:** Security

All routes (e.g., `/employes`, `/all-demandes`) are protected only by token presence. A regular employee can navigate to `/employes` or `/all-demandes` and see the page (though API calls may fail with 403). Add role-based route guards.

---

### 17. [MEDIUM] Profil page calls `login()` incorrectly after profile update
**File:** `Profil.jsx` (line 110)
**Category:** Correctness

```javascript
login(res.data.user, token)
```

But the `login` function in `AuthContext` takes `(email, password)`, not `(user, token)`. This will make an actual login API call with the user object as the email, which will fail. The profile update succeeds but the local user state doesn't refresh properly.

**Fix:** Instead of calling `login`, update the user state directly:
```javascript
const userData = res.data.user
localStorage.setItem('user', JSON.stringify(userData))
setUser(userData)  // (requires exposing setUser from AuthContext)
```

---

### 18. [LOW] Dashboard shows hardcoded leave data for Admin
**File:** `Dashboard.jsx` (lines 108-120)
**Category:** Correctness

The admin dashboard shows hardcoded leave balance data (`used: 18, total: 30`) instead of fetching real data. This is misleading.

---

### 19. [LOW] No CORS configuration visible
**Category:** Security / Configuration

There's no explicit CORS configuration for the Laravel API. In development this may work fine, but in production the React app and API will likely be on different origins, requiring proper CORS headers.

---

### 20. [LOW] No pagination on list endpoints
**Files:** All controllers with `->get()`
**Category:** Performance

All list endpoints (`/demandes`, `/users`, `/messages`, `/notifications`) fetch all records without pagination. As the dataset grows, this will cause performance issues and high memory usage.

---

## What Looks Good

- **Clean project structure** — clear separation between backend and frontend with well-organized files
- **JWT auth setup** — properly configured with token blacklisting and required claims
- **Role-based data scoping** — the `index` methods in most controllers filter data by role appropriately
- **Consistent UI design** — the frontend has a cohesive design language with shared styles
- **Chatbot integration** — well-thought-out context building for the Gemini API with real user data
- **Notification system** — automatic notifications on demand state changes is a nice workflow feature
- **Input validation** — the Auth controller has proper validation rules for registration
- **Bcrypt rounds** — set to 12, which is solid

---

## Priority Action Plan

1. **Immediately:** Rotate all secrets (JWT key, DB password, Gemini API key)
2. **Before deployment:** Fix critical issues #2 (open registration), #3 (password hashing), #4 (SSL)
3. **Before deployment:** Fix high issues #6 (validation), #8 (rate limiting), #11 (role mismatch)
4. **Soon after:** Address medium issues (authorization gaps, CORS, pagination)
5. **Nice to have:** Fix low issues (hardcoded data, frontend role guards)
