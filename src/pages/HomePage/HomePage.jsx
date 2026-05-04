import { useState } from "react";
import Header from "../../components/Header";
import SearchBar from "../../components/SearchBar";
import ListingSection from "../../components/ListingSection";
import { listingSections } from "../../data/listings";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import ProfilePage from "../Profile/ProfilePage";

const ACCOUNT_STORAGE_KEY = "bedrockRegisteredUser";

function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEntry, setAuthEntry] = useState("login");
  const [authModalKey, setAuthModalKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("home");
  const [profileInitialView, setProfileInitialView] = useState("profile");

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
    setCurrentUser(authenticatedUser);
    setActivePage("home");
    setIsAuthModalOpen(false);
  }

  function showHome() {
    setActivePage("home");
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

  function handleProfileSave(profileUpdates) {
    setCurrentUser((current) => {
      if (!current) return current;

      const updatedUser = {
        ...current,
        ...profileUpdates,
      };

      const savedAccount = JSON.parse(
        localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null",
      );

      localStorage.setItem(
        ACCOUNT_STORAGE_KEY,
        JSON.stringify({
          ...(savedAccount || {}),
          ...updatedUser,
        }),
      );

      return updatedUser;
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

  return (
    <div
      className={`home-page ${
        activePage === "profile" ? "home-page--profile" : ""
      }`}
    >
      {activePage === "profile" && currentUser ? (
        <ProfilePage
          user={currentUser}
          initialView={profileInitialView}
          onGoHome={showHome}
          onProfileSave={handleProfileSave}
          onPasswordChange={handlePasswordChange}
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
            onBecomeAgent={handleBecomeAgent}
            onLogout={handleLogout}
          />

          <main className="home-page__main">
            <SearchBar />

            <section className="home-page__listings">
              {listingSections.map((section) => (
                <ListingSection key={section.id} section={section} />
              ))}
            </section>
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
