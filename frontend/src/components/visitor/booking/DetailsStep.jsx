import ChoiceChips from "./ChoiceChips";
import ContactFields from "./ContactFields";
import Field from "./Field";
import { PURPOSES } from "./constants";
import Fields from "../ui/Fields";
import TextArea from "../ui/TextArea";
import TextInput from "../ui/TextInput";

export default function DetailsStep({ details, receptionMode, hostFirst }) {
  const { visitor, updateVisitor } = details;
  const togglePurpose = (purpose) =>
    updateVisitor("purpose", visitor.purpose === purpose ? "" : purpose);

  return (
    <Fields>
      <ContactFields details={details} receptionMode={receptionMode} />
      <Field
        label="Student name"
        optional
        hint="If the visit is about a student."
      >
        <TextInput
          autoComplete="off"
          maxLength={120}
          placeholder="e.g. Brian Otieno"
          value={visitor.studentName}
          onChange={(event) => updateVisitor("studentName", event.target.value)}
        />
      </Field>
      <Field label="Class / grade" optional>
        <TextInput
          autoComplete="off"
          maxLength={40}
          placeholder="e.g. Grade 5 East"
          value={visitor.studentClass}
          onChange={(event) =>
            updateVisitor("studentClass", event.target.value)
          }
        />
      </Field>
      <Field as="div" full label="Purpose" optional>
        <ChoiceChips
          options={PURPOSES}
          selected={visitor.purpose}
          onSelect={togglePurpose}
        />
      </Field>
      <Field full label={`Note for ${hostFirst || "the teacher"}`} optional>
        <TextArea
          rows={3}
          maxLength={300}
          placeholder="Anything they should know before you meet"
          value={visitor.message}
          onChange={(event) => updateVisitor("message", event.target.value)}
        />
      </Field>
    </Fields>
  );
}
