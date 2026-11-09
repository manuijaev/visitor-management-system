import Field from "./Field";
import TextInput from "../ui/TextInput";

const CONTACT_FIELDS = [
  {
    field: "name",
    full: true,
    error: "Please enter a full name.",
    autoComplete: "name",
    placeholder: "e.g. Sarah Kiprono",
  },
  {
    field: "phone",
    label: "Phone number",
    hint: "We text updates here, no internet needed.",
    error: "Enter a valid number, e.g. 0712 345 678.",
    type: "tel",
    autoComplete: "tel",
    placeholder: "0712 345 678",
  },
  {
    field: "email",
    label: "Email",
    optional: true,
    hint: "Get an email copy of updates.",
    error: "That email address looks incomplete.",
    type: "email",
    autoComplete: "email",
    placeholder: "you@example.com",
  },
];

export default function ContactFields({ details, receptionMode }) {
  const { visitor, touched, valid, updateVisitor, touch } = details;
  const nameLabel = receptionMode ? "Visitor's full name" : "Full name";

  return CONTACT_FIELDS.map((config) => {
    const invalid = touched[config.field] && !valid[config.field];
    return (
      <Field
        key={config.field}
        full={config.full}
        label={config.label || nameLabel}
        optional={config.optional}
        hint={config.hint}
        error={invalid ? config.error : ""}
      >
        <TextInput
          invalid={invalid}
          type={config.type}
          inputMode={config.type}
          autoComplete={receptionMode ? "off" : config.autoComplete}
          placeholder={config.placeholder}
          value={visitor[config.field]}
          onChange={(event) => updateVisitor(config.field, event.target.value)}
          onBlur={() => touch(config.field)}
        />
      </Field>
    );
  });
}
