import { useState } from 'react';
import { isApiError, type Business } from '@/api';
import { useRejectBusiness } from '@/api/hooks/useAdmin';
import { useToast } from '@/context/useToast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';

interface RejectBusinessDialogProps {
  business: Business | null;
  onClose: () => void;
}

export function RejectBusinessDialog({ business, onClose }: RejectBusinessDialogProps) {
  const reject = useRejectBusiness();
  const toast = useToast();
  const [reason, setReason] = useState('');

  const trimmed = reason.trim();
  const error =
    trimmed.length > 0 && (trimmed.length < 3 || trimmed.length > 1000)
      ? 'Arsyeja duhet të jetë 3–1000 karaktere.'
      : undefined;

  const close = () => {
    reject.reset();
    setReason('');
    onClose();
  };

  const submit = () => {
    if (!business || trimmed.length < 3 || trimmed.length > 1000) return;
    reject.mutate(
      { id: business.id, reason: trimmed },
      {
        onSuccess: () => {
          toast.success('Biznesi u refuzua dhe pronari u njoftua.');
          close();
        },
      },
    );
  };

  return (
    <Modal
      open={Boolean(business)}
      onClose={close}
      title="Refuzo biznesin"
      description={business?.name}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={reject.isPending}>
            Anulo
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            isLoading={reject.isPending}
            disabled={trimmed.length < 3 || Boolean(error)}
          >
            Refuzo
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {reject.isError && (
          <Alert variant="error">
            {isApiError(reject.error) ? reject.error.message : 'Refuzimi dështoi.'}
          </Alert>
        )}
        <Textarea
          label="Arsyeja e refuzimit"
          rows={4}
          required
          placeholder="Shpjegoni pse biznesi po refuzohet…"
          hint="3–1000 karaktere. Pronari do ta marrë këtë arsye me email."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={error}
        />
      </div>
    </Modal>
  );
}
