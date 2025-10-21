import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import campusIcon from '@/assets/campus-icon.png';

const StaffLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      // Check if user is staff
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'staff') {
        await supabase.auth.signOut();
        throw new Error('Invalid credentials for staff account');
      }

      toast({
        title: 'Welcome back!',
        description: 'Logged in successfully'
      });

      navigate('/staff/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-200 via-pink-300 to-rose-400">

      <Card className="w-full max-w-md p-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/role-selection')}
          className="mb-4 bg-gradient-to-r from-orange-400 via-pink-400 to-rose-400 text-white hover:opacity-90"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8">
          <img 
            src={campusIcon} 
            alt="Campus Assistant" 
            className="w-16 h-16 mx-auto mb-4 rounded-2xl"
          />
          <h1 className="text-2xl font-bold">Staff Login</h1>
          <p className="text-muted-foreground mt-2">
            Management Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email / Staff ID</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-orange-400 via-pink-400 to-rose-400 text-white font-semibold hover:opacity-90" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Login
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Button
              variant="link"
              className="p-0 h-auto bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 font-semibold hover:underline"
              onClick={() => navigate('/staff/signup')}
            >
              Sign up
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default StaffLogin;
