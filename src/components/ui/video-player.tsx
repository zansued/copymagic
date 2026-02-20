import * as React from "react";
import { cn } from "@/lib/utils";
import { Play, X } from "lucide-react";

interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  thumbnailUrl?: string;
  videoUrl?: string;
  title: string;
  description?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
}

const VideoPlayer = React.forwardRef<HTMLDivElement, VideoPlayerProps>(
  (
    {
      className,
      thumbnailUrl,
      videoUrl,
      title,
      description,
      aspectRatio = "16/9",
      ...props
    },
    ref
  ) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    React.useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape") setIsModalOpen(false);
      };
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    React.useEffect(() => {
      document.body.style.overflow = isModalOpen ? "hidden" : "auto";
    }, [isModalOpen]);

    const hasVideo = !!videoUrl;

    return (
      <>
        <div
          ref={ref}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-lg",
            !hasVideo && "cursor-default",
            className
          )}
          style={{ aspectRatio }}
          onClick={() => hasVideo && setIsModalOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && hasVideo && setIsModalOpen(true)}
          tabIndex={hasVideo ? 0 : undefined}
          aria-label={hasVideo ? `Play video: ${title}` : title}
          {...props}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={`Thumbnail for ${title}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <Play className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
                <Play className="h-5 w-5 fill-white text-white" />
              </div>
            </div>
          )}

          {(title || description) && (
            <div className="absolute bottom-0 left-0 p-3">
              <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
              {description && (
                <p className="mt-0.5 text-[11px] text-white/80 line-clamp-1">{description}</p>
              )}
            </div>
          )}
        </div>

        {isModalOpen && videoUrl && (
          <div
            className="fixed inset-0 z-50 flex animate-in fade-in-0 items-center justify-center bg-black/80 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
            onClick={() => setIsModalOpen(false)}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Close video player"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="w-full max-w-4xl aspect-video p-4" onClick={(e) => e.stopPropagation()}>
              <iframe
                src={videoUrl}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full rounded-lg"
              />
            </div>
          </div>
        )}
      </>
    );
  }
);
VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };
