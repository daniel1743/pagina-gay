import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { uploadProfilePhoto, validateImageFile } from '@/services/photoUploadService';
import { useAuth } from '@/contexts/AuthContext';

const PhotoUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const { updateProfile } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Error de validación",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No hay archivo seleccionado",
        description: "Por favor selecciona una imagen primero.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progreso (la compresión y subida pueden tardar)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Subir y comprimir imagen
      const photoURL = await uploadProfilePhoto(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Actualizar perfil del usuario
      await updateProfile({ avatar: photoURL });

      toast({
        title: "✅ Foto subida exitosamente",
        description: "Tu foto de perfil ha sido actualizada.",
      });

      // Llamar callback de éxito
      if (onUploadSuccess) {
        onUploadSuccess(photoURL);
      }

      // Resetear estado y cerrar
      setSelectedFile(null);
      setPreview(null);
      setUploadProgress(0);
      onClose();
    } catch (error) {
      console.error('Error subiendo foto:', error);
      toast({
        title: "Error al subir foto",
        description: error.message || "No se pudo subir la foto. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast({
          title: "Error de validación",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#1a0d2e] via-[#2d1b4e] to-[#1a0d2e] border-2 border-[#E4007C]/30 text-white max-w-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-extrabold text-foreground">
            Subir Foto de Perfil
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Sube una foto personalizada para tu perfil. Se comprimirá automáticamente a un tamaño óptimo (máximo 80 KB).
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Área de carga */}
          {!preview ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#E4007C]/50 rounded-xl p-12 text-center hover:border-[#E4007C] transition-colors cursor-pointer bg-accent/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-[#E4007C]" />
              <p className="text-lg font-semibold mb-2">Arrastra una imagen aquí</p>
              <p className="text-sm text-muted-foreground mb-4">o haz clic para seleccionar</p>
              <p className="text-xs text-muted-foreground">
                Formatos: JPG, PNG, WEBP (máximo 10 MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview de la imagen */}
              <div className="relative rounded-xl overflow-hidden border-2 border-[#E4007C]/30">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Información del archivo */}
              {selectedFile && (
                <div className="bg-accent/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Archivo:</span>
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tamaño original:</span>
                    <span className="text-sm font-medium">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tamaño después de compresión:</span>
                    <span className="text-sm font-medium text-[#E4007C]">
                      ~50-80 KB
                    </span>
                  </div>
                </div>
              )}

              {/* Barra de progreso */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subiendo y comprimiendo...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#E4007C] to-cyan-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isUploading}
            >
              Cancelar
            </Button>
            {preview && (
              <Button
                onClick={handleUpload}
                className="flex-1 bg-gradient-to-r from-[#E4007C] to-cyan-500 hover:from-[#ff0087] hover:to-cyan-400 text-white font-bold"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Foto
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Información adicional */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              <strong>💡 Nota:</strong> Tu imagen será comprimida automáticamente a un tamaño máximo de 80 KB para optimizar el rendimiento. 
              La calidad se mantendrá lo mejor posible.
            </p>
          </div>
        </div>

        {/* Botón cerrar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 z-50 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
          disabled={isUploading}
        >
          <X className="w-5 h-5" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUploadModal;


