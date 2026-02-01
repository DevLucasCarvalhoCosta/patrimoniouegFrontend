import React, { useState } from 'react';
import { Image, ImageProps } from 'antd';
import { buildAssetUrl } from '@/config/api';

interface AssetImageProps extends Omit<ImageProps, 'src'> {
  /** Caminho do asset (ex: "/uploads/bens/bem-1.jpg") */
  src?: string | null;
  /** URL de fallback se a imagem não carregar */
  fallback?: string;
  /** Mostrar placeholder quando não há imagem */
  showPlaceholder?: boolean;
}

/**
 * Componente para exibir imagens de assets com tratamento de erro
 */
export const AssetImage: React.FC<AssetImageProps> = ({
  src,
  fallback,
  showPlaceholder = true,
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src && !showPlaceholder) {
    return null;
  }

  const imageUrl = src ? buildAssetUrl(src) : '';

  const handleError = (error: any) => {
    console.error('🖼️ Erro ao carregar imagem:', { src, imageUrl, error });
    setHasError(true);
    setIsLoading(false);
    onError?.(error);
  };

  const handleLoad = () => {
    console.log('✅ Imagem carregada:', { src, imageUrl });
    setIsLoading(false);
    setHasError(false);
  };

  // Se não tem src e deve mostrar placeholder
  if (!src) {
    return (
      <div
        style={{
          width: props.width || 100,
          height: props.height || 100,
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '12px',
          ...props.style,
        }}
      >
        Sem imagem
      </div>
    );
  }

  // Se teve erro, mostrar fallback ou placeholder
  if (hasError) {
    if (fallback) {
      return (
        <Image
          {...props}
          src={fallback}
          onError={handleError}
          onLoad={handleLoad}
        />
      );
    }
    
    return (
      <div
        style={{
          width: props.width || 100,
          height: props.height || 100,
          backgroundColor: '#ffeaa7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d63031',
          fontSize: '12px',
          textAlign: 'center',
          ...props.style,
        }}
      >
        Erro ao<br/>carregar
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={imageUrl}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
};
