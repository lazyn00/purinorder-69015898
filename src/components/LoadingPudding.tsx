export function LoadingPudding() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary rounded-full animate-bounce" 
             style={{ animationDuration: '0.6s' }}>
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white/40 rounded-full"></div>
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/30 rounded-full"></div>
        </div>
      </div>
      <p className="text-lg font-medium text-muted-foreground animate-pulse">
        Loading...
      </p>
    </div>
  );
}
