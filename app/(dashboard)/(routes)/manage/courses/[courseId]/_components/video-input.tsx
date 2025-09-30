'use client'

import { useState } from 'react'
import { Upload, Link, Video, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUpload } from '@/components/file-upload'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type VideoInputMode = 'upload' | 'url'

type VideoInputProps = {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const VideoInput = ({ value, onChange, placeholder = "Video URL or upload", className }: VideoInputProps) => {
  const [mode, setMode] = useState<VideoInputMode>('url')
  const [isUploading, setIsUploading] = useState(false)

  const handleUrlChange = (url: string) => {
    onChange(url)
  }

  const handleUploadComplete = (url: string) => {
    onChange(url)
    setIsUploading(false)
  }

  const handleUploadError = () => {
    setIsUploading(false)
  }

  const clearVideo = () => {
    onChange('')
  }

  const hasVideo = Boolean(value)

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('url')}
          className="flex items-center gap-2"
        >
          <Link className="h-4 w-4" />
          Insert URL
        </Button>
        <Button
          type="button"
          variant={mode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('upload')}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
      </div>

      {/* Video Input Area */}
      {mode === 'url' ? (
        <div className="space-y-2">
          <Input
            value={value || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste video URL (YouTube, Vimeo, etc.)"
            className="w-full"
          />
          {hasVideo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              <span>Video URL added</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearVideo}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Card className="border-dashed border-2">
            <CardContent className="p-4">
              <FileUpload
                endpoint="chapterVideo"
                onChange={handleUploadComplete}
              />
            </CardContent>
          </Card>
          {hasVideo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              <span>Video uploaded</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearVideo}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
