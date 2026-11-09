import cx from "./cx";

export default function Card({ as: Tag = "section", className, ...rest }) {
  return (
    <Tag
      className={cx(
        "relative z-[3] flex w-full min-w-0 scroll-mt-[76px] flex-col rounded-[28px] border border-solid border-line bg-surface [box-shadow:0_34px_80px_-44px_rgba(26,23,20,0.5),0_2px_8px_rgba(26,23,20,0.07)] max-[759px]:rounded-3xl",
        className,
      )}
      {...rest}
    />
  );
}
