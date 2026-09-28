import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  HardDrive,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Cpu,
  Smartphone,
  Info,
} from 'lucide-react';
import { getUserApiKey, setUserApiKey, testGeminiApiKey } from '../utils/gemini';
import { requestPersistentStorage } from '../utils/db';
import { saveOrDownloadFile, isNativeAppOrWebView } from '../utils/fileSaver';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoBackupEnabled: boolean;
  onToggleAutoBackup: (enabled: boolean) => void;
  onManualBackup: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  autoBackupEnabled,
  onToggleAutoBackup,
  onManualBackup,
}) => {
  // Gemini API Key state
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  // Storage Persistence state
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [storageInfo, setStorageInfo] = useState<{
    usageMB: string;
    quotaMB: string;
  } | null>(null);
  const [isCheckingStorage, setIsCheckingStorage] = useState(false);

  // Network & Environment state
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isNativeWrapper, setIsNativeWrapper] = useState(false);

  // Test File Saving
  const [testFileStatus, setTestFileStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentKey = getUserApiKey();
      setApiKey(currentKey);
      setKeyTestStatus({ type: 'idle', message: '' });
      checkPersistenceStatus();
      setIsNativeWrapper(isNativeAppOrWebView());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPersistenceStatus = async () => {
    setIsCheckingStorage(true);
    try {
      const res = await requestPersistentStorage();
      setIsPersisted(res.persisted);
      if (res.usage !== undefined && res.quota !== undefined) {
        setStorageInfo({
          usageMB: (res.usage / (1024 * 1024)).toFixed(1),
          quotaMB: (res.quota / (1024 * 1024 * 1024)).toFixed(1) + ' GB',
        });
      }
    } catch (err) {
      console.warn('Storage check error:', err);
    } finally {
      setIsCheckingStorage(false);
    }
  };

  const handleSaveApiKey = () => {
    setUserApiKey(apiKey.trim());
    setKeyTestStatus({
      type: 'success',
      message: apiKey.trim()
        ? 'Đã lưu khóa API thành công vào bộ nhớ máy này.'
        : 'Đã xóa khóa API. Ứng dụng sẽ sử dụng chế độ nhập thủ công.',
    });
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setUserApiKey('');
    setKeyTestStatus({
      type: 'idle',
      message: 'Đã xóa khóa API khỏi thiết bị.',
    });
  };

  const handleTestApiKey = async () => {
    const keyToTest = apiKey.trim() || getUserApiKey();
    if (!keyToTest) {
      setKeyTestStatus({
        type: 'error',
        message: 'Vui lòng dán khóa API trước khi kiểm tra.',
      });
      return;
    }

    if (!isOnline) {
      setKeyTestStatus({
        type: 'error',
        message: 'Thiết bị đang ngoại tuyến. Vui lòng kết nối mạng để kiểm tra khóa API.',
      });
      return;
    }

    setIsTestingKey(true);
    setKeyTestStatus({ type: 'idle', message: '' });

    try {
      const result = await testGeminiApiKey(keyToTest);
      if (result.success) {
        // Also save if successful
        setUserApiKey(keyToTest);
        setKeyTestStatus({
          type: 'success',
          message: 'Kết nối thành công! Khóa API Gemini hoạt động tốt.',
        });
      } else {
        setKeyTestStatus({
          type: 'error',
          message: result.message || 'Khóa API không hợp lệ hoặc bị từ chối kết nối.',
        });
      }
    } catch (err: any) {
      setKeyTestStatus({
        type: 'error',
        message: err?.message || 'Lỗi kết nối khi gửi yêu cầu kiểm tra.',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleRequestStoragePersist = async () => {
    setIsCheckingStorage(true);
    try {
      if (navigator.storage && navigator.storage.persist) {
        const persisted = await navigator.storage.persist();
        setIsPersisted(persisted);
        await checkPersistenceStatus();
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsCheckingStorage(false);
    }
  };

  const handleTestFileSave = async () => {
    setTestFileStatus('Đang tạo và lưu file thử nghiệm...');
    try {
      const dummyBlob = new Blob(
        ['Kiểm tra tính năng lưu file trên thiết bị Android / PWA / WebView thành công!\nThời gian: ' + new Date().toLocaleString('vi-VN')],
        { type: 'text/plain;charset=utf-8' }
      );
      const res = await saveOrDownloadFile({
        blob: dummyBlob,
        fileName: 'Kiem_Tra_Luu_File.txt',
        mimeType: 'text/plain',
        title: 'Kiểm tra lưu file',
        text: 'File kiểm tra chức năng lưu trên thiết bị',
      });

      if (res.success) {
        setTestFileStatus(`Thành công! Phương thức: ${res.method}${res.pathOrUri ? ` (${res.pathOrUri})` : ''}`);
      } else {
        setTestFileStatus(`Không thành công: ${res.error || 'Lỗi không xác định'}`);
      }
    } catch (err: any) {
      setTestFileStatus(`Lỗi: ${err?.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Cài Đặt &amp; Chuẩn Bị Android APK
              </h3>
              <p className="text-xs text-slate-500">
                Khóa Gemini API, lưu trữ bền vững &amp; quản lý sao lưu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cài đặt"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 active:bg-slate-300 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-5 py-4 overflow-y-auto space-y-6 text-slate-800">
          {/* SECTION 1: Gemini API Key (Requirement 6) */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-teal-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  Khóa Gemini API Cá Nhân (Google AI)
                </h4>
              </div>
              {apiKey.trim() ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  Đã cài đặt
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Info size={12} className="text-amber-600" />
                  Chưa có khóa
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Khóa API được lưu trực tiếp trên máy của bạn (localStorage), không nhúng sẵn trong file APK. Khi không có khóa hoặc khi mất mạng, ứng dụng vẫn hoạt động 100% đầy đủ với tính năng nhập thủ công, quản lý công tác phí, xuất Excel &amp; PDF.
            </p>

            {/* Input field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Nhập hoặc dán Gemini API Key:
              </label>
              <div className="relative flex items-center">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full min-h-[44px] pl-3.5 pr-20 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                    title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {apiKey && (
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer"
                      title="Xóa khóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Status message */}
            {keyTestStatus.message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  keyTestStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {keyTestStatus.type === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{keyTestStatus.message}</span>
              </div>
            )}

            {/* Buttons: Test and Save */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestApiKey}
                disabled={isTestingKey || !apiKey.trim()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 active:bg-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-1.5 border border-teal-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isTestingKey ? (
                  <RefreshCw size={14} className="animate-spin text-teal-700" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>{isTestingKey ? 'Đang kiểm tra...' : 'Kiểm tra kết nối khóa'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveApiKey}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <span>Lưu khóa vào máy</span>
              </button>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-3 py-2 rounded-xl text-slate-600 hover:text-teal-800 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 ml-auto transition-colors"
              >
                <span>Lấy khóa miễn phí</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 text-[11px] text-sky-950 space-y-1">
              <div className="font-semibold text-sky-900 flex items-center gap-1">
                <Info size={13} className="text-sky-700" />
                <span>Cách lấy khóa Gemini miễn phí (không mất tiền):</span>
              </div>
              <p>
                1. Truy cập <strong>aistudio.google.com/app/apikey</strong> bằng tài khoản Google bất kỳ.
              </p>
              <p>
                2. Bấm <strong>Create API key</strong>, sao chép chuỗi ký tự rồi dán vào ô phía trên và bấm <strong>Lưu khóa</strong>.
              </p>
            </div>
          </div>

          {/* SECTION 2: Persistent Storage (Requirement 3) */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={18} className="text-teal-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  Lưu Trữ Bền Vững (IndexedDB + Storage Persist)
                </h4>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isPersisted
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : 'text-amber-800 bg-amber-50 border-amber-200'
                }`}
              >
                <ShieldCheck size={12} className={isPersisted ? 'text-emerald-600' : 'text-amber-600'} />
                {isPersisted ? 'Đã bảo vệ' : 'Chưa bảo vệ'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dữ liệu chi tiêu và ảnh hóa đơn được lưu trữ trong cơ sở dữ liệu IndexedDB trên thiết bị. Tính năng bảo vệ bộ nhớ yêu cầu hệ điều hành Android/Trình duyệt không tự động xóa dữ liệu khi máy thiếu bộ nhớ.
            </p>

            {storageInfo && (
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Dung lượng đã dùng:</span>
                  <span className="font-semibold text-slate-800 font-mono">{storageInfo.usageMB} MB</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Hạn mức khả dụng:</span>
                  <span className="font-semibold text-slate-800 font-mono">~{storageInfo.quotaMB}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRequestStoragePersist}
                disabled={isCheckingStorage || isPersisted === true}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck size={15} className="text-teal-700" />
                <span>
                  {isPersisted ? 'Hệ thống đã bật chế độ bền vững' : 'Bật chế độ bền vững (Persist)'}
                </span>
              </button>

              <button
                type="button"
                onClick={checkPersistenceStatus}
                className="min-h-[44px] px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={isCheckingStorage ? 'animate-spin' : ''} />
                <span>Kiểm tra lại</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: Auto-Backup & File Saver Test (Requirement 2 & 4) */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download size={18} className="text-teal-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  Sao Lưu Tự Động &amp; Hàm Lưu File Dùng Chung
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={autoBackupEnabled}
                  onChange={(e) => onToggleAutoBackup(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
              </label>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tự động gom thay đổi (debounce 25 giây) để tải về file sao lưu JSON kèm ảnh chứng từ sau khi bạn nhập liệu. Mọi thao tác lưu file (Excel, PDF, JSON) đều sử dụng chung một hàm xử lý thích ứng tốt với cả trình duyệt và Android WebView/Capacitor.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onManualBackup}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={14} className="text-teal-700" />
                <span>Tải sao lưu ngay</span>
              </button>

              <button
                type="button"
                onClick={handleTestFileSave}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Smartphone size={14} className="text-slate-600" />
                <span>Thử nghiệm lưu file trên máy</span>
              </button>
            </div>

            {testFileStatus && (
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono">
                {testFileStatus}
              </div>
            )}
          </div>

          {/* SECTION 4: Network & Native Environment Info (Requirement 1 & 7) */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Smartphone size={15} className="text-teal-700" />
              <span>Thông tin môi trường &amp; Đóng gói APK</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi size={14} className="text-emerald-600" />
                ) : (
                  <WifiOff size={14} className="text-rose-600" />
                )}
                <span>Kết nối mạng: {isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến (Offline)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-teal-600" />
                <span>Môi trường: {isNativeWrapper ? 'Android WebView / Native' : 'Trình duyệt PWA'}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Giao diện tối ưu cảm ứng (vùng bấm tối thiểu 44px, hỗ trợ phím Back của Android, safe-area tai thỏ &amp; thanh điều hướng).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            Hoàn tất &amp; Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
