// Shown while a lazily loaded page chunk is being fetched. Kept tiny and dependency-free so
// it can render instantly (it is part of the initial bundle).
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full" role="status" aria-label="Loading">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
  </div>
);

export default PageLoader;
