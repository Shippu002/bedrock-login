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
  FiUploadCloud,
  FiUser,
  FiUsers,
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
import * as authApi from "../api/auth";
import * as profileApi from "../api/profile";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { normalizeBackendUser } from "../utils/backendUser";
import "../styles/auth-modal.css";

const ACCOUNT_STORAGE_KEY = "bedrockRegisteredUser";
const AUTH_DEBUG_ENABLED =
  import.meta.env.VITE_DEBUG_AUTH === "true";
const EMAIL_VERIFICATION_OTP_TYPE = "email_verification";

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

const initialResetData = {
  email: "",
  otp: "",
  password: "",
  confirmPassword: "",
};

const initialOtp = ["", "", "", "", "", ""];

const amenityOptions = [
  { id: "wifi", label: "Free WIFI", icon: FiWifi },
  { id: "gym", label: "Free Gym", icon: FaDumbbell },
  { id: "shuttle", label: "Airport shuttle", icon: FiTruck },
  { id: "breakfast", label: "Breakfast", icon: FiCoffee },
  { id: "restaurant", label: "Restaurant", icon: FaUtensils },
];

const agentAccountTypes = [
  {
    id: "individual",
    title: "Individual Agent",
    description:
      "Sign up as an independent travel agent with your personal details and government-issued ID.",
    icon: FiUser,
  },
  {
    id: "corporate",
    title: "Corporate Agent",
    description:
      "Register a business or agency team that refers guests and manages commissions.",
    icon: FiUsers,
  },
];

const agentDocumentTypes = [
  { id: "nin", label: "National ID / NIN" },
  { id: "passport", label: "International Passport" },
  { id: "drivers_license", label: "Driver's License" },
  { id: "voters_card", label: "Voter's Card" },
  { id: "cac", label: "CAC / Business Document" },
];

const unavailableUsernames = ["admin", "support", "bedrock", "takenname"];

function debugAuthFlow(event, details = {}) {
  if (!AUTH_DEBUG_ENABLED) return;

  console.debug("[Bedrock auth flow]", {
    event,
    ...details,
  });
}

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
  onGoogleSignIn,
  onAppleSignIn,
  socialAuthProvider = "",
  socialAuthError = "",
  onAuthComplete,
}) {
  const isAgentSignup = entryPoint === "agentSignup";
  const isSignupEntry = entryPoint === "signup" || isAgentSignup;
  const initialSignupStep = isAgentSignup ? "agentType" : "signup";
  const [selectedCountryId, setSelectedCountryId] = useState("NG");
  const [signupMode, setSignupMode] = useState(
    isAgentSignup ? "agent" : "guest",
  );
  const [formData, setFormData] = useState(initialFormData);
  const [loginData, setLoginData] = useState(initialLoginData);
  const [isReferralActive, setIsReferralActive] = useState(false);
  const [showSignupErrors, setShowSignupErrors] = useState(false);
  const [showLoginErrors, setShowLoginErrors] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [resetData, setResetData] = useState(initialResetData);
  const [showResetErrors, setShowResetErrors] = useState(false);
  const [resetErrorMessage, setResetErrorMessage] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] =
    useState(false);
  const [currentStep, setCurrentStep] = useState(
    isSignupEntry ? initialSignupStep : "login",
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
  const [agentAccountType, setAgentAccountType] = useState("individual");
  const [agentDocumentType, setAgentDocumentType] = useState("");
  const [agentDocumentFile, setAgentDocumentFile] = useState(null);
  const [agentDocumentPreviewName, setAgentDocumentPreviewName] = useState("");
  const [agentCertification, setAgentCertification] = useState(false);
  const [agentOnboardingError, setAgentOnboardingError] = useState("");

  const [referralCopied, setReferralCopied] = useState(false);
  const [authAction, setAuthAction] = useState("");
  const [signupErrorMessage, setSignupErrorMessage] = useState("");
  const [otpErrorMessage, setOtpErrorMessage] = useState("");
  const [pendingSessionUser, setPendingSessionUser] = useState(null);

  const selectedCountry =
    findCountryById(selectedCountryId) ||
    countryOptions[0];
  const selectedCurrency = selectedCountry.currency;
  const isSocialAuthLoading = Boolean(socialAuthProvider);
  const isAuthRequestLoading = Boolean(authAction);
  const isGoogleAuthLoading = socialAuthProvider === "google";
  const isAppleAuthLoading = socialAuthProvider === "apple";
  const modalRef = useDialogFocus(isOpen, { onClose: handleCloseModal });

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

  const resetErrors = {
    email: resetData.email.trim() === "",
    otp: currentStep === "resetPassword" && resetData.otp.trim() === "",
    password: resetData.password === "",
    confirmPassword: resetData.confirmPassword === "",
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

  const resetPasswordChecks = {
    uppercase: /[A-Z]/.test(resetData.password),
    lowercase: /[a-z]/.test(resetData.password),
    number: /\d/.test(resetData.password),
    length: resetData.password.length >= 8,
    special: /[^A-Za-z0-9]/.test(resetData.password),
  };

  const isResetPasswordStrong =
    Object.values(resetPasswordChecks).every(Boolean);
  const resetPasswordsMatch =
    resetData.password !== "" &&
    resetData.password === resetData.confirmPassword;

  useEffect(() => {
    if (!isOpen || currentStep !== "otpVerification" || resendTimer <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setResendTimer((currentValue) => currentValue - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isOpen, currentStep, resendTimer]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "relative";
    document.body.style.width = "100%";

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return undefined;

    const root = document.documentElement;
    const visualViewport = window.visualViewport;

    function updateAuthViewportSize() {
      const viewportHeight = visualViewport?.height || window.innerHeight;
      const viewportTop = visualViewport?.offsetTop || 0;

      root.style.setProperty("--auth-viewport-height", `${viewportHeight}px`);
      root.style.setProperty("--auth-viewport-top", `${viewportTop}px`);
    }

    updateAuthViewportSize();

    visualViewport?.addEventListener("resize", updateAuthViewportSize);
    visualViewport?.addEventListener("scroll", updateAuthViewportSize);
    window.addEventListener("resize", updateAuthViewportSize);

    return () => {
      visualViewport?.removeEventListener("resize", updateAuthViewportSize);
      visualViewport?.removeEventListener("scroll", updateAuthViewportSize);
      window.removeEventListener("resize", updateAuthViewportSize);
      root.style.removeProperty("--auth-viewport-height");
      root.style.removeProperty("--auth-viewport-top");
    };
  }, [isOpen]);

  function handleFieldChange(field, value) {
    const nextValue =
      field === "phone"
        ? normalizeLocalPhoneNumber(value, selectedCountry)
        : value;

    setFormData((currentData) => ({
      ...currentData,
      [field]: nextValue,
    }));
    setSignupErrorMessage("");
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

  function handleResetFieldChange(field, value) {
    const nextValue =
      field === "otp" ? value.replace(/\D/g, "").slice(0, 6) : value;

    setResetData((currentData) => ({
      ...currentData,
      [field]: nextValue,
    }));
    setShowResetErrors(false);
    setResetErrorMessage("");
  }

  function openForgotPassword() {
    setResetData({
      ...initialResetData,
      email: loginData.email.trim(),
    });
    setShowResetErrors(false);
    setResetErrorMessage("");
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
    setAuthAction("");
    setCurrentStep("forgotPassword");
  }

  function handleOtpChange(index, value) {
    const cleanedValue = value.replace(/\D/g, "").slice(-1);

    setOtp((currentOtp) => {
      const nextOtp = [...currentOtp];
      nextOtp[index] = cleanedValue;
      return nextOtp;
    });
    setOtpErrorMessage("");
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

  async function handlePasswordContinue() {
    if (!isPasswordStrong || !passwordsMatch || isAuthRequestLoading) {
      return;
    }

    setAuthAction("register");
    setSignupErrorMessage("");

    try {
      const fallbackUser = buildRegisteredUser();
      const register =
        signupMode === "agent" ? authApi.registerAgent : authApi.registerGuest;
      const endpoint =
        signupMode === "agent"
          ? authApi.authEndpoints.agentRegister
          : authApi.authEndpoints.guestRegister;

      debugAuthFlow("register-submit", {
        mode: signupMode,
        endpoint,
        email: formData.email.trim(),
        phoneCountry: selectedCountry.id,
        hasReferral: Boolean(formData.referral.trim()),
      });

      const response = await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: `${selectedCountry.dialCode} ${formData.phone}`,
        country: selectedCountry.name,
        countryCode: selectedCountry.id,
        password,
        passwordConfirmation: confirmPassword,
      });

      setPendingSessionUser(normalizeBackendUser(response, fallbackUser));
      setCurrentStep("emailConfirmation");
    } catch (error) {
      setSignupErrorMessage(
        error.message || "Unable to create your account. Please try again.",
      );
    } finally {
      setAuthAction("");
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
    const bookings = Array.isArray(account.bookings) ? account.bookings : [];
    const orders = Array.isArray(account.orders) ? account.orders : [];
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
      bookings,
      orders,
      messageCount,
    };
  }

  function getSignupEmail() {
    return formData.email.trim();
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
      messages: [],
      bookings: [],
      orders: [],
      messageCount: 0,
    };
  }

  function readSavedAccount() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function completeSignupSession() {
    const registeredUser = pendingSessionUser || buildSessionUser(buildRegisteredUser());

    resetModalState();

    if (onAuthComplete) {
      onAuthComplete(registeredUser);
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    if (!isLoginComplete) {
      setShowLoginErrors(true);
      setLoginErrorMessage("");
      return;
    }

    setAuthAction("login");

    try {
      debugAuthFlow("login-submit", {
        mode: "shared",
        endpoint: authApi.authEndpoints.login,
        email: loginData.email.trim(),
      });

      const response = await authApi.login({
        email: loginData.email.trim(),
        password: loginData.password,
      });
      const savedAccount = readSavedAccount() || {};
      const nextUser = normalizeBackendUser(response, {
        ...savedAccount,
        email: loginData.email.trim(),
      });

      resetModalState();

      if (onAuthComplete) {
        onAuthComplete(nextUser);
      }
    } catch (error) {
      setLoginErrorMessage(
        error.message || "Email or password is incorrect.",
      );
    } finally {
      setAuthAction("");
    }
  }

  async function handleForgotPasswordSubmit(event) {
    event.preventDefault();

    if (resetErrors.email) {
      setShowResetErrors(true);
      setResetErrorMessage("Enter the email address on your account.");
      return;
    }

    const email = resetData.email.trim();

    setAuthAction("forgotPassword");

    try {
      debugAuthFlow("forgot-password-submit", {
        mode: "shared",
        endpoint: authApi.authEndpoints.forgotPassword,
        email,
      });

      await authApi.forgotPassword(email);
      setResetData({
        ...initialResetData,
        email,
      });
      setShowResetErrors(false);
      setResetErrorMessage("");
      setCurrentStep("resetPassword");
    } catch (error) {
      setResetErrorMessage(
        error.message || "Unable to send reset instructions. Please try again.",
      );
    } finally {
      setAuthAction("");
    }
  }

  async function handleResetPasswordSubmit(event) {
    event.preventDefault();

    if (resetErrors.otp || resetErrors.password || resetErrors.confirmPassword) {
      setShowResetErrors(true);
      setResetErrorMessage("Enter your OTP, then enter and confirm your new password.");
      return;
    }

    if (!isResetPasswordStrong) {
      setShowResetErrors(true);
      setResetErrorMessage(
        "Use at least 8 characters with uppercase, lowercase, a number, and a special character.",
      );
      return;
    }

    if (!resetPasswordsMatch) {
      setShowResetErrors(true);
      setResetErrorMessage("Passwords do not match yet.");
      return;
    }

    const email = resetData.email.trim();

    setAuthAction("resetPassword");

    try {
      debugAuthFlow("reset-password-submit", {
        mode: "shared",
        endpoint: authApi.authEndpoints.resetPassword,
        email,
        hasOtp: Boolean(resetData.otp),
      });

      await authApi.resetPassword({
        email,
        otp: resetData.otp,
        password: resetData.password,
        passwordConfirmation: resetData.confirmPassword,
      });

      setLoginData({
        email,
        password: "",
      });
      setShowLoginErrors(false);
      setLoginErrorMessage("");
      setShowResetErrors(false);
      setResetErrorMessage("");
      setShowResetPassword(false);
      setShowResetConfirmPassword(false);
      setCurrentStep("resetPasswordSuccess");
    } catch (error) {
      setResetErrorMessage(
        error.message || "Unable to update your password. Please try again.",
      );
    } finally {
      setAuthAction("");
    }
  }

  function handleResetBackToLogin() {
    setResetData(initialResetData);
    setShowResetErrors(false);
    setResetErrorMessage("");
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
    setCurrentStep("login");
  }

  function resetModalState() {
    setSelectedCountryId("US");
    setSignupMode(isAgentSignup ? "agent" : "guest");
    setFormData(initialFormData);
    setLoginData(initialLoginData);
    setIsReferralActive(false);
    setShowSignupErrors(false);
    setShowLoginErrors(false);
    setShowLoginPassword(false);
    setLoginErrorMessage("");
    setResetData(initialResetData);
    setShowResetErrors(false);
    setResetErrorMessage("");
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
    setCurrentStep(isSignupEntry ? initialSignupStep : "login");
    setOtp(initialOtp);
    setResendTimer(60);
    setAuthAction("");
    setSignupErrorMessage("");
    setOtpErrorMessage("");
    setPendingSessionUser(null);

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
    setAgentAccountType("individual");
    setAgentDocumentType("");
    setAgentDocumentFile(null);
    setAgentDocumentPreviewName("");
    setAgentCertification(false);
    setAgentOnboardingError("");

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
    setSignupErrorMessage("");
    setCurrentStep("usernameCreation");
  }

  function handleSignupModeChange(nextMode) {
    setSignupMode(nextMode);
    setSignupErrorMessage("");
    setShowSignupErrors(false);

    if (nextMode === "agent") {
      setCurrentStep("agentType");
      return;
    }

    setCurrentStep("signup");
  }

  function handleAgentTypeContinue() {
    setSignupMode("agent");
    setCurrentStep("signup");
  }

  function handleAgentDocumentChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setAgentDocumentFile(file);
    setAgentDocumentPreviewName(file.name);
    setAgentOnboardingError("");
  }

  async function handleAgentDocumentSubmit(event) {
    event.preventDefault();

    if (!agentDocumentType || !agentDocumentFile || !agentCertification) {
      setAgentOnboardingError(
        "Select an ID type, upload your document, and confirm the declaration.",
      );
      return;
    }

    setAuthAction("submitAgentDocument");
    setAgentOnboardingError("");

    try {
      await profileApi.uploadDocument({
        file: agentDocumentFile,
        type: agentDocumentType,
        name: agentDocumentFile.name,
      });
      await profileApi.submitKyc();
      setCurrentStep("agentReview");
    } catch (error) {
      setAgentOnboardingError(
        error.message || "Unable to submit your verification document.",
      );
    } finally {
      setAuthAction("");
    }
  }

  async function openOtpVerificationStep() {
    setOtp(initialOtp);
    setResendTimer(60);
    setOtpErrorMessage("");
    setAuthAction("sendOtp");

    try {
      debugAuthFlow("resend-otp-before-verification", {
        mode: signupMode,
        endpoint: authApi.authEndpoints.resendOtp,
        email: getSignupEmail(),
        type: EMAIL_VERIFICATION_OTP_TYPE,
      });

      await authApi.resendOtp(getSignupEmail(), EMAIL_VERIFICATION_OTP_TYPE);
    } catch (error) {
      setOtpErrorMessage(
        error.message ||
          "We could not send a fresh OTP, but you can enter the code already sent to your email.",
      );
    } finally {
      setAuthAction("");
    }

    setCurrentStep("otpVerification");
  }

  async function handleOtpContinue() {
    const otpCode = otp.join("");

    if (otpCode.length !== initialOtp.length) {
      setOtpErrorMessage("Enter the complete OTP code.");
      return;
    }

    setAuthAction("verifyOtp");
    setOtpErrorMessage("");

    try {
      debugAuthFlow("verify-otp-submit", {
        mode: signupMode,
        endpoint: authApi.authEndpoints.verifyOtp,
        email: getSignupEmail(),
        type: EMAIL_VERIFICATION_OTP_TYPE,
        otpLength: otpCode.length,
      });

      const response = await authApi.verifyOtp(
        getSignupEmail(),
        otpCode,
        EMAIL_VERIFICATION_OTP_TYPE,
      );
      setPendingSessionUser((currentUser) =>
        normalizeBackendUser(response, currentUser || buildRegisteredUser()),
      );
      setCurrentStep("otpSuccess");
    } catch (error) {
      setOtpErrorMessage(error.message || "OTP verification failed.");
      setCurrentStep("otpFailed");
    } finally {
      setAuthAction("");
    }
  }

  async function handleResendCode() {
    setAuthAction("resendOtp");
    setOtpErrorMessage("");

    try {
      debugAuthFlow("resend-otp-submit", {
        mode: signupMode,
        endpoint: authApi.authEndpoints.resendOtp,
        email: getSignupEmail(),
        type: EMAIL_VERIFICATION_OTP_TYPE,
      });

      await authApi.resendOtp(getSignupEmail(), EMAIL_VERIFICATION_OTP_TYPE);
    } catch (error) {
      setOtpErrorMessage(error.message || "Unable to resend OTP.");
    } finally {
      setAuthAction("");
    }

    setOtp(initialOtp);
    setResendTimer(60);
  }

  function handleVerifiedProceed() {
    if (signupMode === "agent") {
      setCurrentStep("agentDocument");
      return;
    }

    setCurrentStep("travelPreferences");
  }

  function getModalClassName() {
    if (currentStep === "login") {
      return "auth-modal auth-modal--login";
    }

    if (currentStep === "signup") {
      return "auth-modal auth-modal--signup";
    }

    if (currentStep === "otpVerification") {
      return "auth-modal auth-modal--wide";
    }

    if (
      currentStep === "otpFailed" ||
      currentStep === "otpSuccess" ||
      currentStep === "resetPasswordSuccess"
    ) {
      return "auth-modal auth-modal--compact";
    }

    if (
      currentStep === "usernameCreation" ||
      currentStep === "forgotPassword" ||
      currentStep === "resetPassword"
    ) {
      return "auth-modal auth-modal--username";
    }

    if (currentStep === "travelPreferences") {
      return "auth-modal auth-modal--travel";
    }

    if (currentStep === "agentType" || currentStep === "agentDocument") {
      return "auth-modal auth-modal--agent";
    }

    if (currentStep === "agentReview") {
      return "auth-modal auth-modal--agent-status";
    }

    if (currentStep === "welcome") {
      return "auth-modal auth-modal--welcome";
    }

    return "auth-modal";
  }

  function renderSignupTabs() {
    return (
      <div className="auth-signup-tabs" role="tablist" aria-label="Signup type">
        <button
          type="button"
          className={signupMode === "guest" ? "is-active" : ""}
          onClick={() => handleSignupModeChange("guest")}
          role="tab"
          aria-selected={signupMode === "guest"}
        >
          Guest Sign Up
        </button>
        <button
          type="button"
          className={signupMode === "agent" ? "is-active" : ""}
          onClick={() => handleSignupModeChange("agent")}
          role="tab"
          aria-selected={signupMode === "agent"}
        >
          Agent Registration
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isSignupEntry ? "Create account" : "Login"}
    >
      <div className={getModalClassName()} ref={modalRef} tabIndex={-1}>
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

              <div className="auth-login__card">
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
                      onClick={() =>
                        setShowLoginPassword((current) => !current)
                      }
                    >
                      {showLoginPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </label>

                <button
                  type="button"
                  className="auth-login__forgot"
                  onClick={openForgotPassword}
                >
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
                  onClick={onGoogleSignIn}
                  disabled={isSocialAuthLoading}
                >
                  <FcGoogle className="auth-social-icon" />
                  <span>
                    {isGoogleAuthLoading
                      ? "Signing in..."
                      : "Login with Google"}
                  </span>
                </button>

                <button
                  type="button"
                  className="auth-social-button"
                  onClick={onAppleSignIn}
                  disabled={isSocialAuthLoading}
                >
                  <FaApple className="auth-social-icon auth-social-icon--apple" />
                  <span>
                    {isAppleAuthLoading ? "Signing in..." : "Login with Apple"}
                  </span>
                </button>

                {socialAuthError && (
                  <p className="auth-field-error">{socialAuthError}</p>
                )}

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={authAction === "login"}
                >
                  {authAction === "login" ? "Signing in..." : "Continue"}
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
              </div>
            </form>
          </>
        )}

        {currentStep === "forgotPassword" && (
          <div className="auth-reset">
            <button
              type="button"
              className="auth-back-button"
              onClick={() => setCurrentStep("login")}
            >
              <FiChevronLeft />
              <span>Back</span>
            </button>

            <h2 className="auth-reset__title">Forgot password</h2>
            <p className="auth-reset__subtitle">
              Enter the email linked to your account and create a new password.
            </p>

            <form
              className="auth-reset__form"
              onSubmit={handleForgotPasswordSubmit}
            >
              <label className="auth-field">
                <span className="auth-label">Email</span>
                <div className="auth-input-wrap auth-input-wrap--plain">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={resetData.email}
                    onChange={(event) =>
                      handleResetFieldChange("email", event.target.value)
                    }
                    className={
                      showResetErrors && resetErrors.email
                        ? "auth-input-error"
                        : ""
                    }
                    aria-invalid={showResetErrors && resetErrors.email}
                  />
                </div>
              </label>

              {resetErrorMessage && (
                <p className="auth-field-error">{resetErrorMessage}</p>
              )}

              <button
                type="submit"
                className="auth-primary-button"
                disabled={authAction === "forgotPassword"}
              >
                {authAction === "forgotPassword" ? "Sending..." : "Continue"}
              </button>
            </form>
          </div>
        )}

        {currentStep === "resetPassword" && (
          <div className="auth-reset">
            <button
              type="button"
              className="auth-back-button"
              onClick={() => setCurrentStep("forgotPassword")}
            >
              <FiChevronLeft />
              <span>Back</span>
            </button>

            <h2 className="auth-reset__title">Create new password</h2>
            <p className="auth-reset__subtitle">
              Use a new password for{" "}
              <span className="auth-reset__email">{resetData.email}</span>.
            </p>

            <form
              className="auth-reset__form"
              onSubmit={handleResetPasswordSubmit}
            >
              <label className="auth-field">
                <span className="auth-label">OTP</span>
                <div className="auth-input-wrap auth-input-wrap--plain">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={resetData.otp}
                    onChange={(event) =>
                      handleResetFieldChange("otp", event.target.value)
                    }
                    className={
                      showResetErrors && resetErrors.otp
                        ? "auth-input-error"
                        : ""
                    }
                    aria-invalid={showResetErrors && resetErrors.otp}
                  />
                </div>
              </label>

              <label className="auth-field">
                <span className="auth-label">New password</span>
                <div className="auth-password__input-wrap">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    value={resetData.password}
                    onChange={(event) =>
                      handleResetFieldChange("password", event.target.value)
                    }
                    className={
                      showResetErrors && resetErrors.password
                        ? "auth-input-error"
                        : ""
                    }
                    aria-invalid={showResetErrors && resetErrors.password}
                  />
                  <button
                    type="button"
                    className="auth-password__eye"
                    onClick={() =>
                      setShowResetPassword((current) => !current)
                    }
                  >
                    {showResetPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              <p className="auth-password__hint">
                Use a strong password you have not used here before.
              </p>

              <label className="auth-field">
                <span className="auth-label">Confirm new password</span>
                <div className="auth-password__input-wrap">
                  <input
                    type={showResetConfirmPassword ? "text" : "password"}
                    value={resetData.confirmPassword}
                    onChange={(event) =>
                      handleResetFieldChange(
                        "confirmPassword",
                        event.target.value,
                      )
                    }
                    className={
                      showResetErrors && resetErrors.confirmPassword
                        ? "auth-input-error"
                        : ""
                    }
                    aria-invalid={
                      showResetErrors && resetErrors.confirmPassword
                    }
                  />
                  <button
                    type="button"
                    className="auth-password__eye"
                    onClick={() =>
                      setShowResetConfirmPassword((current) => !current)
                    }
                  >
                    {showResetConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              <div className="auth-password__checks">
                <span
                  className={`auth-password__chip ${
                    resetPasswordChecks.uppercase ? "is-valid" : ""
                  }`}
                >
                  Uppercase
                </span>
                <span
                  className={`auth-password__chip ${
                    resetPasswordChecks.lowercase ? "is-valid" : ""
                  }`}
                >
                  Lowercase
                </span>
                <span
                  className={`auth-password__chip ${
                    resetPasswordChecks.number ? "is-valid" : ""
                  }`}
                >
                  Number
                </span>
                <span
                  className={`auth-password__chip ${
                    resetPasswordChecks.length ? "is-valid" : ""
                  }`}
                >
                  8 Character
                </span>
                <span
                  className={`auth-password__chip ${
                    resetPasswordChecks.special ? "is-valid" : ""
                  }`}
                >
                  Special character
                </span>
              </div>

              <p className="auth-password__hint">
                {resetData.confirmPassword && !resetPasswordsMatch
                  ? "Passwords do not match yet."
                  : "Create a strong password to continue."}
              </p>

              {resetErrorMessage && (
                <p className="auth-field-error">{resetErrorMessage}</p>
              )}

              <button
                type="submit"
                className="auth-primary-button"
                disabled={authAction === "resetPassword"}
              >
                {authAction === "resetPassword"
                  ? "Updating..."
                  : "Update password"}
              </button>
            </form>
          </div>
        )}

        {currentStep === "resetPasswordSuccess" && (
          <div className="auth-stage auth-stage--status">
            <div className="auth-stage__icon auth-stage__icon--success">
              <FiCheck />
            </div>

            <h2 className="auth-stage__title auth-stage__title--status">
              Password updated
            </h2>

            <p className="auth-stage__text auth-stage__text--status">
              You can now log in with your new password.
            </p>

            <button
              type="button"
              className="auth-primary-button auth-primary-button--accent"
              onClick={handleResetBackToLogin}
            >
              Back to login
            </button>
          </div>
        )}

        {currentStep === "signup" && (
          <>
            <button
              type="button"
              className="auth-close auth-close--mobile-back"
              onClick={handleCloseModal}
              aria-label="Close modal"
            >
              <FiX className="auth-close__desktop-icon" />
              <FiChevronLeft className="auth-close__mobile-icon" />
              <span>Back</span>
            </button>

            <form className="auth-form" onSubmit={handleSignupSubmit}>
              {renderSignupTabs()}

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
                onClick={onGoogleSignIn}
                disabled={isSocialAuthLoading}
              >
                <FcGoogle className="auth-social-icon" />
                <span>
                  {isGoogleAuthLoading
                    ? "Signing in..."
                    : "Sign up with Google"}
                </span>
              </button>

              <button
                type="button"
                className="auth-social-button"
                onClick={onAppleSignIn}
                disabled={isSocialAuthLoading}
              >
                <FaApple className="auth-social-icon auth-social-icon--apple" />
                <span>
                  {isAppleAuthLoading ? "Signing in..." : "Sign up with Apple"}
                </span>
              </button>

              {socialAuthError && (
                <p className="auth-field-error">{socialAuthError}</p>
              )}

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

        {currentStep === "agentType" && (
          <>
            <button
              type="button"
              className="auth-close auth-close--mobile-back"
              onClick={handleCloseModal}
              aria-label="Close modal"
            >
              <FiX className="auth-close__desktop-icon" />
              <FiChevronLeft className="auth-close__mobile-icon" />
              <span>Back</span>
            </button>

            <div className="auth-agent">
              {renderSignupTabs()}

              <div className="auth-agent__panel">
                <h2 className="auth-agent__title">Select account type</h2>
                <p className="auth-agent__subtitle">
                  Choose the type that best describes your agent account.
                </p>

                <div className="auth-agent__cards">
                  {agentAccountTypes.map((item) => {
                    const Icon = item.icon;
                    const isActive = agentAccountType === item.id;

                    return (
                      <button
                        type="button"
                        className={`auth-agent__card ${
                          isActive ? "is-active" : ""
                        }`}
                        onClick={() => setAgentAccountType(item.id)}
                        key={item.id}
                      >
                        <span className="auth-agent__radio" />
                        <span className="auth-agent__icon">
                          <Icon />
                        </span>
                        <strong>{item.title}</strong>
                        <em>{item.description}</em>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="auth-primary-button"
                  onClick={handleAgentTypeContinue}
                >
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
              </div>
            </div>
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
              disabled={authAction === "sendOtp"}
            >
              {authAction === "sendOtp" ? "Sending code..." : "Continue"}
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
              We&apos;ve sent a 6-digit verification code to your email address.
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
                    disabled={authAction === "resendOtp"}
                  >
                    {authAction === "resendOtp" ? "Resending..." : "Resend"}
                  </button>
                )}
              </p>

              {otpErrorMessage && (
                <p className="auth-field-error">{otpErrorMessage}</p>
              )}
            </div>

            <button
              type="button"
              className="auth-primary-button auth-primary-button--block-gap"
              onClick={handleOtpContinue}
              disabled={authAction === "verifyOtp"}
            >
              {authAction === "verifyOtp" ? "Verifying..." : "Continue"}
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
              {otpErrorMessage ||
                "We're sorry, something has gone wrong. Please try again."}
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

        {currentStep === "agentDocument" && (
          <form className="auth-agent-doc" onSubmit={handleAgentDocumentSubmit}>
            <h2 className="auth-agent-doc__title">Verification Document</h2>
            <p className="auth-agent-doc__subtitle">
              Upload a valid document so Bedrock can verify your agent account.
            </p>

            <label className="auth-field">
              <span className="auth-label">ID Document Type*</span>
              <div className="auth-select-wrap">
                <select
                  value={agentDocumentType}
                  onChange={(event) => {
                    setAgentDocumentType(event.target.value);
                    setAgentOnboardingError("");
                  }}
                >
                  <option value="">Select ID type</option>
                  {agentDocumentTypes.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="auth-select-arrow" />
              </div>
            </label>

            <div className="auth-field">
              <span className="auth-label">Upload Document*</span>

              {agentDocumentFile ? (
                <div className="auth-agent-doc__file">
                  <FiCheckCircle />
                  <span>
                    <strong>{agentDocumentPreviewName}</strong>
                    <em>
                      {(agentDocumentFile.size / 1024).toFixed(1)}KB
                    </em>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAgentDocumentFile(null);
                      setAgentDocumentPreviewName("");
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="auth-agent-doc__upload">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    onChange={handleAgentDocumentChange}
                    hidden
                  />
                  <FiUploadCloud />
                  <strong>Click to upload document</strong>
                  <span>PNG, JPG or PDF, max 5MB</span>
                </label>
              )}

              <p className="auth-agent-doc__helper">
                Ensure the document is clear, unedited and all information is
                visible.
              </p>
            </div>

            <label className="auth-agent-doc__certify">
              <input
                type="checkbox"
                checked={agentCertification}
                onChange={(event) => {
                  setAgentCertification(event.target.checked);
                  setAgentOnboardingError("");
                }}
              />
              <span>
                I certify that the information provided is true, accurate and
                complete to the best knowledge. I understand that providing
                false info may result in rejection of my application.
              </span>
            </label>

            {agentOnboardingError && (
              <p className="auth-field-error">{agentOnboardingError}</p>
            )}

            <div className="auth-username__actions">
              <button
                type="button"
                className="auth-username__back-button"
                onClick={() => setCurrentStep("otpSuccess")}
              >
                Back
              </button>

              <button
                type="submit"
                className="auth-username__continue-button"
                disabled={authAction === "submitAgentDocument"}
              >
                {authAction === "submitAgentDocument"
                  ? "Submitting..."
                  : "Submit Application"}
              </button>
            </div>
          </form>
        )}

        {currentStep === "agentReview" && (
          <div className="auth-agent-status">
            <div className="auth-agent-status__hero">
              <span className="auth-agent-status__icon">
                <FiRefreshCw />
              </span>
              <em>In Review</em>
              <h2>Application Under Review</h2>
              <p>
                Thank you for submitting your agent application. Our verification
                team is reviewing your documents. This process typically takes
                24-48 hours.
              </p>
            </div>

            <div className="auth-agent-status__timeline">
              {[
                "Application Submitted",
                "Document Verification",
                "Account Verified",
              ].map((item, index) => (
                <article key={item}>
                  <span className={index < 2 ? "is-done" : ""}>
                    {index < 2 ? <FiCheck /> : <FiRefreshCw />}
                  </span>
                  <div>
                    <strong>{item}</strong>
                    <em>
                      {new Intl.DateTimeFormat("en", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date())}
                    </em>
                  </div>
                </article>
              ))}
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
                onClick={() => setCurrentStep("signup")}
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

            {signupErrorMessage && (
              <p className="auth-field-error">{signupErrorMessage}</p>
            )}

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
                disabled={
                  authAction === "register" ||
                  !isPasswordStrong ||
                  !passwordsMatch
                }
              >
                {authAction === "register" ? "Creating account..." : "Continue"}
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
