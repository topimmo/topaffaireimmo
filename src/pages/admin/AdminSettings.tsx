import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/auditLog';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Info } from 'lucide-react';
import { toast } from 'sonner';
import { BUILD_INFO, getBuildInfoDisplay } from '@/config/buildInfo';

interface Settings {
  contact_email?: string;
  maintenance_mode?: boolean;
  adsense_header_slot?: string;
  adsense_sidebar_slot?: string;
  adsense_footer_slot?: string;
}

export default function AdminSettings() {
  const { isRTL } = useLanguage();
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);

    try {
      // site_settings is a key-value store, so we fetch all settings
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) {
        console.error('Error fetching settings:', error);
      } else if (data && Array.isArray(data)) {
        // Convert array of key-value pairs to settings object
        const settingsMap: Record<string, any> = {};
        data.forEach((item) => {
          try {
            // If value is already parsed JSON, use it directly
            settingsMap[item.key] = typeof item.value === 'string' 
              ? JSON.parse(item.value) 
              : item.value;
          } catch {
            settingsMap[item.key] = item.value;
          }
        });

        setSettings({
          contact_email: settingsMap.contact_email || '',
          maintenance_mode: settingsMap.maintenance_mode || false,
          adsense_header_slot: settingsMap.adsense_header_slot || '',
          adsense_sidebar_slot: settingsMap.adsense_sidebar_slot || '',
          adsense_footer_slot: settingsMap.adsense_footer_slot || '',
        });
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // site_settings is a key-value store, so we upsert each setting individually
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        category: 'general',
        is_public: false,
      }));

      // Use upsert to insert or update each setting
      const { error } = await supabase
        .from('site_settings')
        .upsert(settingsToSave, { onConflict: 'key' });

      if (error) {
        console.error('Save error:', error);
        toast.error(isRTL ? 'خطأ في الحفظ' : 'Error saving settings');
        return;
      }

      // Log audit action
      await logAdminAction({
        action: 'update',
        entity_type: 'settings',
        metadata: { changes: Object.keys(settings) },
      });

      toast.success(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(isRTL ? 'خطأ في الحفظ' : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isRTL ? 'الإعدادات' : 'Settings'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isRTL ? 'إدارة إعدادات الموقع' : 'Manage site settings'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'معلومات الاتصال' : 'Contact Information'}</CardTitle>
                <CardDescription>
                  {isRTL
                    ? 'معلومات الاتصال الرئيسية للموقع'
                    : 'Primary contact information for the site'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, contact_email: e.target.value })
                    }
                    placeholder="contact@topaffaireimmo.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    {isRTL 
                      ? 'عنوان البريد الإلكتروني الرئيسي للموقع' 
                      : 'Primary email address for the site'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'إعدادات النظام' : 'System Settings'}</CardTitle>
                <CardDescription>
                  {isRTL ? 'إعدادات عامة للنظام' : 'General system settings'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{isRTL ? 'وضع الصيانة' : 'Maintenance Mode'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {isRTL
                        ? 'تفعيل وضع الصيانة للموقع'
                        : 'Enable maintenance mode for the site'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode || false}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, maintenance_mode: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* AdSense Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'إعدادات AdSense' : 'AdSense Settings'}</CardTitle>
                <CardDescription>
                  {isRTL
                    ? 'إعدادات إعلانات Google AdSense'
                    : 'Google AdSense advertising settings'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adsense_header_slot">
                    {isRTL ? 'فتحة الرأس' : 'Header Slot'}
                  </Label>
                  <Input
                    id="adsense_header_slot"
                    value={settings.adsense_header_slot || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, adsense_header_slot: e.target.value })
                    }
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adsense_sidebar_slot">
                    {isRTL ? 'فتحة الشريط الجانبي' : 'Sidebar Slot'}
                  </Label>
                  <Input
                    id="adsense_sidebar_slot"
                    value={settings.adsense_sidebar_slot || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, adsense_sidebar_slot: e.target.value })
                    }
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adsense_footer_slot">
                    {isRTL ? 'فتحة التذييل' : 'Footer Slot'}
                  </Label>
                  <Input
                    id="adsense_footer_slot"
                    value={settings.adsense_footer_slot || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, adsense_footer_slot: e.target.value })
                    }
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Build Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {isRTL ? 'معلومات البناء' : 'Build Information'}
                </CardTitle>
                <CardDescription>
                  {isRTL
                    ? 'معلومات عن إصدار التطبيق المنشور حاليًا'
                    : 'Information about the currently deployed application version'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-muted-foreground">
                      {isRTL ? 'الإصدار' : 'Version'}
                    </p>
                    <p className="font-mono">{BUILD_INFO.version}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">
                      {isRTL ? 'معرف الالتزام' : 'Commit SHA'}
                    </p>
                    <p className="font-mono break-all">{BUILD_INFO.commitSha}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">
                      {isRTL ? 'البيئة' : 'Environment'}
                    </p>
                    <p className="font-mono">
                      {BUILD_INFO.isProduction ? 'Production' : 'Development'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">
                      {isRTL ? 'وقت البناء' : 'Build Time'}
                    </p>
                    <p className="font-mono text-xs">
                      {new Date(BUILD_INFO.buildTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="font-semibold text-muted-foreground mb-2">
                      {isRTL ? 'سلسلة الإصدار الكاملة' : 'Full Version String'}
                    </p>
                    <code className="bg-muted px-3 py-2 rounded-md block">
                      {getBuildInfoDisplay()}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
