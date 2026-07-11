interface ButtonDockProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: { label: string; onClick: () => void };
}

export default function ButtonDock({ label, onClick, disabled, secondary }: ButtonDockProps) {
  return (
    <div className="absolute bottom-0 left-0 w-full flex flex-col items-start z-20">
      <div className="h-4 w-full" />
      <div className="flex items-start gap-2 px-4 w-full">
        {secondary && (
          <button
            onClick={secondary.onClick}
            className="h-[52px] px-4 flex items-center justify-center rounded-full text-[17px] font-medium text-gray-60 whitespace-nowrap"
          >
            {secondary.label}
          </button>
        )}
        <button
          onClick={onClick}
          disabled={disabled}
          className={`flex-1 h-[52px] flex items-center justify-center rounded-full text-[17px] font-semibold transition-colors ${
            disabled ? 'bg-gray-30 text-gray-00 cursor-not-allowed' : 'bg-gray-100 text-gray-00 cursor-pointer'
          }`}
        >
          {label}
        </button>
      </div>
      <div className="h-[26px] w-full flex items-center justify-center">
        <div className="h-[5px] w-[134px] rounded-full bg-gray-100" />
      </div>
    </div>
  );
}
