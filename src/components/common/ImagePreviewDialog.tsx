import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  imageUrl: string;
  alt: string;
  description?: string;
  downloadFileName?: string;
  showDownload?: boolean;
}

export default function ImagePreviewDialog({
  open,
  onOpenChange,
  title,
  imageUrl,
  alt,
  description,
  downloadFileName = 'image',
  showDownload = false,
}: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4 space-y-3">
          <div className="rounded-xl border border-border bg-muted/30 p-2">
            <img
              src={imageUrl}
              alt={alt}
              className="mx-auto max-h-[65vh] w-full object-contain rounded-lg"
            />
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          <div className="flex gap-2">
            {showDownload && (
              <Button asChild className="flex-1 gap-2 btn-gradient">
                <a href={imageUrl} download={downloadFileName} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={showDownload ? 'flex-1 gap-2' : 'w-full gap-2'}
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
