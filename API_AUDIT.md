# Bedrock Frontend API Audit

Base URL: `https://api.bedrockresidences.com/api/v1`

Status guide:

- `Wired`: connected to a frontend flow. Runtime success still depends on a valid account and backend response.
- `Unused`: defined for future use but not currently called by the UI.
- `404 confirmed`: production was called directly and the route is not deployed.

## Authentication

| Frontend function | Method and path | Used by | Auth | Payload summary | Status / notes |
| --- | --- | --- | --- | --- | --- |
| `registerGuest` | `POST /auth/register` | Guest signup final password step | No | `first_name`, `last_name`, `email`, `phone_number`, `country`, `country_code`, `password`, `password_confirmation` | `404 confirmed` on production. Frontend mapping matches Postman. |
| `registerAgent` | `POST /auth/register/agent` | Agent signup final password step | No | Same snake_case registration payload | `404 confirmed` on production. Frontend mapping matches Postman. |
| `verifyOtp` | `POST /auth/verify-otp` | Signup OTP screen | No | `email`, `otp` | `404 confirmed` on production. Payload matches the exported Postman collection. |
| `resendOtp` | `POST /auth/resend-otp` | Signup OTP resend | No | `email`, `type: "email_verification"` | Production returns `422` without `type`, although the exported Postman request only shows `email`. Frontend follows the live validator for this route. |
| `login` | `POST /auth/login` | Login form | No | `email`, `password` | Wired. Login is shared because Postman exposes one login route. |
| `forgotPassword` | `POST /auth/forgot-password` | Forgot-password form | No | `email` | Wired. |
| `resetPassword` | `POST /auth/reset-password` | Reset-password form | No | `email`, `otp`, `password`, `password_confirmation` | Wired. |
| `getCurrentUser` | `GET /auth/me` | Account refresh | Yes | None | Wired. |
| `getOnboardingStatus` | `GET /auth/onboarding-status` | Agent onboarding action | Yes | None | Wired. |
| `logout` | `POST /auth/logout` | Logout | Yes | None | Wired. |
| `deleteAccount` | `POST /auth/delete-account` | Account deletion | Yes | None | Wired. |

The create-password screen is a frontend step only. It correctly sends the complete registration payload in the final register request; there is no separate create-password API call.

## Apartments, Favorites, Bookings, and Payments

| Frontend function | Method and path | Used by | Auth | Status / notes |
| --- | --- | --- | --- | --- |
| `getResidences` | `GET /apartments/residences` | Home filters and residence navigation | No | Wired. |
| `getApartments` | `GET /apartments` | Home listings and filtered search | No | Wired. |
| `getBedroomCategories` | `GET /apartments/categories` | Residence apartment-type menu | No | Wired. |
| `getApartmentDetails` | `GET /apartments/{id}` | Apartment details page | No | Wired. |
| `getApartmentReviews` | `GET /apartments/{id}/reviews` | Apartment details reviews | No | Wired. |
| `checkAvailability` | `POST /apartments/check-availability` | Apartment flow | No | Wired. |
| `calculatePricing` | `POST /apartments/calculate-pricing` | Apartment flow | No | Wired. |
| `getPopularApartments` | `GET /apartments/popular` | None | No | Unused; safe future helper. |
| `getApartmentsByResidence` | `GET /apartments/residence/{id}` | None | No | Unused; UI currently filters the loaded apartment list. |
| `getApartmentBySlug` | `GET /apartments/slug/{slug}` | None | No | Unused; safe future route helper. |
| `getFavorites` | `GET /favorites` | Account hydration | Yes | Wired. |
| `toggleFavorite` | `POST /favorites/{apartmentId}/toggle` | Apartment card favorite action | Yes | Wired. Wishlist UI now renders apartment fields, not food fields. |
| `createBooking` | `POST /bookings` | Booking checkout | Yes | Wired. |
| `getBookings` | `GET /bookings` | Profile bookings | Yes | Wired. |
| `extendBooking` | `POST /bookings/{id}/extend` | Booking extension | Yes | Wired. |
| `cancelBooking` | `POST /bookings/{id}/cancel` | Booking cancellation | Yes | Wired. |
| `initiatePayment` | `POST /bookings/{id}/initiate-payment` | Booking payment | Yes | Wired with booking ID in the URL. |
| `verifyPayment` | `POST /payments/verify` | Paystack return verification | Yes | Wired. |
| `getInvoice` | `GET /bookings/{id}/invoice` | Booking invoice | Yes | Wired. |
| `submitReview` | `POST /bookings/{id}/review` | Completed-booking review | Yes | Wired. |
| `getUpcomingBookings`, `getPastBookings`, `getBookingDetails`, `getBookingByReference`, `getExtensionSummary` | Booking GET helpers | None | Yes | Unused; retain for future dedicated views. |
| `getPaymentMethods`, `getPaymentStatus`, `getPaymentHistory` | Payment GET helpers | None | Yes | Unused; retain if payment history UI is planned. |

## Food, Shop, Services, Requests, and Orders

| Area | Wired UI calls | Defined but unused | Notes |
| --- | --- | --- | --- |
| Food | `GET /food/menu`, `GET /food/meal-types`, `POST /food/orders`, `POST /food/orders/{id}/pay`, `POST /food/orders/{id}/verify-payment` | Dietary tags, item details, direct order list/details/timeline | Product images are backend-driven. Missing image URLs use a neutral icon, not local sample food photos. `POST /food/orders/{id}/cancel` returned `404` for a real production order, so the cancel action is hidden until backend deployment. |
| Toiletries shop | `GET /shop/products`, `GET /shop/categories`, `POST /shop/orders`, `POST /shop/orders/{id}/pay`, `POST /shop/orders/{id}/verify-payment` | Product details, direct order list/details/timeline | Order cancellation is hidden while the deployed cancellation contract is confirmed. |
| Services | `GET /services`, `GET /services/categories`, `POST /services/orders`, `POST /services/orders/{id}/pay`, `POST /services/orders/{id}/verify-payment` | Details, laundry items, massage options, direct order list/details | Backend service-cancellation route is not documented, so the cancel action remains hidden. |
| Requests | `GET /requests/quick-request-types`, `POST /requests/quick`, `POST /requests/chauffeur`, `POST /requests/bureau-de-change` | Exchange-rates list, request list/details | Production returns `401` for the request catalog without a token. The frontend now sends the stored token when available and keeps documented fallback cards for visitors. `GET /exchange-rates` is public and returned `200`. |
| Aggregated orders | `GET /orders`, `GET /orders/counts`, `GET /orders/booking/{bookingId}/timeline` | Type-specific aggregate filters | Wired. Local cancelled overrides are reapplied after refresh so stale backend data does not revive a cancelled card. |

## Profile, Legal, Help, and Referral

| Frontend function | Method and path | Used by | Auth | Status / notes |
| --- | --- | --- | --- | --- |
| `updateProfile` | `PUT /profile` | Edit profile | Yes | Wired. |
| `updateAvatar` | `POST /profile/avatar` | Profile photo | Yes | Wired multipart upload. |
| `changePassword` | `POST /profile/change-password` | Change password | Yes | Wired. |
| `getRockPoints` | `GET /profile/rock-points` | Refer and Earn | Yes | Wired; fields are normalized defensively. |
| `getReferralInfo` | `GET /profile/referral` | Refer and Earn | Yes | Wired; confirm whether production returns history and earning rules. |
| Notification helpers | `/profile/notifications...` | Header bell and messages view | Yes | Wired for list, count, mark one read, and mark all read. |
| Document helpers | `/profile/documents`, `/profile/kyc/submit` | Agent onboarding and profile | Yes | Wired, but KYC rollout should remain a business decision. |
| `getLegalDocuments` | `GET /legal` | Public legal page, footer, booking policy, account legal/privacy | No | `200 confirmed` on production. It returns terms, cancellation, refund, and privacy URLs, but all four published `www.bedrockresidences.com/legal/...` destinations currently return `404`. The frontend now provides readable in-app policy summaries and does not expose the broken external links. Business/legal approval is still required for the final copy. |
| `getHelpInfo` | `GET /help` | Help Center and footer | No | `200 confirmed` on production. It returns the reservation phone, email, and social links. Confirm whether FAQ content will be added. |
| `getProfile` | `GET /profile` | None | Yes | Unused because account refresh uses `/auth/me`. Keep only if backend differentiates the responses. |

## Backend Confirmation Needed

| Feature | What to confirm |
| --- | --- |
| Signup | Deploy `POST /api/v1/auth/register` and `POST /api/v1/auth/register/agent` to production. Both returned 404 during direct checks. |
| OTP verification | Deploy or confirm `POST /api/v1/auth/verify-otp`; production currently returns 404. Reconcile the exported resend-OTP example with production validation, which currently requires `type`. |
| Legal pages | Publish or correct the four URLs returned by `GET /api/v1/legal`: `/legal/terms`, `/legal/cancellation`, `/legal/refund`, and `/legal/privacy`. The Legal API responds successfully, but every destination currently returns 404. |
| Refer and Earn | Confirm the response keys for rock balance, referral code, total referrals, transaction history, and earning rules. |
| Service cancellation | Confirm whether a service-order cancellation endpoint exists. |
| Order cancellation | Deploy or correct `POST /api/v1/food/orders/{id}/cancel` and confirm the toiletries equivalent. A real production food-order cancellation returned `404`, so the frontend hides order cancellation instead of offering a broken action. |
| Request catalog | Confirm whether `/requests/quick-request-types` is intentionally protected. Production returns `401` without a token; the frontend now sends the stored token after login and displays documented fallback cards to visitors. |
| Social auth | Firebase web-app config is not in the Postman collection. Google and Apple popup auth still require the Firebase environment values and enabled providers. |

`.env.example` is intentionally kept in the repository as safe deployment documentation. It contains placeholders, not secret credentials. The real `.env` remains ignored by git.

## Production Probe Evidence

The following safe direct checks were run against the production base URL on June 2, 2026. Protected routes were intentionally called without a token where noted so their deployment status could be distinguished from authorization requirements.

| Method and path | Production result | What it confirms |
| --- | --- | --- |
| `GET /apartments/residences` | `200` | Residence catalog is deployed. |
| `GET /apartments?per_page=1` | `200` | Apartment catalog is deployed. |
| `GET /food/menu` | `200` | Food catalog is deployed. |
| `GET /shop/products` | `200` | Toiletries shop catalog is deployed. |
| `GET /services` | `200` | Service catalog is deployed. |
| `GET /exchange-rates` | `200` | Public exchange-rate data is deployed. |
| `GET /legal` | `200` | Legal metadata is deployed; the returned public document destinations still respond with `404`. |
| `GET /help` | `200` | Help metadata is deployed. |
| `GET /profile` | `401` without token | Protected profile route is deployed and correctly requires authentication. |
| `GET /favorites` | `401` without token | Protected favorites route is deployed and correctly requires authentication. |
| `GET /orders` | `401` without token | Protected aggregate orders route is deployed and correctly requires authentication. |
| `GET /bookings` | `401` without token | Protected booking route is deployed and correctly requires authentication. |
| `POST /bookings/123/initiate-payment` | `401` without token | Booking payment route is deployed and includes the booking ID in its URL. |
| `POST /auth/login` | `422` with empty body | Login route is deployed and validating required fields. |
| `POST /auth/resend-otp` | `422` with empty body | OTP resend route is deployed and validating required fields. |
| `POST /auth/register` | `404` | Guest registration route is not deployed on production. |
| `POST /auth/register/agent` | `404` | Agent registration route is not deployed on production. |
| `POST /auth/verify-otp` | `404` | OTP verification route is not deployed on production. |
| `POST /food/orders/35/cancel` | `404` | Food cancellation route is not deployed on production. |

## Responsive QA Evidence

A local headless-browser pass was run at `320`, `360`, `375`, `390`, `414`, `430`, `768`, `1024`, and `1440` pixels wide. No document-level horizontal overflow was detected at any checked width. The login panel fits a `320x700` viewport without internal scrolling, uses `16px` input text to avoid iOS focus zoom, and the longer signup panel stays contained with vertical scrolling when needed. The mobile Shop directory and Request page were also opened through their visible controls with no horizontal overflow.
