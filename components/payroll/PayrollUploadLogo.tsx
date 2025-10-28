'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  AlertCircle, 
  FileImage,
  Trash2,
  Eye,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Interface untuk konfigurasi upload
 */
interface UploadConfig {
  maxSize: number // dalam bytes
  allowedFormats: string[]
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

/**
 * Interface untuk file yang diupload
 */
interface UploadedFile {
  file: File
  preview: string
  size: number
  dimensions?: {
    width: number
    height: number
  }
  isValid: boolean
  errors: string[]
}

/**
 * Props untuk komponen PayrollUploadLogo
 */
interface PayrollUploadLogoProps {
  onLogoChange?: (logoUrl: string | null) => void
  currentLogo?: string
  className?: string
  config?: Partial<UploadConfig>
}

/**
 * Default konfigurasi upload
 */
const DEFAULT_CONFIG: UploadConfig = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
  maxWidth: 1000,
  maxHeight: 1000,
  quality: 0.8
}

/**
 * Komponen untuk upload company logo dengan validasi format gambar
 * Mendukung PNG, JPG, dan SVG dengan preview dan kompresi otomatis
 */
export function PayrollUploadLogo({
  onLogoChange,
  currentLogo,
  className,
  config = {}
}: PayrollUploadLogoProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])

  /**
   * Format file size ke human readable
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Validasi file yang diupload
   */
  const validateFile = useCallback((file: File): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Validasi format file
    if (!uploadConfig.allowedFormats.includes(file.type)) {
      errors.push(`Format file tidak didukung. Gunakan: ${uploadConfig.allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`)
    }
    
    // Validasi ukuran file
    if (file.size > uploadConfig.maxSize) {
      errors.push(`Ukuran file terlalu besar. Maksimal: ${formatFileSize(uploadConfig.maxSize)}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [uploadConfig.allowedFormats, uploadConfig.maxSize])

  /**
   * Get image dimensions
   */
  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/svg+xml') {
        // SVG files don't have fixed dimensions
        resolve({ width: 0, height: 0 })
        return
      }
      
      const img = new HTMLImageElement()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }, [])

  /**
   * Compress image jika diperlukan
   */
  const compressImage = useCallback((file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> => {
    return new Promise((resolve) => {
      if (file.type === 'image/svg+xml') {
        // SVG tidak perlu kompresi
        resolve(file)
        return
      }
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new HTMLImageElement()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          file.type,
          quality
        )
      }
      
      img.src = URL.createObjectURL(file)
    })
  }, [])

  /**
   * Process uploaded file
   */
  const processFile = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Validasi file
      const validation = validateFile(file)
      setUploadProgress(20)
      
      // Get dimensions
      let dimensions: { width: number; height: number } | undefined
      try {
        dimensions = await getImageDimensions(file)
        setUploadProgress(40)
      } catch (error) {
        console.warn('Could not get image dimensions:', error)
      }
      
      // Compress jika diperlukan
      let processedFile = file
      if (uploadConfig.maxWidth && uploadConfig.maxHeight && uploadConfig.quality) {
        processedFile = await compressImage(file, uploadConfig.maxWidth, uploadConfig.maxHeight, uploadConfig.quality)
        setUploadProgress(70)
      }
      
      // Create preview URL
      const preview = URL.createObjectURL(processedFile)
      setUploadProgress(90)
      
      const uploadedFileData: UploadedFile = {
        file: processedFile,
        preview,
        size: processedFile.size,
        dimensions,
        isValid: validation.isValid,
        errors: validation.errors
      }
      
      setUploadedFile(uploadedFileData)
      setUploadProgress(100)
      
      // Callback dengan preview URL jika file valid
      if (validation.isValid) {
        onLogoChange?.(preview)
      }
      
    } catch (error) {
      console.error('Error processing file:', error)
      setUploadedFile({
        file,
        preview: '',
        size: file.size,
        isValid: false,
        errors: ['Terjadi kesalahan saat memproses file']
      })
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [uploadConfig, validateFile, getImageDimensions, compressImage, onLogoChange])

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    processFile(file)
  }, [processFile])

  /**
   * Handle drag events
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  /**
   * Remove uploaded file
   */
  const removeFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview)
    }
    setUploadedFile(null)
    onLogoChange?.(null)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Download current logo
   */
  const downloadLogo = () => {
    if (!uploadedFile) return
    
    const link = document.createElement('a')
    link.href = uploadedFile.preview
    link.download = uploadedFile.file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Upload Company Logo
          </CardTitle>
          <CardDescription>
            Upload logo perusahaan untuk slip gaji dan kwitansi. Format yang didukung: PNG, JPG, SVG
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Drag & Drop Area */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                isUploading && 'pointer-events-none opacity-50'
              )}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                
                <div>
                  <p className="text-lg font-medium mb-2">
                    {dragActive ? 'Drop file di sini' : 'Drag & drop logo atau klik untuk browse'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Maksimal {formatFileSize(uploadConfig.maxSize)} • Format: {uploadConfig.allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
                  </p>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <FileImage className="w-4 h-4 mr-2" />
                    Pilih File
                  </Button>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept={uploadConfig.allowedFormats.join(',')}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Logo Preview */}
      {(uploadedFile || currentLogo) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Logo Preview
              </span>
              
              <div className="flex items-center gap-2">
                {uploadedFile && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadLogo}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={removeFile}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Preview Image */}
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                  {(uploadedFile?.preview || currentLogo) ? (
                    <Image
                      src={uploadedFile?.preview || currentLogo || ''}
                      alt="Company Logo"
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                
                {uploadedFile && (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{uploadedFile.file.name}</p>
                      {uploadedFile.isValid ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Size: {formatFileSize(uploadedFile.size)}</span>
                      {uploadedFile.dimensions && uploadedFile.dimensions.width > 0 && (
                        <span>Dimensions: {uploadedFile.dimensions.width} × {uploadedFile.dimensions.height}px</span>
                      )}
                      <span>Type: {uploadedFile.file.type.split('/')[1].toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Validation Errors */}
              {uploadedFile && !uploadedFile.isValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {uploadedFile.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Success Message */}
              {uploadedFile && uploadedFile.isValid && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Logo berhasil diupload dan siap digunakan untuk slip gaji dan kwitansi.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Panduan Upload Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Format yang Didukung</p>
                <p className="text-muted-foreground">PNG, JPG, JPEG, SVG</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Ukuran File</p>
                <p className="text-muted-foreground">Maksimal {formatFileSize(uploadConfig.maxSize)}</p>
              </div>
            </div>
            
            {uploadConfig.maxWidth && uploadConfig.maxHeight && (
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Resolusi Optimal</p>
                  <p className="text-muted-foreground">Maksimal {uploadConfig.maxWidth} × {uploadConfig.maxHeight}px</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Rekomendasi</p>
                <p className="text-muted-foreground">Gunakan background transparan (PNG) untuk hasil terbaik</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Preview Modal */}
      {showPreview && uploadedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Logo Preview</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPreview(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-center relative w-full h-96">
                <Image
                  src={uploadedFile.preview}
                  alt="Company Logo Preview"
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>{uploadedFile.file.name}</p>
                <p>{formatFileSize(uploadedFile.size)}</p>
                {uploadedFile.dimensions && uploadedFile.dimensions.width > 0 && (
                  <p>{uploadedFile.dimensions.width} × {uploadedFile.dimensions.height}px</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PayrollUploadLogo