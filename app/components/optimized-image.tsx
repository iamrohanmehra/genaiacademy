import { cn } from "~/lib/utils"

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string
    alt: string
    className?: string
    width?: number
    height?: number
}

export function OptimizedImage({
    src,
    alt,
    className,
    width,
    height,
    ...props
}: OptimizedImageProps) {
    // If it's a remote URL (like Supabase storage), we can potentially use a resize proxy if available.
    // For now, we'll implement the standard optimization attributes.

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            width={width}
            height={height}
            className={cn("object-cover", className)}
            {...props}
        />
    )
}
