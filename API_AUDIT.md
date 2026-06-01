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
| `verifyOtp` | `POST /auth/verify-otp` | Signup OTP screen | No | `email`, `otp`, `type` | Wired; confirm production route after register routes are deployed. |
| `resendOtp` | `POST /auth/resend-otp` | Signup OTP resend | No | `email`, `type` | Wired; confirm production route after register routes are deployed. |
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
| Food | `GET /food/menu`, `GET /food/meal-types`, `POST /food/orders`, `POST /food/orders/{id}/pay`, `POST /food/orders/{id}/verify-payment`, `POST /food/orders/{id}/cancel` | Dietary tags, item details, direct order list/details/timeline | Product images are backend-driven. Missing image URLs use a neutral icon, not local sample food photos. |
| Toiletries shop | `GET /shop/products`, `GET /shop/categories`, `POST /shop/orders`, `POST /shop/orders/{id}/pay`, `POST /shop/orders/{id}/verify-payment`, `POST /shop/orders/{id}/cancel` | Product details, direct order list/details/timeline | Wired. |
| Services | `GET /services`, `GET /services/categories`, `POST /services/orders`, `POST /services/orders/{id}/pay`, `POST /services/orders/{id}/verify-payment` | Details, laundry items, massage options, direct order list/details | Backend service-cancellation route is not documented, so the UI keeps an honest local cancelled override. |
| Requests | `GET /requests/quick-request-types`, `POST /requests/quick`, `POST /requests/chauffeur`, `POST /requests/bureau-de-change` | Exchange-rates list, request list/details | Request screen now remains usable with documented request types if the backend catalog is empty or unavailable. |
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
| `getLegalDocuments` | `GET /legal` | Footer, booking policy, account legal/privacy | No | `200 confirmed` on production. It returns terms, cancellation, refund, and privacy URLs, but all four published `www.bedrockresidences.com/legal/...` destinations currently return `404`. |
| `getHelpInfo` | `GET /help` | Help Center and footer | No | `200 confirmed` on production. It returns the reservation phone, email, and social links. Confirm whether FAQ content will be added. |
| `getProfile` | `GET /profile` | None | Yes | Unused because account refresh uses `/auth/me`. Keep only if backend differentiates the responses. |

## Backend Confirmation Needed

| Feature | What to confirm |
| --- | --- |
| Signup | Deploy `POST /api/v1/auth/register` and `POST /api/v1/auth/register/agent` to production. Both returned 404 during direct checks. |
| Legal pages | Publish or correct the four URLs returned by `GET /api/v1/legal`: `/legal/terms`, `/legal/cancellation`, `/legal/refund`, and `/legal/privacy`. The Legal API responds successfully, but every destination currently returns 404. |
| Refer and Earn | Confirm the response keys for rock balance, referral code, total referrals, transaction history, and earning rules. |
| Service cancellation | Confirm whether a service-order cancellation endpoint exists. |
| Request catalog | Confirm whether `/requests/quick-request-types` should return the three documented request types in production. |
| Social auth | Firebase web-app config is not in the Postman collection. Google and Apple popup auth still require the Firebase environment values and enabled providers. |

`.env.example` is intentionally kept in the repository as safe deployment documentation. It contains placeholders, not secret credentials. The real `.env` remains ignored by git.
