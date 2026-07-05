export function FaceFrameOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
      <div className="relative">
        <div
          className="w-48 h-60 rounded-[50%] border-2 border-[#00FFFF]/40 animate-pulse"
          style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)' }}
        />
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-xs text-[#00FFFF]/70 font-medium">Centralize seu rosto no quadro</p>
        </div>
      </div>
    </div>
  )
}
