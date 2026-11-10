import { useState } from "react";
import Input from "./ui/Input";

export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative block w-full">
      <Input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="absolute top-1/2 right-1.5 z-[1] inline-flex size-[38px] [transform:translateY(-50%)] cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0 font-[inherit] text-[15px] font-semibold text-ink-faint [box-shadow:none] hover:bg-[rgba(26,23,20,0.06)] hover:text-ink focus-visible:text-gold-dark focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold motion-safe:transition-[color,background] motion-safe:duration-150 [&_svg]:block [&_svg]:size-[18px]"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
