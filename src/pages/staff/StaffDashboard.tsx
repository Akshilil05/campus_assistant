 import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, MapPin, Filter as FilterIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  full_name: string;
  student_id: string;
  department: string;
  year: number;
}

interface Alert {
  id: string;
  alert_type: 'high' | 'moderate' | 'general';
  location_lat: number;
  location_lng: number;
  description: string | null;
  created_at: string;
  status: 'pending' | 'completed';
  student: Student | null;
}

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'high' | 'moderate' | 'general'>('all');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await loadAlerts();
    };
    init();

    const channel = supabase
      .channel('realtime:alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => loadAlerts())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/staff/login');

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'staff') {
      await supabase.auth.signOut();
      return navigate('/staff/login');
    }

    setUserName(profile.full_name);
  };

  const loadAlerts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('alerts')
        .select(`
          id,
          alert_type,
          location_lat,
          location_lng,
          description,
          created_at,
          status,
          student_id,
          student:profiles (
            full_name,
            student_id,
            department,
            year
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') query = query.eq('alert_type', filter);

      const { data, error } = await query;
      if (error) throw error;

      const alertsMapped: Alert[] = (data || []).map((a: any) => ({
        id: a.id,
        alert_type: a.alert_type,
        location_lat: a.location_lat,
        location_lng: a.location_lng,
        description: a.description,
        created_at: a.created_at,
        status: a.status,
        student: a.student || null,
      }));

      setAlerts(alertsMapped);
    } catch (err) {
      console.error(err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/staff/login');
  };

  const toggleCompleted = async (alertId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: completed ? 'completed' : 'pending' })
        .eq('id', alertId);
      if (error) throw error;
      loadAlerts();
    } catch (err) {
      console.error('Error updating alert status:', err);
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'high': return 'bg-red-500';
      case 'moderate': return 'bg-orange-500';
      case 'general': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) return <p className="text-center mt-10">Loading alerts...</p>;

  const freshAlerts = alerts.filter(a => a.status === 'pending');
  const completedAlerts = alerts.filter(a => a.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-tl from-gray-900 via-red-900 to-black p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="p-6 mb-6 flex justify-between items-center bg-blue">
          <div>
            <h1 className="text-4xl font-bold text-white">Staff Dashboard :)</h1>
            <p className="text-muted-foreground text-white">Welcome, {userName}!</p>
          </div>
          <button onClick={handleLogout} className="text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </Card>

        {/* Filter Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FilterIcon className="w-5 h-5" />
            <span className="font-bold">Filter by type:</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {['all', 'high', 'moderate', 'general'].map(type => {
              let bgClass = 'bg-gray-700 text-white';
              if (type === 'high') bgClass = filter === 'high' ? 'bg-red-600 text-white' : 'bg-red-500 text-white';
              if (type === 'moderate') bgClass = filter === 'moderate' ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white';
              if (type === 'general') bgClass = filter === 'general' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white';
              if (type === 'all') bgClass = filter === 'all' ? 'bg-white text-black' : 'bg-gray-900 text-white';

              return (
                <button
                  key={type}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 hover:opacity-90 ${bgClass}`}
                  onClick={() => setFilter(type as 'all' | 'high' | 'moderate' | 'general')}
                >
                  {type === 'all' ? 'All' : `${type.charAt(0).toUpperCase() + type.slice(1)} Alert`}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Fresh Alerts */}
        <h2 className="text-2xl font-bold text-white mb-4">Fresh Alerts</h2>
        <div className="space-y-4 mb-8">
          {freshAlerts.length ? freshAlerts.map(alert => (
            <Card key={alert.id} className="p-6 relative">
              <input
                type="checkbox"
                className="absolute top-3 right-3 w-5 h-5"
                checked={alert.status === 'completed'}
                onChange={(e) => toggleCompleted(alert.id, e.target.checked)}
              />
              <Badge className={getAlertColor(alert.alert_type)}>
                {alert.alert_type.toUpperCase()}
              </Badge>
              <h3 className="text-lg font-semibold mt-2">
                {alert.student?.full_name} ({alert.student?.student_id})
              </h3>
              <p className="text-sm text-muted-foreground">
                {alert.student?.department} — Year {alert.student?.year}
              </p>
              {alert.description && <p className="text-muted-foreground mt-2">{alert.description}</p>}
              <div className="flex items-center gap-2 text-sm mt-2">
                <MapPin className="w-4 h-4" />
                <a
                  href={`https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-300 hover:text-blue-500"
                >
                  {alert.location_lat?.toFixed(6)}, {alert.location_lng?.toFixed(6)}
                </a>
              </div>
              <span className="text-sm text-muted-foreground mt-2 block">
                {format(new Date(alert.created_at), 'PPp')}
              </span>
            </Card>
          )) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No fresh alerts</p>
            </Card>
          )}
        </div>

        {/* Completed Alerts */}
        <h2 className="text-2xl font-bold text-white mb-4">Solved Alerts</h2>
        <div className="space-y-4">
          {completedAlerts.length ? completedAlerts.map(alert => (
            <Card key={alert.id} className="p-6 relative bg-gray-800">
              <input
                type="checkbox"
                className="absolute top-3 right-3 w-5 h-5"
                checked={true}
                onChange={(e) => toggleCompleted(alert.id, e.target.checked)}
              />
              <Badge className={getAlertColor(alert.alert_type)}>
                {alert.alert_type.toUpperCase()}
              </Badge>
              <h3 className="text-lg font-semibold mt-2">
                {alert.student?.full_name} ({alert.student?.student_id})
              </h3>
              <p className="text-sm text-muted-foreground">
                {alert.student?.department} — Year {alert.student?.year}
              </p>
              {alert.description && <p className="text-muted-foreground mt-2">{alert.description}</p>}
              <div className="flex items-center gap-2 text-sm mt-2">
                <MapPin className="w-4 h-4" />
                <a
                  href={`https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-300 hover:text-blue-500"
                >
                  {alert.location_lat?.toFixed(6)}, {alert.location_lng?.toFixed(6)}
                </a>
              </div>
              <span className="text-sm text-muted-foreground mt-2 block">
                {format(new Date(alert.created_at), 'PPp')}
              </span>
            </Card>
          )) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No solved alerts</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
