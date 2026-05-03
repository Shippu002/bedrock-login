import { useState } from "react";
import Header from "../../components/Header";
import SearchBar from "../../components/SearchBar";
import ListingSection from "../../components/ListingSection";
import { listingSections } from "../../data/listings";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";

function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEntry, setAuthEntry] = useState("login");
  const [authModalKey, setAuthModalKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

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
    setIsAuthModalOpen(false);
  }

  function handleBecomeAgent() {
    console.log("Become agent clicked");
  }

  function handleLogout() {
    setCurrentUser(null);
  }

  return (
    <div className="home-page">
      <Header
        user={currentUser}
        onLogin={openLogin}
        onSignup={openSignup}
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
