import dynamic from 'next/dynamic';

export const MapWrapper = dynamic(() => import('./BaseMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-secondary/30">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-muted rounded-full mb-4"></div>
        <div className="text-muted-foreground font-medium">Đang tải bản đồ...</div>
      </div>
    </div>
  ),
});
