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
  FaBriefcase,
  FaDumbbell,
  FaGlassCheers,
  FaUtensils,
} from "react-icons/fa";
import {
  countryOptions,
  findCountryByDialCode,
  findCountryById,
  findCountryByName,
  normalizeLocalPhoneNumber,
} from "../utils/countries";
import * as authApi from "../api/auth";
import { getAuthToken } from "../api/client";
import * as profileApi from "../api/profile";
import { useDialogFocus } from "../hooks/useDialogFocus";
import {
  isAgentPendingVerification,
  isAgentUser,
  mergeAgentVerificationStatus,
  normalizeBackendUser,
} from "../utils/backendUser";
import "../styles/auth-modal.css";

const ACCOUNT_STORAGE_KEY = "bedrockRegisteredUser";
const AUTH_DEBUG_ENABLED =
  import.meta.env.VITE_DEBUG_AUTH === "true";

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
  { id: "free_wifi", label: "Free WIFI", icon: FiWifi },
  { id: "free_gym", label: "Free Gym", icon: FaDumbbell },
  { id: "airport_shuttle", label: "Airport shuttle", icon: FiTruck },
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

function readSavedAccount() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function savePendingAgentAccount(user) {
  if (!user) return;

  try {
    localStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify({
        ...user,
        isAgent: true,
        agentStatus: user.agentStatus || "pending",
        isAgentVerified: false,
      }),
    );
  } catch {
    // Storage can fail in private browsing; the token still lets us re-check the server.
  }
}

function collectErrorText(value) {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectErrorText);
  if (typeof value === "object") {
    return Object.values(value).flatMap(collectErrorText);
  }

  return [];
}

function getLoginErrorMessage(error) {
  const errorText = [
    error?.message,
    ...collectErrorText(error?.data),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const emailNotRegisteredPhrases = [
    "email not found",
    "email does not exist",
    "email doesn't exist",
    "email is not registered",
    "email not registered",
    "email address not found",
    "account not found",
    "account does not exist",
    "account doesn't exist",
    "user not found",
    "user does not exist",
    "user doesn't exist",
    "no account",
    "no user",
    "not linked to an account",
    "not linked",
    "selected email is invalid",
    "selected email",
  ];
  const wrongPasswordPhrases = [
    "wrong password",
    "incorrect password",
    "invalid password",
    "password is incorrect",
    "password incorrect",
    "password does not match",
    "password doesn't match",
    "invalid credentials",
    "credentials do not match",
    "credentials don't match",
    "login failed",
  ];

  if (
    error?.status === 404 ||
    emailNotRegisteredPhrases.some((phrase) => errorText.includes(phrase))
  ) {
    return "This email is not registered to any account.";
  }

  if (
    wrongPasswordPhrases.some((phrase) => errorText.includes(phrase)) ||
    error?.status === 401 ||
    error?.status === 403
  ) {
    return "Wrong password.";
  }

  return error?.message || "Unable to sign in. Please try again.";
}

async function resolveServerVerifiedUser(user) {
  let nextUser = user;

  try {
    const profileResponse = await authApi.getCurrentUser();
    nextUser = normalizeBackendUser(profileResponse, nextUser);
  } catch (error) {
    debugAuthFlow("profile-refresh-after-login-failed", {
      message: error?.message || "Unable to refresh profile after login",
    });
  }

  if (!isAgentUser(nextUser)) {
    return nextUser;
  }

  try {
    const statusResponse = await authApi.getOnboardingStatus();
    return mergeAgentVerificationStatus(nextUser, statusResponse);
  } catch (error) {
    debugAuthFlow("agent-onboarding-status-failed", {
      message: error?.message || "Unable to confirm agent verification",
    });

    if (!isAgentPendingVerification(nextUser)) {
      return nextUser;
    }

    return {
      ...nextUser,
      isAgent: true,
      agentStatus: nextUser.agentStatus || "pending",
      isAgentVerified: false,
    };
  }
}

export default function AuthModal({
  isOpen,
  entryPoint = "login",
  onClose,
  onSwitchToLogin,
  onSwitchToSignup,
  onAuthComplete,
}) {
  const isAgentSignup = entryPoint === "agentSignup";
  const isAgentPendingEntry = entryPoint === "agentPending";
  const isAgentEntry = isAgentSignup || isAgentPendingEntry;
  const isSignupEntry = entryPoint === "signup" || isAgentSignup;
  const initialSignupStep = isAgentPendingEntry
    ? "agentReview"
    : isAgentSignup
      ? "agentType"
      : "signup";
  const [selectedCountryId, setSelectedCountryId] = useState("NG");
  const [signupMode, setSignupMode] = useState(
    isAgentEntry ? "agent" : "guest",
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
    isSignupEntry || isAgentPendingEntry ? initialSignupStep : "login",
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
  const [preferredAmenities, setPreferredAmenities] = useState(["free_gym"]);
  const [budgetRange, setBudgetRange] = useState("");
  const [showTravelErrors, setShowTravelErrors] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agentAccountType, setAgentAccountType] = useState("individual");
  const [agentDocumentType, setAgentDocumentType] = useState("");
  const [agentDocumentFile, setAgentDocumentFile] = useState(null);
  const [agentDocumentPreviewName, setAgentDocumentPreviewName] = useState("");
  const [agentCertification, setAgentCertification] = useState(false);
  const [agentOnboardingError, setAgentOnboardingError] = useState("");
  const [agentVerificationNotice, setAgentVerificationNotice] = useState("");
  const [agentStatusRefreshKey, setAgentStatusRefreshKey] = useState(0);
  const [isAgentVerificationRefreshing, setIsAgentVerificationRefreshing] =
    useState(false);

  const [referralCopied, setReferralCopied] = useState(false);
  const [authAction, setAuthAction] = useState("");
  const [signupErrorMessage, setSignupErrorMessage] = useState("");
  const [otpErrorMessage, setOtpErrorMessage] = useState("");
  const [pendingSessionUser, setPendingSessionUser] = useState(null);

  const selectedCountry =
    findCountryById(selectedCountryId) ||
    countryOptions[0];
  const selectedCurrency = selectedCountry.currency;
  const isAuthRequestLoading = Boolean(authAction);
  const hasBackendAuthSession = Boolean(getAuthToken());
  const modalRef = useDialogFocus(isOpen, { onClose: handleCloseModal });

  const showReferralTip = isReferralActive || formData.referral.trim() !== "";
  const formattedResendTimer = `00:${String(resendTimer).padStart(2, "0")}`;
  const signupNameParts = formData.fullName.trim().split(/\s+/).filter(Boolean);
  const signupEmail = formData.email.trim();
  const signupPhone = formData.phone.trim();
  const expectedPhoneLength = Number(selectedCountry.localPhoneLength) || 0;
  const isSignupEmailInvalid =
    signupEmail !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail);

  const generatedUsernames = buildUsernameSuggestions(formData.fullName);
  const suggestedUsername =
    generatedUsernames[suggestedUsernameIndex % generatedUsernames.length];
  const chosenUsername = customUsername.trim() || suggestedUsername;

  const signupErrors = {
    fullName: signupNameParts.length < 2,
    email: signupEmail === "" || isSignupEmailInvalid,
    phone:
      signupPhone === "" ||
      (expectedPhoneLength > 0 && signupPhone.length !== expectedPhoneLength),
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
  const travelErrors = {
    travelPurpose: travelPurpose === "",
    preferredAmenities: preferredAmenities.length === 0,
    budgetRange: budgetRange === "",
    agreedToTerms: !agreedToTerms,
  };
  const isTravelPreferencesComplete = !Object.values(travelErrors).some(Boolean);

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

  useEffect(() => {
    if (!isOpen || currentStep !== "agentReview") return undefined;

    let ignoreStatusResponse = false;

    async function checkAgentStatus() {
      await Promise.resolve();

      if (ignoreStatusResponse) return;

      if (!getAuthToken()) {
        setAgentVerificationNotice(
          "Please log in again so we can check your latest agent verification status.",
        );
        return;
      }

      setIsAgentVerificationRefreshing(true);

      try {
        const savedAccount = readSavedAccount() || {};
        const fallbackUser = pendingSessionUser ||
          normalizeBackendUser(savedAccount, {
            isAgent: true,
            agentStatus: "pending",
          });
        const serverCheckedUser = await resolveServerVerifiedUser({
          ...fallbackUser,
          isAgent: true,
          agentStatus: fallbackUser.agentStatus || "pending",
        });

        if (ignoreStatusResponse) return;

        if (!isAgentPendingVerification(serverCheckedUser)) {
          if (onAuthComplete) {
            onAuthComplete(serverCheckedUser);
          }

          return;
        }

        savePendingAgentAccount(serverCheckedUser);
        setPendingSessionUser((currentUser) => {
          if (
            currentUser?.agentStatus === serverCheckedUser.agentStatus &&
            currentUser?.isAgentVerified === serverCheckedUser.isAgentVerified
          ) {
            return currentUser;
          }

          return serverCheckedUser;
        });
      } finally {
        if (!ignoreStatusResponse) {
          setIsAgentVerificationRefreshing(false);
        }
      }
    }

    checkAgentStatus();

    const intervalId = window.setInterval(checkAgentStatus, 8000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkAgentStatus();
      }
    }

    window.addEventListener("focus", checkAgentStatus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      ignoreStatusResponse = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkAgentStatus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    agentStatusRefreshKey,
    currentStep,
    isOpen,
    onAuthComplete,
    pendingSessionUser,
  ]);

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

  async function handleUsernameContinue() {
    const normalizedUsername = chosenUsername.trim().toLowerCase();
    const localResult = evaluateUsername(normalizedUsername);

    if (!normalizedUsername || isAuthRequestLoading) {
      return;
    }

    if (localResult === "unavailable") {
      setUsernameFeedback("unavailable");
      return;
    }

    setAuthAction("createUsername");
    setSignupErrorMessage("");

    try {
      const availability = await authApi.checkUsername(normalizedUsername);

      if (!availability.available) {
        setUsernameFeedback("unavailable");
        return;
      }

      const response = await authApi.createGuestUsername(normalizedUsername);

      setUsernameFeedback("available");
      setPendingSessionUser((currentUser) =>
        normalizeBackendUser(response, currentUser || buildRegisteredUser()),
      );
      setCurrentStep("passwordCreation");
    } catch (error) {
      setSignupErrorMessage(
        error.message || "Unable to create your username. Please try again.",
      );
    } finally {
      setAuthAction("");
    }
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
      const setPassword =
        signupMode === "agent"
          ? authApi.setAgentPassword
          : authApi.setGuestPassword;
      const endpoint =
        signupMode === "agent"
          ? authApi.authEndpoints.agentRegisterStep2
          : authApi.authEndpoints.guestRegisterStep3;

      debugAuthFlow("password-submit", {
        mode: signupMode,
        endpoint,
        email: signupEmail.toLowerCase(),
      });

      const response = await setPassword({
        password,
        passwordConfirmation: confirmPassword,
      });

      setPendingSessionUser((currentUser) =>
        normalizeBackendUser(response, currentUser || fallbackUser),
      );
      setCurrentStep(signupMode === "agent" ? "agentDocument" : "travelPreferences");
    } catch (error) {
      setSignupErrorMessage(
        error.message || "Unable to create your account. Please try again.",
      );
    } finally {
      setAuthAction("");
    }
  }

  function toggleAmenity(id) {
    setShowTravelErrors(false);
    setSignupErrorMessage("");
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

  async function handleTravelContinue() {
    if (isAuthRequestLoading) {
      return;
    }

    if (!isTravelPreferencesComplete) {
      setShowTravelErrors(true);
      setSignupErrorMessage(
        "Complete your travel purpose, amenities, budget range, and terms agreement to continue.",
      );
      return;
    }

    setAuthAction("completeGuestRegistration");
    setSignupErrorMessage("");

    try {
      const response = await authApi.completeGuestRegistration({
        travelPurpose,
        preferredAmenities,
        budgetRange,
      });

      setPendingSessionUser((currentUser) =>
        normalizeBackendUser(response, currentUser || buildRegisteredUser()),
      );
      setCurrentStep("welcome");
    } catch (error) {
      setSignupErrorMessage(
        error.message || "Unable to complete your registration. Please try again.",
      );
    } finally {
      setAuthAction("");
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
      backendId: account.backendId || account.id || "",
      name: account.name,
      username: account.username,
      email: account.email,
      phone: normalizeLocalPhoneNumber(account.phone || "", accountCountry),
      state: account.state || "",
      country: account.country || "",
      countryCode: account.countryCode || "",
      currency: account.currency || "",
      profilePhoto: account.profilePhoto || "",
      accountType: account.accountType || "",
      role: account.role || "",
      roles: Array.isArray(account.roles) ? account.roles : [],
      isAgent: Boolean(account.isAgent),
      agentStatus: account.agentStatus || "",
      isAgentVerified: Boolean(account.isAgentVerified),
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
    const isAgent = signupMode === "agent";

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
      accountType: isAgent ? `${agentAccountType}_agent` : "guest",
      isAgent,
      agentStatus: isAgent ? "pending" : "",
      isAgentVerified: false,
      messages: [],
      bookings: [],
      orders: [],
      messageCount: 0,
    };
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
      const serverCheckedUser = await resolveServerVerifiedUser(nextUser);

      if (isAgentPendingVerification(serverCheckedUser)) {
        savePendingAgentAccount(serverCheckedUser);
        setSignupMode("agent");
        setPendingSessionUser(serverCheckedUser);
        setShowLoginErrors(false);
        setLoginErrorMessage("");
        setAgentVerificationNotice(
          "Your agent account is still waiting for ID card verification from the server. Access will open after approval.",
        );
        setCurrentStep("agentReview");
        return;
      }

      resetModalState();

      if (onAuthComplete) {
        onAuthComplete(serverCheckedUser);
      }
    } catch (error) {
      setLoginErrorMessage(getLoginErrorMessage(error));
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
    setSelectedCountryId("NG");
    setSignupMode(isAgentEntry ? "agent" : "guest");
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
    setCurrentStep(
      isSignupEntry || isAgentPendingEntry ? initialSignupStep : "login",
    );
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
    setPreferredAmenities(["free_gym"]);
    setBudgetRange("");
    setShowTravelErrors(false);
    setProfilePhotoPreview("");
    setAgreedToTerms(false);
    setAgentAccountType("individual");
    setAgentDocumentType("");
    setAgentDocumentFile(null);
    setAgentDocumentPreviewName("");
    setAgentCertification(false);
    setAgentOnboardingError("");
    setAgentVerificationNotice("");
    setAgentStatusRefreshKey(0);
    setIsAgentVerificationRefreshing(false);

    setReferralCopied(false);
  }

  function handleCloseModal() {
    resetModalState();
    onClose();
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();

    if (!isSignupComplete) {
      setShowSignupErrors(true);
      setSignupErrorMessage(
        "Enter your full name, a valid email address, and a complete phone number.",
      );
      return;
    }

    setAuthAction("startRegistration");
    setShowSignupErrors(false);
    setSignupErrorMessage("");

    try {
      const startRegistration =
        signupMode === "agent"
          ? authApi.startAgentRegistration
          : authApi.startGuestRegistration;
      const endpoint =
        signupMode === "agent"
          ? authApi.authEndpoints.agentRegisterStep1
          : authApi.authEndpoints.guestRegisterStep1;

      debugAuthFlow("registration-step1-submit", {
        mode: signupMode,
        endpoint,
        email: signupEmail.toLowerCase(),
        phoneCountry: selectedCountry.dialCode,
        hasReferral: Boolean(formData.referral.trim()),
      });

      const response = await startRegistration({
        accountType: agentAccountType,
        fullName: formData.fullName.trim(),
        email: signupEmail.toLowerCase(),
        phoneNumber: signupPhone,
        phoneCountryCode: selectedCountry.dialCode,
        referralCode: formData.referral.trim(),
      });

      setPendingSessionUser(normalizeBackendUser(response, buildRegisteredUser()));
      setCurrentStep("emailConfirmation");
    } catch (error) {
      setSignupErrorMessage(
        error.message || "Unable to start registration. Please try again.",
      );
    } finally {
      setAuthAction("");
    }
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
      });
      await authApi.submitAgentApplication();
      const pendingAgentUser = {
        ...(pendingSessionUser || buildSessionUser(buildRegisteredUser())),
        isAgent: true,
        agentStatus: "pending",
        isAgentVerified: false,
      };

      setPendingSessionUser(pendingAgentUser);
      savePendingAgentAccount(pendingAgentUser);
      setAgentVerificationNotice(
        "Your agent credentials have been submitted. Access stays locked until the server verifies your uploaded ID card.",
      );
      setCurrentStep("agentReview");
    } catch (error) {
      setAgentOnboardingError(
        error.message || "Unable to submit your verification document.",
      );
    } finally {
      setAuthAction("");
    }
  }

  async function openOtpVerificationStep({ resend = false } = {}) {
    setOtp(initialOtp);
    setResendTimer(60);
    setOtpErrorMessage("");

    const shouldSendCode = resend || signupMode === "agent";

    if (shouldSendCode) {
      setAuthAction("sendOtp");

      try {
        debugAuthFlow("resend-otp-before-verification", {
          mode: signupMode,
          endpoint: authApi.authEndpoints.resendOtp,
          email: getSignupEmail(),
        });

        await authApi.resendOtp(getSignupEmail());
      } catch (error) {
        setOtpErrorMessage(
          error.message ||
            "We could not send a fresh OTP, but you can enter the code already sent to your email.",
        );
      } finally {
        setAuthAction("");
      }
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
        otpLength: otpCode.length,
      });

      const response = await authApi.verifyOtp(getSignupEmail(), otpCode);
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
      });

      await authApi.resendOtp(getSignupEmail());
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
      setCurrentStep("passwordCreation");
      return;
    }

    setCurrentStep("usernameCreation");
  }

  function handleAgentReviewBackToLogin() {
    setAgentVerificationNotice("");

    if (onSwitchToLogin) {
      onSwitchToLogin();
      return;
    }

    setSignupMode("guest");
    setCurrentStep("login");
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
      aria-label={
        isAgentPendingEntry
          ? "Agent verification status"
          : isSignupEntry
            ? "Create account"
            : "Login"
      }
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
                {showSignupErrors && signupErrors.fullName && (
                  <p className="auth-field-error">
                    Enter both your first name and last name.
                  </p>
                )}
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
                {showSignupErrors && signupErrors.email && (
                  <p className="auth-field-error">
                    Enter a valid email address.
                  </p>
                )}
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
                {showSignupErrors && signupErrors.phone && (
                  <p className="auth-field-error">
                    Enter a complete {selectedCountry.dialCode} phone number.
                  </p>
                )}
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

              {signupErrorMessage && (
                <p className="auth-field-error">{signupErrorMessage}</p>
              )}

              <button
                type="submit"
                className="auth-primary-button"
                disabled={authAction === "startRegistration"}
              >
                {authAction === "startRegistration" ? "Sending code..." : "Continue"}
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
              there. Check your inbox and continue when you&apos;re ready.
            </p>

            <button
              type="button"
              className="auth-primary-button auth-primary-button--block-gap"
              onClick={() => openOtpVerificationStep()}
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
              onClick={() => openOtpVerificationStep({ resend: true })}
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
              <em>Verifying Credentials</em>
              <h2>Credentials Verification Pending</h2>
              <p>
                {agentVerificationNotice ||
                  "Thank you for submitting your agent application. Access stays locked until the server verifies your uploaded ID card."}
              </p>
            </div>

            <div className="auth-agent-status__timeline">
              {[
                "Application Submitted",
                "ID Card Verification",
                "Access Enabled",
              ].map((item, index) => (
                <article key={item}>
                  <span className={index === 0 ? "is-done" : ""}>
                    {index === 0 ? <FiCheck /> : <FiRefreshCw />}
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
              className="auth-secondary-button"
              onClick={() => setAgentStatusRefreshKey((current) => current + 1)}
              disabled={!hasBackendAuthSession || isAgentVerificationRefreshing}
            >
              {isAgentVerificationRefreshing
                ? "Checking status..."
                : "Check verification status"}
            </button>

            <button
              type="button"
              className="auth-primary-button auth-welcome__cta"
              onClick={handleAgentReviewBackToLogin}
            >
              Back to login
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
                disabled={authAction === "createUsername"}
              >
                {authAction === "createUsername" ? "Saving..." : "Continue"}
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
                onClick={() =>
                  setCurrentStep(signupMode === "agent" ? "otpSuccess" : "usernameCreation")
                }
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
                  onClick={() => {
                    setTravelPurpose("business");
                    setShowTravelErrors(false);
                    setSignupErrorMessage("");
                  }}
                >
                  <FaBriefcase className="auth-travel__chip-icon" />
                  <span>Business</span>
                </button>

                <button
                  type="button"
                  className={`auth-travel__chip ${
                    travelPurpose === "leisure" ? "is-active" : ""
                  }`}
                  onClick={() => {
                    setTravelPurpose("leisure");
                    setShowTravelErrors(false);
                    setSignupErrorMessage("");
                  }}
                >
                  <FaGlassCheers className="auth-travel__chip-icon" />
                  <span>Leisure</span>
                </button>
              </div>

              {showTravelErrors && travelErrors.travelPurpose && (
                <p className="auth-field-error">Choose your travel purpose.</p>
              )}
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

              {showTravelErrors && travelErrors.preferredAmenities && (
                <p className="auth-field-error">
                  Select at least one preferred amenity.
                </p>
              )}
            </div>

            <div className="auth-travel__section">
              <span className="auth-label">Budget Range (per night)</span>

              <div className="auth-select-wrap">
                <select
                  value={budgetRange}
                  onChange={(event) => {
                    setBudgetRange(event.target.value);
                    setShowTravelErrors(false);
                    setSignupErrorMessage("");
                  }}
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

              {showTravelErrors && travelErrors.budgetRange && (
                <p className="auth-field-error">Select your budget range.</p>
              )}
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
                onClick={() => {
                  setAgreedToTerms((current) => !current);
                  setShowTravelErrors(false);
                  setSignupErrorMessage("");
                }}
              >
                <span />
              </button>
            </div>

            {showTravelErrors && travelErrors.agreedToTerms && (
              <p className="auth-field-error">
                Agree to the Terms &amp; Condition to continue.
              </p>
            )}

            {signupErrorMessage && (
              <p className="auth-field-error">{signupErrorMessage}</p>
            )}

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
                disabled={authAction === "completeGuestRegistration"}
              >
                {authAction === "completeGuestRegistration"
                  ? "Finishing..."
                  : "Continue"}
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
