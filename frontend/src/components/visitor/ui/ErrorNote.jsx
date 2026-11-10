export default function ErrorNote({ children }) {
  return (
    <div
      className="mt-3.5 rounded-[14px] bg-red-light px-3.5 py-3 text-[13.5px] text-red"
      role="alert"
    >
      {children}
    </div>
  );
}
