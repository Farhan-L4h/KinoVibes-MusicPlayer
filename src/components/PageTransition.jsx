import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="min-w-0 motion-safe:animate-fade-in">
      {children}
    </div>
  );
};

export default PageTransition;