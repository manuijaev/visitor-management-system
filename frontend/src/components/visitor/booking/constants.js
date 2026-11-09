export const STEPS = ["When", "Teacher", "Details", "Review"];
export const REVIEW_STEP = STEPS.length - 1;

export const STEP_TITLES = {
  visitor: [
    "When are you visiting?",
    "Who are you here to see?",
    "Your details",
    "Review and send",
  ],
  reception: [
    "When is the visit?",
    "Who are they here to see?",
    "Visitor details",
    "Review and send",
  ],
};

export const VISIT_MODES = [
  {
    id: "now",
    icon: "pin",
    title: "I'm here now",
    sub: "Waiting at reception",
  },
  { id: "onway", icon: "route", title: "On my way", sub: "Arriving shortly" },
  {
    id: "later",
    icon: "calendar",
    title: "Plan a visit",
    sub: "Pick a day and time",
  },
];

export const ETA_CHOICES = [10, 15, 30, 45, 60];
export const DEFAULT_ETA = 15;

export const PURPOSES = [
  "Parent–teacher meeting",
  "Admissions enquiry",
  "Fees / bursar",
  "Student pickup",
  "Counselling",
  "Other",
];

export const RECEPTION_RESET_SECONDS = 20;

export const ALL_DEPARTMENTS = "all";
