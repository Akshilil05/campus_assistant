 import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Briefcase } from 'lucide-react';
import campusIcon from '@/assets/campus-icon.png';

const RoleSelection = () => {
  const navigate = useNavigate();
  const [checkedRole, setCheckedRole] = useState(false); // ensure we check role once

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    if (savedRole) {
      // Delay navigation until the component finishes mounting
      setTimeout(() => {
        if (savedRole === 'student') navigate('/student/dashboard');
        else if (savedRole === 'staff') navigate('/staff/dashboard');
      }, 100);
    } else {
      setCheckedRole(true); // show role selection if no saved role
    }
  }, [navigate]);

  const handleRoleSelection = (role: 'student' | 'staff') => {
    localStorage.setItem('role', role);
    if (role === 'student') navigate('/student/dashboard');
    else navigate('/staff/dashboard');
  };

  if (!checkedRole) return null; // render nothing until role check is done

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-indigo-400 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          <img 
            src={campusIcon} 
            alt="Campus Assistant" 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl"
          />
          <h1 className="text-3xl font-bold mb-2">Welcome</h1>
          <p className="text-muted-foreground">Please select your role to continue</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => handleRoleSelection('student')}
            className="w-full py-8 text-lg gap-3"
            size="lg"
          >
            <GraduationCap className="w-6 h-6" />
            I'm a Student
          </Button>

          <Button
            onClick={() => handleRoleSelection('staff')}
            variant="outline"
            className="w-full py-8 text-lg gap-3"
            size="lg"
          >
            <Briefcase className="w-6 h-6" />
            I'm Staff (Management)
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default RoleSelection;
