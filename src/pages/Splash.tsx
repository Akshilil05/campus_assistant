import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import campusIcon from '@/assets/campus-icon.png';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/role-selection');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex items-center justify-center p-4">

      <div className="text-center animate-fade-in">
        <div className="mb-8 animate-bounce">
          <img 
            src={campusIcon} 
            alt="Campus Assistant" 
            className="w-32 h-32 mx-auto rounded-3xl shadow-2xl"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          Campus Assistant
        </h1>
        <p className="text-xl text-white/90">
          Your Safety, Our Priority
        </p>
      </div>
    </div>
  );
};

export default Splash;
