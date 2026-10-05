'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/Field';
import ResendTimer from './ResendTimer';

/** Sends an OTP to `phone` and verifies it (used for vendor accounts / unverified logins). */
export default function VerifyPhoneModal(props) {
  // Mounted fresh each time it opens, so the code field and timer start clean
  return props.open ? <VerifyPhoneDialog {...props} /> : null;
}

function VerifyPhoneDialog({ onClose, phone, onVerified, sendOnOpen = true }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentAt, setSentAt] = useState(0);

  const send = () =>
    authApi
      .sendOtp(phone)
      .then(() => {
        setSentAt(Date.now());
        toast.success('Verification code sent');
      })
      .catch((err) => toast.error(getErrorMessage(err)));

  useEffect(() => {
    if (sendOnOpen) send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = async () => {
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp);
      onVerified?.(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Verify your phone"
      description={`Enter the 6-digit code we sent to ${phone}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={verify} loading={loading} disabled={otp.length < 6}>Verify</Button>
        </>
      }
    >
      <OtpInput value={otp} onChange={setOtp} />
      <div className="mt-3 text-center">
        <ResendTimer key={sentAt} onResend={send} />
      </div>
    </Modal>
  );
}
