export function LoadingPudding() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="text-7xl animate-bounce" style={{ animationDuration: '0.6s' }}>
        🍮
      </div>
      <p className="text-lg font-medium text-muted-foreground animate-pulse">
        Đang tải...
      </p>
    </div>
  );
}
