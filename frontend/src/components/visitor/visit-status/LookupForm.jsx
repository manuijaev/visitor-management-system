import Field from "../booking/Field";
import Button from "../ui/Button";
import ErrorNote from "../ui/ErrorNote";
import Fields from "../ui/Fields";
import TextInput from "../ui/TextInput";
import LookupHeading, { LOOKUP_BODY } from "./LookupHeading";

export default function LookupForm({
  reference,
  onReferenceChange,
  phone,
  onPhoneChange,
  error,
  loading,
  canLookUp,
  onSubmit,
}) {
  return (
    <form className={LOOKUP_BODY} onSubmit={onSubmit}>
      <LookupHeading eyebrow="Check your visit" title="Where's my visit?">
        Enter the reference from your visit pass and the phone number you booked
        with.
      </LookupHeading>
      <Fields>
        <Field full label="Reference">
          <TextInput
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="e.g. GP-00012"
            value={reference}
            onChange={(event) => onReferenceChange(event.target.value)}
          />
        </Field>
        <Field full label="Phone number">
          <TextInput
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0712 345 678"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
          />
        </Field>
      </Fields>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Button
        type="submit"
        grow
        className="mt-5 w-full"
        disabled={!canLookUp || loading}
      >
        {loading ? "Checking…" : "Check my visit"}
      </Button>
    </form>
  );
}
