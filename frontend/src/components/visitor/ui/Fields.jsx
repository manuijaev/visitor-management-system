export default function Fields({ children }) {
  return (
    <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-3 gap-y-4 max-[519px]:grid-cols-[minmax(0,1fr)]">
      {children}
    </div>
  );
}
