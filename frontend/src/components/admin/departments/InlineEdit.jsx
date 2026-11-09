import { useEffect, useRef, useState } from "react";
import Button from "../../ui/Button";
import Icon from "../Icon";
import { INPUT_SKIN } from "../styles";

export default function InlineEdit({
  value,
  label,
  onSave,
  onCancel,
  placeholder,
}) {
  const [text, setText] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (text.trim() && text.trim() !== value) onSave(text.trim());
    else onCancel();
  };
  return (
    <form className="flex w-full items-center gap-1" onSubmit={submit}>
      <input
        ref={inputRef}
        className={`${INPUT_SKIN} w-full flex-1 px-3 py-2`}
        aria-label={label}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
      />
      <Button type="submit" variant="icon-sm" aria-label="Save">
        <Icon name="check" size={14} />
      </Button>
      <Button variant="icon-sm" onClick={onCancel} aria-label="Cancel">
        <Icon name="x" size={14} />
      </Button>
    </form>
  );
}
