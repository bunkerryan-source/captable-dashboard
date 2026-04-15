"use client";

interface FileUploadZoneProps {
  onFilesSelected?: (files: FileList) => void;
  className?: string;
}

export function FileUploadZone({ onFilesSelected, className = "" }: FileUploadZoneProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-[0.03em]">
        Supporting Documents
      </label>
      <label
        className={`
          flex flex-col items-center justify-center
          border-[1.5px] border-dashed border-border-strong rounded-lg
          px-4 py-5 cursor-pointer
          hover:bg-surface-alt hover:border-trust-blue/40
          transition-colors duration-150
          ${className}
        `}
      >
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && onFilesSelected) {
              onFilesSelected(e.target.files);
            }
          }}
        />
        <span className="text-[13px] text-text-secondary text-center leading-relaxed">
          Drag files here or{" "}
          <span className="text-trust-blue font-medium">browse</span>
          <br />
          <span className="text-text-tertiary text-[11px]">
            Gift letters, transfer agreements, court orders, board resolutions
          </span>
        </span>
      </label>
    </div>
  );
}
