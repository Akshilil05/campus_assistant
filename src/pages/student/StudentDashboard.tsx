 import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  LogOut,
  Loader2,
  MapPin,
  Menu,
  User,
  Edit2
} from 'lucide-react';
import AlertDialog from '@/components/AlertDialog';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertType, setAlertType] = useState('high');
  const [location, setLocation] = useState<any>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [showLocationCard, setShowLocationCard] = useState(false); // new state
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    startLocationTracking();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    if (!session) {
      navigate('/student/login');
      return;
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('full_name, role, department, year, email')
      .eq('id', session.user.id)
      .single();

    if (error || !profileData || profileData.role !== 'student') {
      await supabase.auth.signOut();
      navigate('/student/login');
      return;
    }

    setProfile(profileData);
    setUserName(profileData.full_name);
  };

  const handleLogout = async () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    await supabase.auth.signOut();
    navigate('/student/login');
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location not supported',
        description: 'Your browser does not support geolocation',
        variant: 'destructive'
      });
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Location error:', error);
        toast({
          title: 'Location access required',
          description: 'Please enable location services for real-time tracking',
          variant: 'destructive'
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    setWatchId(id);
  };

  const handleAlertClick = (type: string) => {
    // Only require location for high and moderate alerts
    if ((type === 'high' || type === 'moderate') && !location) {
      toast({
        title: 'Location not available',
        description: 'Please enable location services to send this alert',
        variant: 'destructive'
      });
      return;
    }

    setAlertType(type);
    setShowLocationCard(type === 'high' || type === 'moderate'); // show card only for high/moderate
    setDialogOpen(true);
  };

  const handleAlertSubmit = async (description: string) => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) throw new Error('Not authenticated');

      const alertData: any = {
        student_id: session.user.id,
        alert_type: alertType,
        description: description || null,
      };

      // Add location only for high or moderate alerts
      if ((alertType === 'high' || alertType === 'moderate') && location) {
        alertData.location_lat = location.lat;
        alertData.location_lng = location.lng;
      }

      const { error } = await supabase.from('alerts').insert([alertData]);

      if (error) throw error;

      toast({
        title: 'Alert sent successfully',
        description: 'Management has been notified'
      });

      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Failed to send alert',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative flex flex-col">
      {/* Top Bar */}
      <div className="w-full bg-gray-900 px-6 py-3 flex items-center justify-between shadow-md fixed top-0 left-0 z-40">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-100"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-2xl font-bold text-white truncate text-center flex-1 mx-4">
          Student Dashboard
        </h1>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-5 h-5 text-white" />
        </Button>
      </div>

      {/* Spacer */}
      <div className="h-16" />

      {/* Slide-out Profile Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-0 left-0 w-64 h-full bg-white shadow-lg p-6 rounded-r-2xl z-50 transition-transform duration-300 ease-in-out"
        >
          <div className="flex flex-col items-center">
            <User className="w-16 h-16 text-blue-600 mb-2" />
            <h2 className="font-bold text-lg">{profile?.full_name}</h2>
            <p className="text-sm text-gray-600">{profile?.email}</p>
          </div>
          <div className="mt-4 border-t border-gray-300 pt-4 space-y-1">
            <p className="text-sm">
              <span className="font-semibold">Department:</span> {profile?.department || 'N/A'}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Year:</span> {profile?.year || 'N/A'}
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => navigate('/student/profile/edit')}
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </Button>
          </div>
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-400"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      <div className="flex-1 flex flex-col justify-center items-center gap-6 px-4 max-w-md mx-auto">
        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Hello, {userName}!</h2>
          <p className="text-gray-300">Select the type of alert you want to send.</p>
          {location ? (
            <span className="mt-2 inline-block bg-green-600 text-white text-sm px-3 py-1 rounded-full">
              Location Active
            </span>
          ) : (
            <span className="mt-2 inline-block bg-red-600 text-white text-sm px-3 py-1 rounded-full">
              Location Not Available
            </span>
          )}
          <p className="text-gray-400 mt-4">
            You can send High, Moderate, or General alerts. Location is required only for High/Moderate alerts.
          </p>
        </div>

        {/* Buttons */}
        <Button
          onClick={() => handleAlertClick('high')}
          disabled={loading}
          className="w-full py-6 bg-red-600 hover:bg-red-700 text-white text-xl rounded-2xl flex items-center justify-center gap-4"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <AlertTriangle className="w-8 h-8" />}
          High Alert
        </Button>

        <Button
          onClick={() => handleAlertClick('moderate')}
          disabled={loading}
          className="w-full py-6 bg-orange-500 hover:bg-orange-600 text-white text-xl rounded-2xl flex items-center justify-center gap-4"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <AlertCircle className="w-8 h-8" />}
          Moderate Alert
        </Button>

        <Button
          onClick={() => handleAlertClick('general')}
          disabled={loading}
          className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white text-xl rounded-2xl flex items-center justify-center gap-4"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <MessageSquare className="w-8 h-8" />}
          General Complaint
        </Button>

        {/* Location display */}
        {showLocationCard && location && (
          <Card className="mt-6 p-4 w-full text-center bg-gray-800 text-white">
            <div className="flex items-center justify-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              <span>
                Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
            </div>
          </Card>
        )}
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        alertType={alertType}
        onSubmit={handleAlertSubmit}
        location={location}
      />
    </div>
  );
};

export default StudentDashboard;
