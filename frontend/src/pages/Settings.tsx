import { User, Bell, Shield, Paintbrush } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../api';

export default function Settings() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser
  });

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-border border-t-primary animate-spin mb-2"></div>
        <p className="text-gray-400 text-sm ml-3">Loading settings...</p>
      </div>
    );
  }

  const { user, merchant } = profile;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account, team, and workspace preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary border-l-2 border-primary">
            <User className="w-4 h-4" /> Profile
          </button>
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-surfaceHover hover:text-gray-200">
            <Shield className="w-4 h-4" /> Security
          </button>
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-surfaceHover hover:text-gray-200">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-surfaceHover hover:text-gray-200">
            <Paintbrush className="w-4 h-4" /> Appearance
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-surfaceHover border border-border flex items-center justify-center text-2xl text-gray-500">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <Button variant="secondary" className="mb-2">Upload Photo</Button>
                  <p className="text-xs text-gray-500">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">First Name</label>
                  <Input defaultValue={user?.firstName || 'Admin'} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Last Name</label>
                  <Input defaultValue={user?.lastName || 'User'} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <Input defaultValue={user?.email || 'admin@recoverai.com'} type="email" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">Workspace Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Company Name</label>
                <Input defaultValue={merchant?.name || 'Acme Corp'} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Workspace ID</label>
                <Input defaultValue={merchant?.workspaceId || 'ws_K9q8w2L91Ks'} readOnly className="font-mono bg-surface text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
