export default function Custom404() {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#5e2bff] mb-4">404 - Page Not Found</h1>
          <p className="text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
          <div className="mt-4">
            <a href="/auth/signin" className="text-[#5e2bff] hover:underline">
              Go to Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }