import { inputClass } from "./TextInput";

export default function TextArea(props) {
  return <textarea className={inputClass({ multiline: true })} {...props} />;
}
