import Button from "../../ui/Button";
import Icon from "../Icon";

export default function PendingBanner({ pending, overdue, onReview }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[16px] border border-[#ecd3a4] bg-gold-light py-3 pr-3 pl-[18px] text-gold-dark max-[768px]:flex-wrap max-[768px]:items-start max-[768px]:px-4 max-[768px]:py-3.5">
      <Icon name="clock" size={18} />
      <p className="m-0 flex-1 text-[14px] text-ink-mid max-[768px]:flex-[1_1_calc(100%-40px)]">
        <strong className="text-ink">
          {pending} visit {pending === 1 ? "request is" : "requests are"}{" "}
          awaiting a response
        </strong>
        {overdue > 0 && ` · ${overdue} waiting longer than 30 minutes`}
      </p>
      <Button
        variant="outline"
        className="max-[768px]:flex-[1_1_100%] max-[768px]:justify-center"
        onClick={onReview}
      >
        Review
      </Button>
    </div>
  );
}
