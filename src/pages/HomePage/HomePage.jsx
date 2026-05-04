import { useState } from "react";
import Header from "../../components/Header";
import SearchBar from "../../components/SearchBar";
import ListingSection from "../../components/ListingSection";
import { listingSections } from "../../data/listings";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import ProfilePage from "../Profile/ProfilePage";
import ResidencePage from "../Residence/ResidencePage";
import ApartmentPage from "../Apartment/ApartmentPage";
import ShopFoodPage from "../ShopFood/ShopFoodPage";
import { foodItems } from "../../data/foodItems";
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

const ACCOUNT_STORAGE_KEY = "bedrockRegisteredUser";

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

function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEntry, setAuthEntry] = useState("login");
  const [authModalKey, setAuthModalKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("home");
  const [profileInitialView, setProfileInitialView] = useState("profile");
  const [selectedResidenceId, setSelectedResidenceId] = useState("opebi");
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(() =>
    createDefaultBookingDetails(),
  );
  const [selectedFoodItem, setSelectedFoodItem] = useState(foodItems[0]);
  const [foodOrderDetails, setFoodOrderDetails] = useState(() =>
    createDefaultFoodOrderDetails(),
  );

  function syncSavedAccount(nextUser) {
    const savedAccount = JSON.parse(
      localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null",
    );

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
    setAuthModalKey((current) => current + 1);
    setIsAuthModalOpen(true);
  }

  function openSignup() {
    setAuthEntry("signup");
    setAuthModalKey((current) => current + 1);
    setIsAuthModalOpen(true);
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false);
  }

  function handleAuthComplete(authenticatedUser) {
    updateCurrentUser(authenticatedUser);
    setActivePage("home");
    setIsAuthModalOpen(false);
  }

  function showHome() {
    setActivePage("home");
    setProfileInitialView("profile");
  }

  function showResidence(residenceId) {
    setSelectedResidenceId(residenceId);
    setActivePage("residence");
    setProfileInitialView("profile");
  }

  function showShop(shopId) {
    if (shopId !== "foods") {
      return;
    }

    setActivePage("shopFood");
    setProfileInitialView("profile");
  }

  function showApartment(apartment) {
    setSelectedApartment(decorateApartmentWithMedia(apartment));
    setBookingDetails(createDefaultBookingDetails());
    setActivePage("apartment");
    setProfileInitialView("profile");
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
            onBecomeAgent={handleBecomeAgent}
            onLogout={handleLogout}
          />

          <main className="home-page__main">
            {[
              "home",
              "residence",
              "apartment",
              "shopFood",
              "foodDetail",
              "foodReview",
            ].includes(activePage) && (
              <SearchBar onResidenceSelect={showResidence} />
            )}

            {activePage === "residence" ? (
              <ResidencePage
                residenceId={selectedResidenceId}
                onApartmentSelect={showApartment}
              />
            ) : activePage === "apartment" ? (
              <ApartmentPage
                mode="details"
                apartment={selectedApartment}
                bookingDetails={bookingDetails}
                onBookingChange={handleBookingChange}
                onOpenPayment={openPaymentStep}
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
            ) : activePage === "shopFood" ? (
              <ShopFoodPage mode="list" onFoodSelect={showFoodDetail} />
            ) : activePage === "foodDetail" ? (
              <ShopFoodPage
                mode="detail"
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                onOrderChange={handleFoodOrderChange}
                onProceedToReview={() => setActivePage("foodReview")}
              />
            ) : activePage === "foodReview" ? (
              <ShopFoodPage
                mode="review"
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                onOrderChange={handleFoodOrderChange}
                onBackToFood={() => setActivePage("foodDetail")}
                onProceedToPayment={() => setActivePage("foodPayment")}
              />
            ) : activePage === "foodPayment" ? (
              <ShopFoodPage
                mode="payment"
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                onOrderChange={handleFoodOrderChange}
                onBackToReview={() => setActivePage("foodReview")}
                onPaymentContinue={() => setActivePage("foodStatus")}
              />
            ) : activePage === "foodStatus" ? (
              <ShopFoodPage
                mode="status"
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                onFinishOrder={finishFoodOrderFlow}
              />
            ) : (
              <section className="home-page__listings">
                {listingSections.map((section) => (
                  <ListingSection
                    key={section.id}
                    section={section}
                    onApartmentSelect={showApartment}
                  />
                ))}
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
        onGoogleSignup={() => {}}
        onAppleSignup={() => {}}
        onAuthComplete={handleAuthComplete}
      />
    </div>
  );
}

export default HomePage;
