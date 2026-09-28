import React, { useState, useEffect } from 'react';
import {
  Download,
  ShieldCheck,
  Clock,
  HelpCircle,
  X,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface AutoBackupBarProps {
  autoBackupEnabled: boolean;
  onToggleAutoBackup: (enabled: boolean) => void;
  lastBackupTime: string | null;
  lastBackupFileName: string | null;
  pendingCountdown: number | null;
  onDownloadBackupNow: () => void;
}

export const AutoBackupBar: React.FC<AutoBackupBarProps> = ({
  autoBackupEnabled,
  onToggleAutoBackup,
  lastBackupTime,
  lastBackupFileName,
  pendingCountdown,
  onDownloadBackupNow,
}) => {
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);

  // Automatically show guide hint once if auto-backup triggers for the first time
  useEffect(() => {
    // No intrusive popup, user can open guide anytime or see inline notice
  }, [lastBackupTime]);

  return (
    <div className="bg-white rounded-2xl px-4 py-2.5 border border-slate-200/90 shadow-2xs mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
      {/* Left: Toggle & Status */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => onToggleAutoBackup(!autoBackupEnabled)}
          className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
            autoBackupEnabled
              ? 'bg-teal-50 text-teal-900 border-teal-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
          title="Bật/Tắt tự động tải file sao lưu JSON kèm ảnh sau khi thêm/sửa dữ liệu"
        >
          {autoBackupEnabled ? (
            <ToggleRight size={18} className="text-teal-700" />
          ) : (
            <ToggleLeft size={18} className="text-slate-400" />
          )}
          <span>Tự động tải sao lưu: {autoBackupEnabled ? 'BẬT' : 'TẮT'}</span>
        </button>

        {autoBackupEnabled && pendingCountdown !== null && pendingCountdown > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-pulse">
            <Clock size={12} className="text-amber-600" />
            <span>Tự động tải file sao lưu sau {pendingCountdown}s...</span>
          </span>
        )}

        {lastBackupTime && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200"
            title={lastBackupFileName || 'File sao lưu gần nhất'}
          >
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
            <span>Đã tải sao lưu lúc {lastBackupTime}</span>
          </span>
        )}

        {!lastBackupTime && pendingCountdown === null && (
          <span className="text-[11px] text-slate-500 hidden md:inline">
            Tự động tải file JSON (kèm ảnh) có gắn ngày giờ sau 25 giây khi có thay đổi
          </span>
        )}
      </div>

      {/* Right: Guide & Immediate Download Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowBrowserGuide(!showBrowserGuide)}
          className="text-[11px] font-medium text-slate-500 hover:text-teal-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Hướng dẫn nếu trình duyệt chặn tải tự động nhiều file"
        >
          <HelpCircle size={13} className="text-teal-700" />
          <span className="hidden sm:inline">Bị chặn tải tự động?</span>
        </button>

        <button
          type="button"
          onClick={onDownloadBackupNow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Download size={13} />
          <span>Tải sao lưu ngay</span>
        </button>
      </div>

      {/* Inline Browser Multi-file Download Permission Guide */}
      {showBrowserGuide && (
        <div className="w-full mt-2 p-3 bg-sky-50/90 border border-sky-200 rounded-xl text-[11px] text-sky-950 flex items-start justify-between gap-2">
          <div className="space-y-1 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-sky-900">
              <ShieldCheck size={14} className="text-sky-700 shrink-0" />
              <span>Hướng dẫn cho phép trình duyệt "Tải nhiều file tự động":</span>
            </div>
            <p className="text-sky-800">
              • Khi ứng dụng tự động tải file sao lưu lần thứ 2 trở đi, trình duyệt (Chrome/Safari/Edge) có thể hiện thông báo hỏi <strong>"Cho phép tải xuống nhiều tệp?" (Allow automatic downloads of multiple files)</strong>. Hãy bấm <strong>"Cho phép" (Allow)</strong> trên thanh địa chỉ.
            </p>
            <p className="text-sky-800">
              • Hoặc bạn luôn có thể bấm trực tiếp nút <strong>"Tải sao lưu ngay"</strong> ở bên phải để tải về ngay lập tức mà không bao giờ bị trình duyệt chặn.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBrowserGuide(false)}
            className="p-1 text-sky-600 hover:text-sky-900 rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
