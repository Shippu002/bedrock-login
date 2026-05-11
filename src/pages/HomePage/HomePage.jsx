import { useState } from "react";
import { FiChevronLeft, FiMapPin, FiShoppingBag } from "react-icons/fi";
import Header from "../../components/Header";
import SearchBar from "../../components/SearchBar";
import ListingSection from "../../components/ListingSection";
import AppImage from "../../components/AppImage";
import { listingSections } from "../../data/listings";
import { shopCategories } from "../../data/shopCategories";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import ProfilePage from "../Profile/ProfilePage";
import ResidencePage from "../Residence/ResidencePage";
import ApartmentPage from "../Apartment/ApartmentPage";
import ShopFoodPage from "../ShopFood/ShopFoodPage";
import { foodItems } from "../../data/foodItems";
import { serviceItems } from "../../data/serviceItems";
import { shopItems } from "../../data/shopItems";
import { decorateApartmentWithMedia } from "../../utils/apartmentMedia";
import {
  addDays,
  calculateBookingTotals,
  createBookingId,
  ensureCheckoutDate,
  getTodayDateValue,
} from "../../utils/bookings";
import {
  calculateFoodOrderTotals,
  createDefaultFoodOrderDetails,
  createFoodOrderId,
} from "../../utils/foodOrders";
import {
  defaultApartmentFilters,
  filterListingSections,
  hasActiveApartmentFilters,
} from "../../utils/apartmentFilters";
import {
  auth,
  GoogleAuthProvider,
  isFirebaseConfigReady,
  missingFirebaseEnvVars,
  OAuthProvider,
  signInWithPopup,
} from "../../firebase";

const ACCOUNT_STORAGE_KEY = "bedrockRegisteredUser";

function getShopVariant(shopId) {
  if (shopId === "foods") return "food";
  if (shopId === "shop" || shopId === "toiletries") return "toiletries";
  if (shopId === "services") return "services";
  if (shopId === "request" || shopId === "requests") return "requests";
  return null;
}

function getDefaultShopItem(variant) {
  if (variant === "toiletries") return shopItems[0];
  if (variant === "services") return serviceItems[0];
  if (variant === "requests") {
    return (
      serviceItems.find((item) => item.tags.includes("Request")) ||
      serviceItems[0]
    );
  }
  return foodItems[0];
}

function createDefaultBookingDetails() {
  const checkIn = getTodayDateValue();

  return {
    checkIn,
    checkOut: addDays(checkIn, 1),
    guests: 1,
    promo: "",
    paymentMethod: "card",
    agreedToPolicy: true,
    useRockPoints: true,
  };
}

function createBookingDetailsFromFilters(filters) {
  const defaultDetails = createDefaultBookingDetails();
  const checkIn = filters.checkIn || defaultDetails.checkIn;

  return {
    ...defaultDetails,
    checkIn,
    checkOut: filters.checkOut
      ? ensureCheckoutDate(checkIn, filters.checkOut)
      : defaultDetails.checkOut,
    guests: filters.guests > 0 ? filters.guests : defaultDetails.guests,
  };
}

function ShopDirectoryPage({ onBack, onShopSelect }) {
  return (
    <section className="shop-directory-page">
      <div className="shop-directory-page__top">
        <button
          type="button"
          className="shop-directory-page__back"
          onClick={onBack}
          aria-label="Go back"
        >
          <FiChevronLeft />
          <span>Back</span>
        </button>

        <span className="shop-directory-page__icon" aria-hidden="true">
          <FiShoppingBag />
        </span>
      </div>

      <div className="shop-directory-page__heading">
        <h1>Shop</h1>
        <p>Choose what you need for your stay.</p>
      </div>

      <div className="shop-directory-page__list">
        {shopCategories.map((item) => (
          <button
            type="button"
            className="shop-directory-card"
            onClick={() => onShopSelect?.(item.id)}
            key={item.id}
          >
            <AppImage src={item.image} alt="" />

            <span>
              <strong>{item.title}</strong>
              <em>
                <FiMapPin />
                {item.location}
              </em>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function getSocialAuthErrorMessage(error, providerName) {
  const providerLabel = providerName === "apple" ? "Apple" : "Google";

  switch (error?.code) {
    case "app/missing-firebase-config":
      return `Firebase is not configured yet. Add ${missingFirebaseEnvVars.join(
        ", ",
      )} to your .env file, then restart the dev server.`;
    case "auth/invalid-api-key":
      return "Firebase rejected the API key. Check VITE_FIREBASE_API_KEY in your .env file.";
    case "auth/configuration-not-found":
      return "Firebase Auth is not enabled for this project. Enable Authentication and the sign-in provider in Firebase Console.";
    case "auth/operation-not-allowed":
      return `${providerLabel} sign-in is not enabled. Turn it on in Firebase Console > Authentication > Sign-in method.`;
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase. Add localhost and 127.0.0.1 in Firebase Console > Authentication > Settings > Authorized domains.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked by the browser. Allow popups and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled before it finished.";
    case "auth/cancelled-popup-request":
      return "Another sign-in popup is already open. Close it and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using another sign-in method.";
    default:
      return (
        error?.message ||
        `${providerLabel} sign-in failed. Please try again or use email login.`
      );
  }
}

function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEntry, setAuthEntry] = useState("login");
  const [authModalKey, setAuthModalKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [socialAuthProvider, setSocialAuthProvider] = useState("");
  const [socialAuthError, setSocialAuthError] = useState("");
  const [activePage, setActivePage] = useState("home");
  const [profileInitialView, setProfileInitialView] = useState("profile");
  const [selectedResidenceId, setSelectedResidenceId] = useState("opebi");
  const [apartmentFilters, setApartmentFilters] = useState(
    defaultApartmentFilters,
  );
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [apartmentReturnPage, setApartmentReturnPage] = useState("home");
  const [bookingDetails, setBookingDetails] = useState(() =>
    createDefaultBookingDetails(),
  );
  const [selectedFoodItem, setSelectedFoodItem] = useState(foodItems[0]);
  const [shopVariant, setShopVariant] = useState("food");
  const [foodOrderDetails, setFoodOrderDetails] = useState(() =>
    createDefaultFoodOrderDetails(),
  );
  const filteredListingSections = filterListingSections(
    listingSections,
    apartmentFilters,
  );
  const hasApartmentFilters = hasActiveApartmentFilters(apartmentFilters);

  function readSavedAccount() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function syncSavedAccount(nextUser) {
    const savedAccount = readSavedAccount();

    if (!savedAccount || !nextUser) {
      return;
    }

    localStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify({
        ...savedAccount,
        ...nextUser,
      }),
    );
  }

  function updateCurrentUser(nextUserOrUpdater) {
    setCurrentUser((currentUserValue) => {
      const nextUser =
        typeof nextUserOrUpdater === "function"
          ? nextUserOrUpdater(currentUserValue)
          : nextUserOrUpdater;

      syncSavedAccount(nextUser);

      return nextUser;
    });
  }

  function openLogin() {
    setAuthEntry("login");
    setSocialAuthError("");
    setSocialAuthProvider("");
    setAuthModalKey((current) => current + 1);
    setIsAuthModalOpen(true);
  }

  function openSignup() {
    setAuthEntry("signup");
    setSocialAuthError("");
    setSocialAuthProvider("");
    setAuthModalKey((current) => current + 1);
    setIsAuthModalOpen(true);
  }

  function closeAuthModal() {
    setSocialAuthError("");
    setSocialAuthProvider("");
    setIsAuthModalOpen(false);
  }

  function handleAuthComplete(authenticatedUser) {
    updateCurrentUser(authenticatedUser);
    setActivePage("home");
    setIsAuthModalOpen(false);
  }

  function buildUserFromFirebaseUser(firebaseUser) {
    const savedAccount = readSavedAccount();
    const email = firebaseUser.email || "";
    const savedAccountMatches =
      savedAccount?.email?.toLowerCase() === email.toLowerCase();
    const matchedAccount = savedAccountMatches ? savedAccount : {};
    const fallbackName =
      email.split("@")[0] || firebaseUser.displayName || "Bedrock User";
    const displayName =
      firebaseUser.displayName || matchedAccount.name || fallbackName;

    return {
      ...matchedAccount,
      firebaseUid: firebaseUser.uid,
      authProvider: "firebase",
      name: displayName,
      username: matchedAccount.username || displayName,
      email,
      phone: firebaseUser.phoneNumber || matchedAccount.phone || "",
      state: matchedAccount.state || "",
      country: matchedAccount.country || "",
      countryCode: matchedAccount.countryCode || "",
      currency: matchedAccount.currency || "",
      profilePhoto: firebaseUser.photoURL || matchedAccount.profilePhoto || "",
      messages: Array.isArray(matchedAccount.messages)
        ? matchedAccount.messages
        : [],
      bookings: Array.isArray(matchedAccount.bookings)
        ? matchedAccount.bookings
        : [],
      messageCount: matchedAccount.messageCount || 0,
    };
  }

  async function handleSocialSignIn(providerName) {
    setSocialAuthError("");
    setSocialAuthProvider(providerName);

    try {
      if (!isFirebaseConfigReady) {
        const error = new Error("Missing Firebase environment variables.");
        error.code = "app/missing-firebase-config";
        throw error;
      }

      if (!auth) {
        const error = new Error("Firebase Auth is not initialized.");
        error.code = "app/missing-firebase-config";
        throw error;
      }

      const provider =
        providerName === "google"
          ? new GoogleAuthProvider()
          : new OAuthProvider("apple.com");

      if (providerName === "google") {
        provider.setCustomParameters({ prompt: "select_account" });
      }

      if (providerName === "apple") {
        provider.addScope("email");
        provider.addScope("name");
      }

      const result = await signInWithPopup(auth, provider);
      const nextUser = buildUserFromFirebaseUser(result.user);

      console.log("Firebase social user:", result.user);

      localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(nextUser));
      handleAuthComplete(nextUser);
    } catch (error) {
      console.error(`${providerName} sign-in failed`, error);
      setSocialAuthError(getSocialAuthErrorMessage(error, providerName));
    } finally {
      setSocialAuthProvider("");
    }
  }

  function handleGoogleSignIn() {
    handleSocialSignIn("google");
  }

  function handleAppleSignIn() {
    handleSocialSignIn("apple");
  }

  function showHome() {
    setActivePage("home");
    setProfileInitialView("profile");
  }

  function showResidence(residenceId, apartmentTitle = "") {
    const normalizedApartmentTitle = String(apartmentTitle || "").trim();

    setSelectedResidenceId(residenceId);
    setApartmentFilters({
      ...defaultApartmentFilters,
      residenceId,
      apartmentTitle: normalizedApartmentTitle,
    });
    setActivePage("residence");
    setProfileInitialView("profile");
  }

  function showShop(shopId) {
    const nextShopVariant = getShopVariant(shopId);

    if (!nextShopVariant) {
      return;
    }

    setShopVariant(nextShopVariant);
    setSelectedFoodItem(getDefaultShopItem(nextShopVariant));
    setFoodOrderDetails(createDefaultFoodOrderDetails());
    setActivePage("shopFood");
    setProfileInitialView("profile");
  }

  function showShopDirectory() {
    if (currentUser) {
      setProfileInitialView("shop");
      setActivePage("profile");
      return;
    }

    setActivePage("shopDirectory");
    setProfileInitialView("profile");
  }

  function showApartment(apartment) {
    setApartmentReturnPage(activePage === "residence" ? "residence" : "home");
    setSelectedApartment(decorateApartmentWithMedia(apartment));
    setBookingDetails(createBookingDetailsFromFilters(apartmentFilters));
    setActivePage("apartment");
    setProfileInitialView("profile");
  }

  function showApartmentReturnPage() {
    setActivePage(apartmentReturnPage);
  }

  function handleApartmentSearch(nextFilters) {
    setApartmentFilters(nextFilters);

    if (nextFilters.residenceId) {
      setSelectedResidenceId(nextFilters.residenceId);
    }

    setActivePage("home");
    setProfileInitialView("profile");
  }

  function clearApartmentSearch() {
    setApartmentFilters(defaultApartmentFilters);
    setSearchResetKey((currentKey) => currentKey + 1);
  }

  function showProfile(profileView = "profile") {
    if (!currentUser) {
      openLogin();
      return;
    }

    setProfileInitialView(profileView);
    setActivePage("profile");
  }

  function showMessages() {
    showProfile("messages");
  }

  function showFoodDetail(foodItem) {
    setSelectedFoodItem(foodItem);
    setFoodOrderDetails(createDefaultFoodOrderDetails());
    setActivePage("foodDetail");
    setProfileInitialView("profile");
  }

  function handleProfileSave(profileUpdates) {
    updateCurrentUser((current) => {
      if (!current) return current;

      return {
        ...current,
        ...profileUpdates,
      };
    });
  }

  function handlePasswordChange({ currentPassword, nextPassword }) {
    const savedAccount = JSON.parse(
      localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null",
    );

    if (!savedAccount?.password) {
      return {
        ok: false,
        message: "No saved password found for this account.",
      };
    }

    if (savedAccount.password !== currentPassword) {
      return {
        ok: false,
        message: "Current password is incorrect.",
      };
    }

    localStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify({
        ...savedAccount,
        password: nextPassword,
      }),
    );

    return {
      ok: true,
      message: "Password updated successfully.",
    };
  }

  function handleBecomeAgent() {
    console.log("Become agent clicked");
  }

  function handleLogout() {
    setCurrentUser(null);
    setActivePage("home");
    setProfileInitialView("profile");
  }

  function handleBookingChange(field, value) {
    setBookingDetails((current) => ({
      ...current,
      ...(field === "checkIn"
        ? {
            checkIn: value,
            checkOut: ensureCheckoutDate(value, current.checkOut),
          }
        : field === "checkOut"
          ? {
              checkOut: ensureCheckoutDate(current.checkIn, value),
            }
          : field === "guests"
            ? {
                guests: Math.max(1, Number(value) || 1),
              }
            : {
                [field]: value,
              }),
    }));
  }

  function handleFoodOrderChange(field, value) {
    setFoodOrderDetails((current) => ({
      ...current,
      ...(field === "guests"
        ? {
            guests: Math.max(1, Number(value) || 1),
          }
        : {
            [field]: value,
          }),
    }));
  }

  function openPaymentStep() {
    setActivePage("payment");
  }

  function openPendingStep() {
    setActivePage("pending");
  }

  function openConfirmedStep() {
    setActivePage("confirmed");
  }

  function finishApartmentFlow() {
    if (!selectedApartment || !currentUser) {
      setActivePage("home");
      return;
    }

    const totals = calculateBookingTotals(
      selectedApartment.price,
      bookingDetails.checkIn,
      bookingDetails.checkOut,
      bookingDetails.useRockPoints,
    );

    const nextBooking = {
      id: createBookingId(),
      title: selectedApartment.title,
      residenceName: selectedApartment.residenceName,
      location: selectedApartment.location,
      image:
        selectedApartment.statusImage ||
        selectedApartment.paymentImage ||
        selectedApartment.previewImage ||
        selectedApartment.image,
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      guests: bookingDetails.guests,
      nights: totals.nights,
      nightlyRate: selectedApartment.price,
      subtotal: totals.subtotal,
      taxesAndFees: totals.taxesAndFees,
      cautionFee: totals.cautionFee,
      rockPointValue: totals.rockPointValue,
      totalAmount: totals.payable,
      createdAt: new Date().toISOString(),
    };

    updateCurrentUser((current) => {
      if (!current) return current;

      return {
        ...current,
        bookings: [nextBooking, ...(current.bookings || [])],
      };
    });

    setProfileInitialView("bookings");
    setActivePage("profile");
  }

  function finishFoodOrderFlow() {
    if (currentUser && selectedFoodItem) {
      const totals = calculateFoodOrderTotals(
        selectedFoodItem.price,
        foodOrderDetails.guests,
        foodOrderDetails.useRockPoints,
      );

      const nextOrder = {
        id: createFoodOrderId(),
        title: selectedFoodItem.title,
        category: shopVariant,
        image: selectedFoodItem.detailImage || selectedFoodItem.image,
        apartmentNumber: foodOrderDetails.apartmentNumber,
        deliveryTime: foodOrderDetails.deliveryTime,
        guests: foodOrderDetails.guests,
        note: foodOrderDetails.note,
        unitPrice: selectedFoodItem.price,
        subtotal: totals.subtotal,
        taxesAndFees: totals.taxesAndFees,
        cautionFee: totals.cautionFee,
        rockPointValue: totals.rockPointValue,
        totalAmount: totals.payable,
        createdAt: new Date().toISOString(),
      };

      updateCurrentUser((current) => {
        if (!current) return current;

        return {
          ...current,
          orders: [nextOrder, ...(current.orders || [])],
        };
      });
    }

    setActivePage("home");
  }

  return (
    <div
      className={`home-page ${
        activePage === "profile" ? "home-page--profile" : ""
      } ${activePage === "residence" ? "home-page--residence" : ""} ${
        activePage === "shopDirectory" ? "home-page--shop-directory" : ""
      }`}
    >
      {activePage === "profile" && currentUser ? (
        <ProfilePage
          user={currentUser}
          bookings={currentUser?.bookings || []}
          initialView={profileInitialView}
          onGoHome={showHome}
          onProfileSave={handleProfileSave}
          onPasswordChange={handlePasswordChange}
          onShopSelect={showShop}
          onLogout={handleLogout}
        />
      ) : (
        <>
          <Header
            user={currentUser}
            activeView="home"
            onHome={showHome}
            onLogin={openLogin}
            onSignup={openSignup}
            onProfile={() => showProfile("profile")}
            onProfileView={showProfile}
            onMessages={showMessages}
            onResidenceSelect={showResidence}
            onShopSelect={showShop}
            onShopDirectory={showShopDirectory}
            onBecomeAgent={handleBecomeAgent}
            onLogout={handleLogout}
          />

          <main className="home-page__main">
            {activePage === "home" && (
              <section className="home-mobile-intro">
                <h1>Book premium stays</h1>
              </section>
            )}

            {[
              "home",
              "residence",
              "shopFood",
              "foodDetail",
              "foodReview",
            ].includes(activePage) && (
              <SearchBar
                key={searchResetKey}
                onSearch={handleApartmentSearch}
                onResidenceSelect={showResidence}
              />
            )}

            {activePage === "residence" ? (
              <ResidencePage
                residenceId={selectedResidenceId}
                filters={apartmentFilters}
                onBack={showHome}
                onApartmentSelect={showApartment}
              />
            ) : activePage === "apartment" ? (
              <ApartmentPage
                mode="details"
                apartment={selectedApartment}
                bookingDetails={bookingDetails}
                onBookingChange={handleBookingChange}
                onOpenPayment={openPaymentStep}
                onBackToListings={showApartmentReturnPage}
              />
            ) : activePage === "payment" ? (
              <ApartmentPage
                mode="payment"
                apartment={selectedApartment}
                bookingDetails={bookingDetails}
                onBookingChange={handleBookingChange}
                onPaymentContinue={openPendingStep}
                onBackToApartment={() => setActivePage("apartment")}
              />
            ) : activePage === "pending" ? (
              <ApartmentPage
                mode="pending"
                apartment={selectedApartment}
                bookingDetails={bookingDetails}
                onBackToPayment={() => setActivePage("payment")}
                onMoveToConfirmed={openConfirmedStep}
              />
            ) : activePage === "confirmed" ? (
              <ApartmentPage
                mode="confirmed"
                apartment={selectedApartment}
                bookingDetails={bookingDetails}
                onBackToPayment={() => setActivePage("pending")}
                onFinishBooking={finishApartmentFlow}
              />
            ) : activePage === "shopDirectory" ? (
              <ShopDirectoryPage
                onBack={showHome}
                onShopSelect={showShop}
              />
            ) : activePage === "shopFood" ? (
              <ShopFoodPage
                mode="list"
                variant={shopVariant}
                onFoodSelect={showFoodDetail}
              />
            ) : activePage === "foodDetail" ? (
              <ShopFoodPage
                mode="detail"
                variant={shopVariant}
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                onOrderChange={handleFoodOrderChange}
                onBackToFood={() => setActivePage("shopFood")}
                onProceedToReview={() =>
                  setActivePage(
                    shopVariant === "food" ? "foodReview" : "foodPayment",
                  )
                }
              />
            ) : activePage === "foodReview" ? (
              <ShopFoodPage
                mode="review"
                variant={shopVariant}
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                onOrderChange={handleFoodOrderChange}
                onBackToFood={() => setActivePage("foodDetail")}
                onProceedToPayment={() => setActivePage("foodPayment")}
              />
            ) : activePage === "foodPayment" ? (
              <ShopFoodPage
                mode="payment"
                variant={shopVariant}
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                onOrderChange={handleFoodOrderChange}
                onBackToReview={() =>
                  setActivePage(
                    shopVariant === "food" ? "foodReview" : "foodDetail",
                  )
                }
                onPaymentContinue={() => setActivePage("foodStatus")}
              />
            ) : activePage === "foodStatus" ? (
              <ShopFoodPage
                mode="status"
                variant={shopVariant}
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                onFinishOrder={finishFoodOrderFlow}
              />
            ) : (
              <section className="home-page__listings">
                {filteredListingSections.length > 0 ? (
                  filteredListingSections.map((section) => (
                    <ListingSection
                      key={section.id}
                      section={section}
                      onApartmentSelect={showApartment}
                    />
                  ))
                ) : (
                  <div className="home-page__empty">
                    <h2>No apartments match your search</h2>
                    <p>
                      Try changing the residence, dates, or number of guests.
                    </p>
                    {hasApartmentFilters && (
                      <button
                        type="button"
                        onClick={clearApartmentSearch}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </section>
            )}
          </main>

          <Footer />
        </>
      )}

      <AuthModal
        key={authModalKey}
        isOpen={isAuthModalOpen}
        entryPoint={authEntry}
        onClose={closeAuthModal}
        onSwitchToLogin={openLogin}
        onSwitchToSignup={openSignup}
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
        socialAuthProvider={socialAuthProvider}
        socialAuthError={socialAuthError}
        onAuthComplete={handleAuthComplete}
      />
    </div>
  );
}

export default HomePage;
