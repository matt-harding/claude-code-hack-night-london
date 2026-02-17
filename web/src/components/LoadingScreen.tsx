export function LoadingScreen({ isDark }: { isDark: boolean }) {
  return (
    <div className={`todo-container ${isDark ? "dark" : "light"}`}>
      <div className="loading-screen">
        <div className="loader-ring">
          <div className="loader-ring-inner" />
        </div>
        <div className="loading-brand">Claude Hack Night</div>
        <div className="loading-sub">Loading your tasks...</div>
      </div>
    </div>
  );
}
