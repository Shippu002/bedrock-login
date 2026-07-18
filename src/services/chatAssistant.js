import { bedrockFaqItems } from "../data/bedrockFaq";

const bookingGuideSteps = [
  {
    title: "Step 1",
    text: "Please select your Check-in Date.",
  },
  {
    title: "Step 2",
    text: "Select your Check-out Date.",
  },
  {
    title: "Step 3",
    text: "Choose the number of guests.",
  },
  {
    title: "Step 4",
    text: "Accept the residence and cancellation policy.",
  },
  {
    title: "Step 5",
    text: "Click Book Apartment to continue to payment.",
  },
];

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBookingGuideIntent(message) {
  const text = normalizeText(message);

  return [
    "how do i book",
    "book apartment",
    "help me book",
    "how to book",
    "booking guide",
  ].some((phrase) => text.includes(phrase));
}

function isNextStepIntent(message) {
  const text = normalizeText(message);

  return ["next", "done", "continue", "next step"].some((phrase) =>
    text.includes(phrase),
  );
}

function findFaqAnswer(message) {
  const text = normalizeText(message);

  if (!text) return null;

  return bedrockFaqItems.find((item) =>
    item.keywords.some((keyword) => text.includes(normalizeText(keyword))),
  );
}

export function createAssistantMessage(text, extras = {}) {
  return {
    id: `assistant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: "assistant",
    text,
    createdAt: new Date().toISOString(),
    ...extras,
  };
}

export function createUserMessage(text) {
  return {
    id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: "user",
    text,
    createdAt: new Date().toISOString(),
  };
}

export function getInitialAssistantMessage() {
  return createAssistantMessage(
    "Hi, I'm the Bedrock assistant. Ask me how to book, payment questions, cancellation policy, or apartment availability.",
    {
      quickReplies: ["How do I book?", "Payment methods", "Can I cancel?"],
    },
  );
}

export async function getAssistantResponse(message, guideState = {}) {
  if (isBookingGuideIntent(message)) {
    return {
      message: createAssistantMessage(
        `Welcome! I'll help you book your apartment.\n\n${bookingGuideSteps[0].title}\n${bookingGuideSteps[0].text}`,
        {
          quickReplies: ["Next step", "Start guided tour"],
        },
      ),
      guideState: {
        active: true,
        stepIndex: 0,
      },
    };
  }

  if (guideState.active && isNextStepIntent(message)) {
    const nextStepIndex = guideState.stepIndex + 1;
    const nextStep = bookingGuideSteps[nextStepIndex];

    if (!nextStep) {
      return {
        message: createAssistantMessage(
          "You're all set. Click Book Apartment to continue to payment.",
          {
            quickReplies: ["Start guided tour", "Contact support"],
          },
        ),
        guideState: {
          active: false,
          stepIndex: bookingGuideSteps.length - 1,
        },
      };
    }

    return {
      message: createAssistantMessage(`${nextStep.title}\n${nextStep.text}`, {
        quickReplies:
          nextStepIndex === bookingGuideSteps.length - 1
            ? ["Start guided tour", "Contact support"]
            : ["Next step", "Start guided tour"],
      }),
      guideState: {
        active: true,
        stepIndex: nextStepIndex,
      },
    };
  }

  const faqAnswer = findFaqAnswer(message);

  if (faqAnswer) {
    return {
      message: createAssistantMessage(faqAnswer.answer, {
        quickReplies: ["How do I book?", "Start guided tour", "Contact support"],
      }),
      guideState,
    };
  }

  return {
    message: createAssistantMessage(
      "I can help with booking, payments, cancellation, refunds, support, and apartment availability. Try asking: “How do I book?”",
      {
        quickReplies: ["How do I book?", "Payment methods", "Contact support"],
      },
    ),
    guideState,
  };
}
