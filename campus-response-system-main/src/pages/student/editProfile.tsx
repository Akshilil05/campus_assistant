import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if (!session) {
      navigate('/student/login');
      return;
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('full_name, email, department, year')
      .eq('id', session.user.id)
      .single();

    if (error || !profileData) {
      toast({ title: 'Failed to fetch profile', variant: 'destructive' });
      return;
    }

    setProfile(profileData);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', session.user.id);

      if (error) throw error;

      toast({ title: 'Profile updated successfully' });
      navigate('/student/dashboard');
    } catch (error: any) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h2 className="text-xl font-bold text-white text-center">Edit Profile</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={profile.full_name || ''}
          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          className="w-full p-2 rounded-md border border-gray-300"
        />

        <input
          type="email"
          placeholder="Email"
          value={profile.email || ''}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          className="w-full p-2 rounded-md border border-gray-300"
        />

        <input
          type="text"
          placeholder="Department"
          value={profile.department || ''}
          onChange={(e) => setProfile({ ...profile, department: e.target.value })}
          className="w-full p-2 rounded-md border border-gray-300"
        />

        <input
          type="text"
          placeholder="Year"
          value={profile.year || ''}
          onChange={(e) => setProfile({ ...profile, year: e.target.value })}
          className="w-full p-2 rounded-md border border-gray-300"
        />

        <Button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </Card>
    </div>
  );
};

export default EditProfile;
