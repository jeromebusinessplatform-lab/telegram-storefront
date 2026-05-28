import { useState, useRef } from 'react';
import { Link, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageUploadInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUploadInput({ value, onChange, label = 'Image' }: ImageUploadInputProps) {
  const [urlInput, setUrlInput] = useState(value || '');
  const [preview, setPreview] = useState(value || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (v: string) => {
    setUrlInput(v);
    setPreview(v);
    onChange(v);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setUrlInput('');
    setPreview('');
    onChange('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <Tabs defaultValue="url">
        <TabsList className="h-7 text-xs">
          <TabsTrigger value="url" className="h-6 text-xs gap-1">
            <Link className="w-3 h-3" /> URL
          </TabsTrigger>
          <TabsTrigger value="file" className="h-6 text-xs gap-1">
            <Upload className="w-3 h-3" /> Upload
          </TabsTrigger>
        </TabsList>
        <TabsContent value="url" className="mt-2">
          <Input
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="text-sm"
          />
        </TabsContent>
        <TabsContent value="file" className="mt-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
          />
        </TabsContent>
      </Tabs>

      {preview && (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
          <img src={preview} alt="preview" className="w-full h-full object-cover" onError={() => setPreview('')} />
          <button
            onClick={clearImage}
            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
          >
            <X className="w-3 h-3 text-destructive-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
