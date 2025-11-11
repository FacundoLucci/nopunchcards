export function BottomFade() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-40 md:hidden"
      style={{
        background:
          "linear-gradient(var(--background), color-mix(in oklch, var(--background) 100%, transparent 100%))",
        WebkitBackdropFilter: "blur(20px) saturate(500%)",
        backdropFilter: "blur(20px) saturate(500%)",
        maskImage: "linear-gradient(transparent, black)",
        WebkitMaskImage: "linear-gradient(transparent, black)",
      }}
    />
  );
}

