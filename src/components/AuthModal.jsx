import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiCoffee,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiImage,
  FiMail,
  FiPackage,
  FiRefreshCw,
  FiTruck,
  FiWifi,
  FiX,
} from "react-icons/fi";
import {
  FaApple,
  FaBriefcase,
  FaDumbbell,
  FaGlassCheers,
  FaUtensils,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import {
  countryOptions,
  findCountryByDialCode,
  findCountryById,
  findCountryByName,
  normalizeLocalPhoneNumber,
} from "../utils/countries";
import "../styles/auth-modal.css";

const ACCOUNT_STORAGE_KEY = "bedrockRegisteredUser";

const initialFormData = {
  fullName: "",
  email: "",
  phone: "",
  referral: "",
};

const initialLoginData = {
  email: "",
  password: "",
};

const initialOtp = ["", "", "", "", "", ""];

const amenityOptions = [
  { id: "wifi", label: "Free WIFI", icon: FiWifi },
  { id: "gym", label: "Free Gym", icon: FaDumbbell },
  { id: "shuttle", label: "Airport shuttle", icon: FiTruck },
  { id: "breakfast", label: "Breakfast", icon: FiCoffee },
  { id: "restaurant", label: "Restaurant", icon: FaUtensils },
];

const unavailableUsernames = ["admin", "support", "bedrock", "takenname"];

function buildUsernameSuggestions(fullName) {
  const cleanedName = fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  if (!cleanedName) {
    return ["bedrockuser", "bedrock_user", "bedrockuser1"];
  }

  const parts = cleanedName.split(/\s+/);
  const joined = parts.join("");
  const underscored = parts.join("_");
  const dotted = parts.join(".");
  const numbered = `${joined}1`;

  return [...new Set([joined, underscored, dotted, numbered])];
}

export default function AuthModal({
  isOpen,
  entryPoint = "login",
  onClose,
  onSwitchToLogin,
  onSwitchToSignup,
  onGoogleSignup,
  onAppleSignup,
  onAuthComplete,
}) {
  const [selectedCountryId, setSelectedCountryId] = useState("US");
  const [formData, setFormData] = useState(initialFormData);
  const [loginData, setLoginData] = useState(initialLoginData);
  const [isReferralActive, setIsReferralActive] = useState(false);
  const [showSignupErrors, setShowSignupErrors] = useState(false);
  const [showLoginErrors, setShowLoginErrors] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(
    entryPoint === "signup" ? "signup" : "login",
  );

  const [otp, setOtp] = useState(initialOtp);
  const [resendTimer, setResendTimer] = useState(60);

  const [suggestedUsernameIndex, setSuggestedUsernameIndex] = useState(0);
  const [customUsername, setCustomUsername] = useState("");
  const [usernameFeedback, setUsernameFeedback] = useState("idle");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [travelPurpose, setTravelPurpose] = useState("business");
  const [preferredAmenities, setPreferredAmenities] = useState(["gym"]);
  const [budgetRange, setBudgetRange] = useState("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [referralCopied, setReferralCopied] = useState(false);

  const selectedCountry =
    findCountryById(selectedCountryId) ||
    countryOptions[0];
  const selectedCurrency = selectedCountry.currency;

  const showReferralTip = isReferralActive || formData.referral.trim() !== "";
  const formattedResendTimer = `00:${String(resendTimer).padStart(2, "0")}`;

  const generatedUsernames = buildUsernameSuggestions(formData.fullName);
  const suggestedUsername =
    generatedUsernames[suggestedUsernameIndex % generatedUsernames.length];
  const chosenUsername = customUsername.trim() || suggestedUsername;

  const signupErrors = {
    fullName: formData.fullName.trim() === "",
    email: formData.email.trim() === "",
    phone: formData.phone.trim() === "",
  };

  const loginErrors = {
    email: loginData.email.trim() === "",
    password: loginData.password.trim() === "",
  };

  const isSignupComplete =
    !signupErrors.fullName && !signupErrors.email && !signupErrors.phone;

  const isLoginComplete = !loginErrors.email && !loginErrors.password;

  const passwordChecks = {
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    length: password.length >= 8,
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password !== "" && password === confirmPassword;

  useEffect(() => {
    if (!isOpen || currentStep !== "otpVerification" || resendTimer <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setResendTimer((currentValue) => currentValue - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isOpen, currentStep, resendTimer]);

  function handleFieldChange(field, value) {
    const nextValue =
      field === "phone"
        ? normalizeLocalPhoneNumber(value, selectedCountry)
        : value;

    setFormData((currentData) => ({
      ...currentData,
      [field]: nextValue,
    }));
  }

  function handleCountryChange(countryId) {
    const nextCountry = findCountryById(countryId) || countryOptions[0];

    setSelectedCountryId(nextCountry.id);
    setFormData((currentData) => ({
      ...currentData,
      phone: normalizeLocalPhoneNumber(currentData.phone, nextCountry),
    }));
  }

  function handleLoginFieldChange(field, value) {
    setLoginData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
    setShowLoginErrors(false);
    setLoginErrorMessage("");
  }

  function handleOtpChange(index, value) {
    const cleanedValue = value.replace(/\D/g, "").slice(-1);

    setOtp((currentOtp) => {
      const nextOtp = [...currentOtp];
      nextOtp[index] = cleanedValue;
      return nextOtp;
    });
  }

  function evaluateUsername(value) {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      return "idle";
    }

    if (unavailableUsernames.includes(normalizedValue)) {
      return "unavailable";
    }

    return "available";
  }

  function handleUsernameContinue() {
    const result = evaluateUsername(chosenUsername);

    if (result === "unavailable") {
      setUsernameFeedback("unavailable");
      return;
    }

    if (usernameFeedback === "available") {
      setCurrentStep("passwordCreation");
      return;
    }

    setUsernameFeedback("available");
  }

  function handleRefreshSuggestedUsername() {
    setSuggestedUsernameIndex((currentIndex) =>
      currentIndex === generatedUsernames.length - 1 ? 0 : currentIndex + 1,
    );
    setCustomUsername("");
    setUsernameFeedback("idle");
  }

  function handleCustomUsernameChange(value) {
    setCustomUsername(value);

    if (!value.trim()) {
      setUsernameFeedback("idle");
      return;
    }

    setUsernameFeedback(evaluateUsername(value));
  }

  function handlePasswordContinue() {
    if (isPasswordStrong && passwordsMatch) {
      setCurrentStep("travelPreferences");
    }
  }

  function toggleAmenity(id) {
    setPreferredAmenities((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhotoPreview(String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  function handleTravelContinue() {
    if (agreedToTerms) {
      setCurrentStep("welcome");
    }
  }

  async function handleCopyReferralCode() {
    try {
      await navigator.clipboard.writeText(chosenUsername);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 1500);
    } catch {
      setReferralCopied(false);
    }
  }

  function buildSessionUser(account) {
    const messages = Array.isArray(account.messages) ? account.messages : [];
    const messageCount =
      account.messageCount ?? account.messagesCount ?? messages.length;
    const accountCountry =
      findCountryByName(account.country) ||
      findCountryByDialCode(account.countryCode);

    return {
      name: account.name,
      username: account.username,
      email: account.email,
      phone: normalizeLocalPhoneNumber(account.phone || "", accountCountry),
      state: account.state || "",
      country: account.country || "",
      countryCode: account.countryCode || "",
      currency: account.currency || "",
      profilePhoto: account.profilePhoto || "",
      messages,
      messageCount,
    };
  }

  function buildRegisteredUser() {
    const phone = normalizeLocalPhoneNumber(formData.phone, selectedCountry);

    return {
      name: formData.fullName.trim(),
      username: chosenUsername,
      email: formData.email.trim(),
      phone,
      state: "",
      country: selectedCountry.name,
      countryCode: selectedCountry.dialCode,
      currency: selectedCountry.currency,
      profilePhoto: profilePhotoPreview,
      password,
      messages: [],
      messageCount: 0,
    };
  }

  function completeSignupSession() {
    const registeredUser = buildRegisteredUser();

    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(registeredUser));

    resetModalState();

    if (onAuthComplete) {
      onAuthComplete(buildSessionUser(registeredUser));
    }
  }

  function handleLoginSubmit(event) {
    event.preventDefault();

    if (!isLoginComplete) {
      setShowLoginErrors(true);
      setLoginErrorMessage("");
      return;
    }

    const savedAccount = JSON.parse(
      localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null",
    );

    if (!savedAccount) {
      setLoginErrorMessage("No saved account found. Please sign up first.");
      return;
    }

    const emailMatches =
      savedAccount.email?.toLowerCase() ===
      loginData.email.trim().toLowerCase();

    const passwordMatches = savedAccount.password === loginData.password;

    if (!emailMatches || !passwordMatches) {
      setLoginErrorMessage("Email or password is incorrect.");
      return;
    }

    resetModalState();

    if (onAuthComplete) {
      onAuthComplete(buildSessionUser(savedAccount));
    }
  }

  function resetModalState() {
    setSelectedCountryId("US");
    setFormData(initialFormData);
    setLoginData(initialLoginData);
    setIsReferralActive(false);
    setShowSignupErrors(false);
    setShowLoginErrors(false);
    setShowLoginPassword(false);
    setLoginErrorMessage("");
    setCurrentStep(entryPoint === "signup" ? "signup" : "login");
    setOtp(initialOtp);
    setResendTimer(60);

    setSuggestedUsernameIndex(0);
    setCustomUsername("");
    setUsernameFeedback("idle");

    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);

    setTravelPurpose("business");
    setPreferredAmenities(["gym"]);
    setBudgetRange("");
    setProfilePhotoPreview("");
    setAgreedToTerms(false);

    setReferralCopied(false);
  }

  function handleCloseModal() {
    resetModalState();
    onClose();
  }

  function handleSignupSubmit(event) {
    event.preventDefault();

    if (!isSignupComplete) {
      setShowSignupErrors(true);
      return;
    }

    setShowSignupErrors(false);
    setCurrentStep("emailConfirmation");
  }

  function openOtpVerificationStep() {
    setOtp(initialOtp);
    setResendTimer(60);
    setCurrentStep("otpVerification");
  }

  function handleOtpContinue() {
    const otpCode = otp.join("");

    if (otpCode === "123456") {
      setCurrentStep("otpSuccess");
    } else {
      setCurrentStep("otpFailed");
    }
  }

  function handleResendCode() {
    setOtp(initialOtp);
    setResendTimer(60);
  }

  function handleVerifiedProceed() {
    setCurrentStep("usernameCreation");
  }

  function getModalClassName() {
    if (currentStep === "otpVerification") {
      return "auth-modal auth-modal--wide";
    }

    if (currentStep === "otpFailed" || currentStep === "otpSuccess") {
      return "auth-modal auth-modal--compact";
    }

    if (currentStep === "usernameCreation") {
      return "auth-modal auth-modal--username";
    }

    if (currentStep === "travelPreferences") {
      return "auth-modal auth-modal--travel";
    }

    if (currentStep === "welcome") {
      return "auth-modal auth-modal--welcome";
    }

    return "auth-modal";
  }

  if (!isOpen) return null;

  return (
    <div
      className="auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={entryPoint === "signup" ? "Create account" : "Login"}
    >
      <div className={getModalClassName()}>
        {currentStep === "login" && (
          <>
            <button
              type="button"
              className="auth-back-button auth-back-button--login"
              onClick={handleCloseModal}
            >
              <FiChevronLeft />
              <span>Back</span>
            </button>

            <form className="auth-login" onSubmit={handleLoginSubmit}>
              <h2 className="auth-login__title">Welcome back</h2>
              <p className="auth-login__subtitle">
                Enter your details to login to your account
              </p>

              <label className="auth-field">
                <span className="auth-label">Email</span>
                <div className="auth-input-wrap auth-input-wrap--plain">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={loginData.email}
                    onChange={(event) =>
                      handleLoginFieldChange("email", event.target.value)
                    }
                    className={
                      showLoginErrors && loginErrors.email
                        ? "auth-input-error"
                        : ""
                    }
                    aria-invalid={showLoginErrors && loginErrors.email}
                  />
                </div>
              </label>

              <label className="auth-field">
                <span className="auth-label">Password</span>
                <div className="auth-password__input-wrap">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={loginData.password}
                    onChange={(event) =>
                      handleLoginFieldChange("password", event.target.value)
                    }
                    className={
                      showLoginErrors && loginErrors.password
                        ? "auth-input-error"
                        : ""
                    }
                    aria-invalid={showLoginErrors && loginErrors.password}
                  />
                  <button
                    type="button"
                    className="auth-password__eye"
                    onClick={() => setShowLoginPassword((current) => !current)}
                  >
                    {showLoginPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              <button type="button" className="auth-login__forgot">
                Forgot password?
              </button>

              {loginErrorMessage && (
                <p className="auth-field-error">{loginErrorMessage}</p>
              )}

              <div className="auth-divider auth-divider--login">
                <span>OR</span>
              </div>

              <button
                type="button"
                className="auth-social-button"
                onClick={onGoogleSignup}
              >
                <FcGoogle className="auth-social-icon" />
                <span>Login with Google</span>
              </button>

              <button
                type="button"
                className="auth-social-button"
                onClick={onAppleSignup}
              >
                <FaApple className="auth-social-icon auth-social-icon--apple" />
                <span>Login with Apple</span>
              </button>

              <button type="submit" className="auth-primary-button">
                Continue
              </button>

              <p className="auth-login__footer">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={onSwitchToSignup}
                >
                  Signup
                </button>
              </p>
            </form>
          </>
        )}

        {currentStep === "signup" && (
          <>
            <button
              type="button"
              className="auth-close"
              onClick={handleCloseModal}
              aria-label="Close modal"
            >
              <FiX />
            </button>

            <form className="auth-form" onSubmit={handleSignupSubmit}>
              <label className="auth-field">
                <span className="auth-label">Full name</span>
                <div className="auth-input-wrap auth-input-wrap--plain">
                  <input
                    type="text"
                    placeholder="e.g Joe doe"
                    value={formData.fullName}
                    onChange={(event) =>
                      handleFieldChange("fullName", event.target.value)
                    }
                    className={
                      showSignupErrors && signupErrors.fullName
                        ? "auth-input-error"
                        : ""
                    }
                    aria-invalid={showSignupErrors && signupErrors.fullName}
                  />
                </div>
              </label>

              <label className="auth-field">
                <span className="auth-label">Email</span>
                <div className="auth-input-wrap auth-input-wrap--plain">
                  <input
                    type="email"
                    placeholder="e.g joe@example.com"
                    value={formData.email}
                    onChange={(event) =>
                      handleFieldChange("email", event.target.value)
                    }
                    className={
                      showSignupErrors && signupErrors.email
                        ? "auth-input-error"
                        : ""
                    }
                    aria-invalid={showSignupErrors && signupErrors.email}
                  />
                </div>
              </label>

              <div className="auth-phone-group">
                <span className="auth-label">Phone number</span>

                <div className="auth-phone-row">
                  <div className="auth-select-wrap">
                    <span className="auth-flag" aria-hidden="true">
                      {selectedCountry.flag}
                    </span>

                    <select
                      value={selectedCountryId}
                      onChange={(event) => handleCountryChange(event.target.value)}
                      aria-label="Country code"
                    >
                      {countryOptions.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.dialCode} {country.name}
                        </option>
                      ))}
                    </select>

                    <FiChevronDown className="auth-select-arrow" />
                  </div>

                  <div className="auth-input-wrap auth-input-wrap--plain">
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="9128671676"
                      value={formData.phone}
                      maxLength={selectedCountry.localPhoneLength}
                      onChange={(event) =>
                        handleFieldChange("phone", event.target.value)
                      }
                      className={
                        showSignupErrors && signupErrors.phone
                          ? "auth-input-error"
                          : ""
                      }
                      aria-invalid={showSignupErrors && signupErrors.phone}
                    />
                  </div>
                </div>
              </div>

              <label className="auth-field">
                <span className="auth-label">Referral code</span>
                <div className="auth-input-wrap auth-input-wrap--plain">
                  <input
                    type="text"
                    placeholder="e.g Joe doe"
                    value={formData.referral}
                    onChange={(event) =>
                      handleFieldChange("referral", event.target.value)
                    }
                    onFocus={() => setIsReferralActive(true)}
                    onClick={() => setIsReferralActive(true)}
                    onBlur={() => setIsReferralActive(false)}
                  />
                </div>
              </label>

              {showReferralTip && (
                <div className="auth-tip-box">
                  <span className="auth-tip-icon" aria-hidden="true">
                    💡
                  </span>
                  <p className="auth-tip-text">
                    Pro tip: enter referral code to enjoy the rock code e.g
                    Reginald&apos;s %6, Joe45
                  </p>
                </div>
              )}

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <button
                type="button"
                className="auth-social-button"
                onClick={onGoogleSignup}
              >
                <FcGoogle className="auth-social-icon" />
                <span>Sign up with Google</span>
              </button>

              <button
                type="button"
                className="auth-social-button"
                onClick={onAppleSignup}
              >
                <FaApple className="auth-social-icon auth-social-icon--apple" />
                <span>Sign up with Apple</span>
              </button>

              <button type="submit" className="auth-primary-button">
                Continue
              </button>

              <p className="auth-footer-text">
                Already have an account?{" "}
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={onSwitchToLogin}
                >
                  Log in
                </button>
              </p>
            </form>
          </>
        )}

        {currentStep === "emailConfirmation" && (
          <div className="auth-stage auth-stage--confirmation">
            <div className="auth-stage__icon auth-stage__icon--mail">
              <FiMail />
            </div>

            <p className="auth-stage__email">
              {formData.email.trim() || "name@example.com"}
            </p>

            <p className="auth-stage__text auth-stage__text--small-center">
              Is this email correct? we&apos;ll send you a confirmation code
              there
            </p>

            <button
              type="button"
              className="auth-primary-button auth-primary-button--block-gap"
              onClick={openOtpVerificationStep}
            >
              Continue
            </button>

            <button
              type="button"
              className="auth-secondary-button"
              onClick={() => setCurrentStep("signup")}
            >
              Update email address
            </button>
          </div>
        )}

        {currentStep === "otpVerification" && (
          <div className="auth-stage auth-stage--otp">
            <button
              type="button"
              className="auth-back-button"
              onClick={() => setCurrentStep("emailConfirmation")}
            >
              <FiChevronLeft />
              <span>Back</span>
            </button>

            <h2 className="auth-stage__title">Confirm your Email</h2>

            <p className="auth-stage__text auth-stage__text--centered">
              We&apos;ve sent a verification link to your email address.
            </p>

            <div className="auth-otp-block">
              <span className="auth-otp-label">Enter OTP</span>

              <div className="auth-otp-row">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    className="auth-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      handleOtpChange(index, event.target.value)
                    }
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>

              <p className="auth-otp-helper">
                Didn&apos;t get a code?{" "}
                {resendTimer > 0 ? (
                  <strong>Resend in {formattedResendTimer}</strong>
                ) : (
                  <button
                    type="button"
                    className="auth-resend-button"
                    onClick={handleResendCode}
                  >
                    Resend
                  </button>
                )}
              </p>
            </div>

            <button
              type="button"
              className="auth-primary-button auth-primary-button--block-gap"
              onClick={handleOtpContinue}
            >
              Continue
            </button>

            <button
              type="button"
              className="auth-secondary-button"
              onClick={() => setCurrentStep("emailConfirmation")}
            >
              Choose a different option
            </button>
          </div>
        )}

        {currentStep === "otpFailed" && (
          <div className="auth-stage auth-stage--status">
            <div className="auth-stage__icon auth-stage__icon--error">
              <FiX />
            </div>

            <h2 className="auth-stage__title auth-stage__title--status">
              Email verification failed
            </h2>

            <p className="auth-stage__text auth-stage__text--status">
              We&apos;re sorry, something has gone wrong please try later.
            </p>

            <button
              type="button"
              className="auth-secondary-button auth-secondary-button--retry"
              onClick={openOtpVerificationStep}
            >
              Retry
            </button>
          </div>
        )}

        {currentStep === "otpSuccess" && (
          <div className="auth-stage auth-stage--status">
            <div className="auth-stage__icon auth-stage__icon--success">
              <FiCheck />
            </div>

            <h2 className="auth-stage__title auth-stage__title--status">
              Email successfully verified
            </h2>

            <p className="auth-stage__text auth-stage__text--status">
              Your account is now email verified
            </p>

            <button
              type="button"
              className="auth-primary-button auth-primary-button--accent"
              onClick={handleVerifiedProceed}
            >
              Proceed
            </button>
          </div>
        )}

        {currentStep === "usernameCreation" && (
          <div className="auth-username">
            <h2 className="auth-username__title">Create Username</h2>

            <p className="auth-username__subtitle">
              Choose a strong password to protect your account
            </p>

            <div className="auth-username__group">
              <span className="auth-label">Username</span>

              <div className="auth-username__row">
                <div className="auth-username__input-wrap">
                  <FiPackage className="auth-username__input-icon" />
                  <input
                    type="text"
                    value={suggestedUsername}
                    readOnly
                    className="auth-username__input"
                  />
                  <FiCheckCircle className="auth-username__check-icon" />
                </div>

                <button
                  type="button"
                  className={`auth-username__refresh-button ${
                    usernameFeedback === "idle"
                      ? "auth-username__refresh-button--dark"
                      : ""
                  }`}
                  onClick={handleRefreshSuggestedUsername}
                  aria-label="Generate another username"
                >
                  <FiRefreshCw />
                </button>
              </div>

              <p className="auth-username__helper">
                This will also be your unique referral code to share with
                friends
              </p>

              {usernameFeedback === "available" && (
                <div className="auth-username__feedback auth-username__feedback--success">
                  <FiCheckCircle />
                  <span>Great! @{chosenUsername} is available</span>
                </div>
              )}

              {usernameFeedback === "unavailable" && (
                <div className="auth-username__feedback auth-username__feedback--error">
                  <FiAlertCircle />
                  <span>oooh! @{chosenUsername} is not available</span>
                </div>
              )}
            </div>

            <div className="auth-divider auth-divider--username">
              <span>OR</span>
            </div>

            <div className="auth-username__group">
              <span className="auth-label">Custom (Entry)</span>

              <div className="auth-input-wrap auth-input-wrap--plain">
                <input
                  type="text"
                  placeholder="e.g Joe doe"
                  value={customUsername}
                  onChange={(event) =>
                    handleCustomUsernameChange(event.target.value)
                  }
                />
              </div>

              <p className="auth-username__helper auth-username__helper--bottom">
                Your username will be used as your unique referral code. you can
                share it with friends to earn rock reward
              </p>
            </div>

            <div className="auth-username__actions">
              <button
                type="button"
                className="auth-username__back-button"
                onClick={() => setCurrentStep("otpSuccess")}
              >
                Back
              </button>

              <button
                type="button"
                className="auth-username__continue-button"
                onClick={handleUsernameContinue}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === "passwordCreation" && (
          <div className="auth-password">
            <h2 className="auth-password__title">Create a Password</h2>
            <p className="auth-password__subtitle">
              Choose a strong password to protect your account
            </p>

            <label className="auth-field">
              <span className="auth-label">Password</span>
              <div className="auth-password__input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="auth-password__eye"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <p className="auth-password__hint">
              Use a strong password you can remember.
            </p>

            <label className="auth-field">
              <span className="auth-label">Confirm Password</span>
              <div className="auth-password__input-wrap">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="auth-password__eye"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <div className="auth-password__checks">
              <span
                className={`auth-password__chip ${
                  passwordChecks.uppercase ? "is-valid" : ""
                }`}
              >
                Uppercase
              </span>
              <span
                className={`auth-password__chip ${
                  passwordChecks.lowercase ? "is-valid" : ""
                }`}
              >
                Lowercase
              </span>
              <span
                className={`auth-password__chip ${
                  passwordChecks.number ? "is-valid" : ""
                }`}
              >
                Number
              </span>
              <span
                className={`auth-password__chip ${
                  passwordChecks.length ? "is-valid" : ""
                }`}
              >
                8 Character
              </span>
              <span
                className={`auth-password__chip ${
                  passwordChecks.special ? "is-valid" : ""
                }`}
              >
                Special character
              </span>
            </div>

            <p className="auth-password__hint">
              {confirmPassword && !passwordsMatch
                ? "Passwords do not match yet."
                : "Create a strong password to continue."}
            </p>

            <div className="auth-username__actions">
              <button
                type="button"
                className="auth-username__back-button"
                onClick={() => setCurrentStep("usernameCreation")}
              >
                Back
              </button>

              <button
                type="button"
                className="auth-username__continue-button"
                onClick={handlePasswordContinue}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === "travelPreferences" && (
          <div className="auth-travel">
            <h2 className="auth-travel__title">Travel preferences</h2>
            <p className="auth-travel__subtitle">
              Help us personalize your experience and recommendations
            </p>

            <div className="auth-travel__section">
              <span className="auth-label">Primary travel purpose</span>

              <div className="auth-travel__chips">
                <button
                  type="button"
                  className={`auth-travel__chip ${
                    travelPurpose === "business" ? "is-active" : ""
                  }`}
                  onClick={() => setTravelPurpose("business")}
                >
                  <FaBriefcase className="auth-travel__chip-icon" />
                  <span>Business</span>
                </button>

                <button
                  type="button"
                  className={`auth-travel__chip ${
                    travelPurpose === "leisure" ? "is-active" : ""
                  }`}
                  onClick={() => setTravelPurpose("leisure")}
                >
                  <FaGlassCheers className="auth-travel__chip-icon" />
                  <span>Leisure</span>
                </button>
              </div>
            </div>

            <div className="auth-travel__section">
              <span className="auth-label">Preferred Amenities</span>

              <div className="auth-travel__chips auth-travel__chips--wrap">
                {amenityOptions.map((amenity) => (
                  <button
                    key={amenity.id}
                    type="button"
                    className={`auth-travel__chip ${
                      preferredAmenities.includes(amenity.id) ? "is-active" : ""
                    }`}
                    onClick={() => toggleAmenity(amenity.id)}
                  >
                    <amenity.icon className="auth-travel__chip-icon" />
                    <span>{amenity.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-travel__section">
              <span className="auth-label">Budget Range (per night)</span>

              <div className="auth-select-wrap">
                <select
                  value={budgetRange}
                  onChange={(event) => setBudgetRange(event.target.value)}
                >
                  <option value="">Select</option>
                  <option value="budget">Below {selectedCurrency} 100,000</option>
                  <option value="mid">
                    {selectedCurrency} 100,000 - {selectedCurrency} 250,000
                  </option>
                  <option value="luxury">Above {selectedCurrency} 250,000</option>
                </select>

                <FiChevronDown className="auth-select-arrow" />
              </div>
            </div>

            <div className="auth-travel__section">
              <span className="auth-label">Profile photo</span>

              <div className="auth-travel__photo-row">
                <div className="auth-travel__avatar">
                  {profilePhotoPreview ? (
                    <img src={profilePhotoPreview} alt="Profile preview" />
                  ) : (
                    <FiImage />
                  )}
                </div>

                <label className="auth-travel__upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    hidden
                  />
                  <span>Upload photo</span>
                </label>
              </div>

              <p className="auth-travel__helper">
                Optional you can do this later
              </p>
            </div>

            <div className="auth-travel__terms">
              <p>
                I agree to Bedrock <strong>Terms &amp; Condition</strong>
              </p>

              <button
                type="button"
                className={`auth-travel__toggle ${
                  agreedToTerms ? "is-on" : ""
                }`}
                onClick={() => setAgreedToTerms((current) => !current)}
              >
                <span />
              </button>
            </div>

            <div className="auth-username__actions">
              <button
                type="button"
                className="auth-username__back-button"
                onClick={() => setCurrentStep("passwordCreation")}
              >
                Back
              </button>

              <button
                type="button"
                className="auth-username__continue-button"
                onClick={handleTravelContinue}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === "welcome" && (
          <div className="auth-welcome">
            <div className="auth-welcome__icon">
              <FiCheck />
            </div>

            <h2 className="auth-welcome__title">Welcome to Rock Residencies</h2>

            <p className="auth-welcome__text">
              We&apos;ve successfully verified your details. You&apos;re ready
              to proceed.
            </p>

            <div className="auth-welcome__referral-card">
              <span className="auth-welcome__referral-label">
                Your referral code:
              </span>

              <div className="auth-welcome__referral-row">
                <strong>{chosenUsername}</strong>

                <button
                  type="button"
                  className="auth-welcome__copy"
                  onClick={handleCopyReferralCode}
                >
                  <FiCopy />
                </button>
              </div>

              <small>
                {referralCopied
                  ? "Copied!"
                  : "Share this with friends to earn rewards!"}
              </small>
            </div>

            <button
              type="button"
              className="auth-primary-button auth-welcome__cta"
              onClick={completeSignupSession}
            >
              Let&apos;s create an experience
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
