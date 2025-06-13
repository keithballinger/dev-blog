
export function BlogHeader() {
  return (
    <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-blue-400">&gt;</span> dev.blog
            </h1>
            <p className="text-gray-400 text-sm font-mono">
              Thoughts on software engineering and development
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="font-mono">online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
