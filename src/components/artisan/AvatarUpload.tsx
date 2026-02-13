import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, X } from 'lucide-react';
import { uploadArtisanAvatar, validateFile, BUCKET_CONFIG } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userId: string;
  userName?: string;
  onUploadSuccess?: (url: string) => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
  xl: 'h-40 w-40',
};

export default function AvatarUpload({
  currentAvatarUrl,
  userId,
  userName = 'User',
  onUploadSuccess,
  onRemove,
  size = 'lg',
  className,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get initials from name for fallback
  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateFile(file, BUCKET_CONFIG['artisan-avatars']);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const result = await uploadArtisanAvatar(file, userId);
      
      if (result.error) {
        setError(result.error);
        setPreview(null);
      } else {
        setAvatarUrl(result.url);
        setPreview(null);
        if (onUploadSuccess) {
          onUploadSuccess(result.url);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset input to allow re-selecting the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!avatarUrl) return;

    setAvatarUrl(null);
    setPreview(null);
    setError(null);
    
    if (onRemove) {
      onRemove();
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = preview || avatarUrl;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Avatar Display */}
      <div className="relative">
        <Avatar className={cn(sizeClasses[size], 'border-2 border-border')}>
          <AvatarImage src={displayUrl || undefined} alt={userName} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}

        {/* Remove button */}
        {avatarUrl && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-md"
            aria-label="Remove avatar"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </>
          )}
        </Button>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={BUCKET_CONFIG['artisan-avatars'].allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload avatar"
        />
      </div>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        JPG, PNG or WebP. Max 2MB. Square image recommended.
      </p>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
