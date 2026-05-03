import { useState } from "react";
import Header from "../../components/Header";
import SearchBar from "../../components/SearchBar";
import ListingSection from "../../components/ListingSection";
import { listingSections } from "../../data/listings";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import { MessagesView, ProfileView } from "../../components/AccountViews";
import { getUserMessageCount } from "../../utils/userMessages";

const ACCOUNT_STORAGE_KEY = "bedrockRegisteredUser";

function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEntry, setAuthEntry] = useState("login");
  const [authModalKey, setAuthModalKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState("home");
  const messageCount = getUserMessageCount(currentUser);

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
    setActiveView("home");
    setIsAuthModalOpen(false);
  }

  function showHome() {
    setActiveView("home");
  }

  function showProfile() {
    if (!currentUser) {
      openLogin();
      return;
    }

    setActiveView("profile");
  }

  function showMessages() {
    if (!currentUser) {
      openLogin();
      return;
    }

    setActiveView("messages");
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

  function handleBecomeAgent() {
    console.log("Become agent clicked");
  }

  function handleLogout() {
    setCurrentUser(null);
    setActiveView("home");
  }

  return (
    <div className="home-page">
      <Header
        user={currentUser}
        activeView={activeView}
        onHome={showHome}
        onLogin={openLogin}
        onSignup={openSignup}
        onProfile={showProfile}
        onMessages={showMessages}
        onBecomeAgent={handleBecomeAgent}
        onLogout={handleLogout}
      />

      <main className="home-page__main">
        {activeView === "profile" && currentUser ? (
          <ProfileView
            user={currentUser}
            messageCount={messageCount}
            onHome={showHome}
            onMessages={showMessages}
            onProfile={showProfile}
            onProfileSave={handleProfileSave}
            onLogout={handleLogout}
          />
        ) : activeView === "messages" && currentUser ? (
          <MessagesView
            user={currentUser}
            messageCount={messageCount}
            onHome={showHome}
            onMessages={showMessages}
            onProfile={showProfile}
            onLogout={handleLogout}
          />
        ) : (
          <>
            <SearchBar />

            <section className="home-page__listings">
              {listingSections.map((section) => (
                <ListingSection key={section.id} section={section} />
              ))}
            </section>
          </>
        )}
      </main>

      {activeView === "home" && <Footer />}

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
