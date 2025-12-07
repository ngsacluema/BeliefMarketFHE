import { useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Page not found</p>
        <p className="text-sm text-muted-foreground">
          The path <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code> does not exist.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
