const TZ = "Africa/Nairobi";

const STATUS_COPY = {
  Pending: {
    tone: "wait",
    title: "Waiting for a reply",
    text: (host) =>
      `${host} hasn't responded yet. We'll text you when they do.`,
  },
  Accepted: {
    tone: "ok",
    title: "Visit confirmed",
    text: (host) => `${host} is expecting you.`,
  },
  Rescheduled: {
    tone: "wait",
    title: "New time proposed",
    text: (host) => `${host} moved your visit to the time below.`,
  },
  Declined: {
    tone: "stop",
    title: "Visit declined",
    text: (host) => `${host} can't make this visit.`,
  },
  Cancelled: {
    tone: "stop",
    title: "Visit cancelled",
    text: () => "This visit has been cancelled.",
  },
  Expired: {
    tone: "stop",
    title: "Request closed",
    text: (host) =>
      `${host} couldn't reply in time, so this request was closed. Please book a new visit.`,
  },
};

const whenFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export const statusCopyFor = (status) =>
  STATUS_COPY[status] || STATUS_COPY.Pending;

export const hostNameOf = (visit) => visit?.staff_name || "Your host";

export const formatWhen = (value) => whenFormat.format(new Date(value));

export const errorMessage = (error) => {
  if (error?.response?.status === 429) {
    return "Too many attempts. Please wait a while and try again.";
  }
  if (!error?.response) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return (
    error.response.data?.detail || "Something went wrong. Please try again."
  );
};
