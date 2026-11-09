import { useLocation, useSearchParams } from "react-router-dom";
import AppShell from "../components/visitor/AppShell";
import Card from "../components/visitor/ui/Card";
import ConfirmModal from "../components/ConfirmModal";
import LookupForm from "../components/visitor/visit-status/LookupForm";
import VisitResult from "../components/visitor/visit-status/VisitResult";
import useVisitLookup from "../components/visitor/visit-status/useVisitLookup";
import { hostNameOf } from "../components/visitor/visit-status/visitStatus";

export default function VisitStatusPage() {
  const [params] = useSearchParams();
  const { state } = useLocation();
  const lookup = useVisitLookup({
    initialReference: params.get("ref") || "",
    initialPhone: state?.phone || "",
  });
  const { visit } = lookup;

  return (
    <AppShell
      title="Check a visit"
      back={{ to: "/visits", label: "Back to my visits" }}
    >
      <Card>
        {visit ? (
          <VisitResult
            visit={visit}
            error={lookup.error}
            onCancel={lookup.askToCancel}
            onStartOver={lookup.startOver}
          />
        ) : (
          <LookupForm
            reference={lookup.reference}
            onReferenceChange={lookup.setReference}
            phone={lookup.phone}
            onPhoneChange={lookup.setPhone}
            error={lookup.error}
            loading={lookup.loading}
            canLookUp={lookup.canLookUp}
            onSubmit={lookup.lookUp}
          />
        )}
      </Card>

      <ConfirmModal
        isOpen={lookup.confirmingCancel}
        title="Cancel this visit?"
        message={
          visit
            ? `${hostNameOf(visit)} will be told you're no longer coming. This can't be undone.`
            : ""
        }
        confirmText="Yes, cancel"
        cancelText="Keep visit"
        loadingText="Cancelling"
        tone="danger"
        isLoading={lookup.cancelling}
        onConfirm={lookup.cancelVisit}
        onCancel={lookup.dismissCancel}
      />
    </AppShell>
  );
}
