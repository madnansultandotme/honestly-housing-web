'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Alert, { AlertType } from '@/components/ui/Alert';
import Modal, { ModalType } from '@/components/ui/Modal';

interface AlertConfig {
  type?: AlertType;
  title?: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

interface ModalConfig {
  type?: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
}

interface NotificationContextType {
  showAlert: (config: AlertConfig) => void;
  showModal: (config: ModalConfig) => Promise<boolean>;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  confirm: (message: string, title?: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Array<AlertConfig & { id: string }>>([]);
  const [modal, setModal] = useState<(ModalConfig & { isOpen: boolean }) | null>(null);
  const [modalResolve, setModalResolve] = useState<((value: boolean) => void) | null>(null);

  const showAlert = useCallback((config: AlertConfig) => {
    const id = Math.random().toString(36).substring(7);
    setAlerts((prev) => [...prev, { ...config, id }]);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const showModal = useCallback((config: ModalConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({ ...config, isOpen: true });
      setModalResolve(() => resolve);
    });
  }, []);

  const closeModal = useCallback((confirmed: boolean) => {
    setModal(null);
    if (modalResolve) {
      modalResolve(confirmed);
      setModalResolve(null);
    }
  }, [modalResolve]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showAlert({ type: 'success', title, message, autoClose: true });
  }, [showAlert]);

  const showError = useCallback((message: string, title?: string) => {
    showAlert({ type: 'error', title, message, autoClose: false });
  }, [showAlert]);

  const showWarning = useCallback((message: string, title?: string) => {
    showAlert({ type: 'warning', title, message, autoClose: true, autoCloseDelay: 7000 });
  }, [showAlert]);

  const showInfo = useCallback((message: string, title?: string) => {
    showAlert({ type: 'info', title, message, autoClose: true });
  }, [showAlert]);

  const confirm = useCallback((message: string, title: string = 'Confirm'): Promise<boolean> => {
    return showModal({
      type: 'confirm',
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      showCancel: true,
    });
  }, [showModal]);

  return (
    <NotificationContext.Provider
      value={{
        showAlert,
        showModal,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        confirm,
      }}
    >
      {children}

      {/* Render Alerts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            type={alert.type}
            title={alert.title}
            message={alert.message}
            autoClose={alert.autoClose}
            autoCloseDelay={alert.autoCloseDelay}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </div>

      {/* Render Modal */}
      {modal && (
        <Modal
          isOpen={modal.isOpen}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          showCancel={modal.showCancel}
          onClose={() => {
            if (modal.onConfirm) {
              closeModal(false);
            } else {
              closeModal(true);
            }
          }}
          onConfirm={() => {
            if (modal.onConfirm) {
              modal.onConfirm();
              closeModal(true);
            } else {
              closeModal(true);
            }
          }}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
