// app/user/generator/loading.tsx
export default function GeneratorLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto" />
        <p className="mt-4 text-white/40">Loading generator...</p>
      </div>
    </div>
  );
}