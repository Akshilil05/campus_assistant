import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertType: string;
  onSubmit: (description?: string) => void;
  location: { lat: number; lng: number } | null;
}

 const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, alertType, onSubmit, location }: AlertDialogProps) => {
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit(description || undefined);
    setDescription('');
  };

  const getAlertTitle = () => {
    switch (alertType) {
      case 'high':
        return 'High Alert';
      case 'moderate':
        return 'Moderate Alert';
      case 'general':
        return 'General Complaint';
      default:
        return 'Alert';
    }
  };

  const showDescriptionField = alertType !== 'high';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getAlertTitle()}</DialogTitle>
          <DialogDescription>
            {alertType === 'high' 
              ? 'Emergency alert will be sent immediately with your current location.'
              : 'Provide additional details about your alert.'}
          </DialogDescription>
        </DialogHeader>

        {location && (
          <div className="py-2 text-sm text-muted-foreground">
            Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </div>
        )}

        {showDescriptionField && (
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Please describe the situation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Send Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertDialog;
