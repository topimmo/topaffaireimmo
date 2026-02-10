import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { clearSettingsCache } from '@/lib/platformSettings';
import { logAdminAction } from '@/lib/auditLog';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Info, DollarSign, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface MonetizationSettings {
  monetization_enabled: boolean;
  pay_per_contact_enabled: boolean;
  pay_to_be_visible_enabled: boolean;
  contact_reveal_fee_mad: number;
  artisan_min_wallet_mad: number;
  contact_pass_duration_hours: number;
}

export default function AdminMonetization() {
  const { isRTL } = useLanguage();
  const [settings, setSettings] = useState<MonetizationSettings>({
    monetization_enabled: false,
    pay_per_contact_enabled: false,
    pay_to_be_visible_enabled: false,
    contact_reveal_fee_mad: 5,
    artisan_min_wallet_mad: 50,
    contact_pass_duration_hours: 12,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value, updated_at')
        .eq('key', 'monetization')
        .single();

      if (error) {
        console.error('Error fetching monetization settings:', error);
        toast.error('Failed to load settings');
      } else if (data) {
        setSettings(data.value as MonetizationSettings);
        setLastUpdated(data.updated_at);
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({
          value: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'monetization');

      if (error) {
        console.error('Error saving settings:', error);
        toast.error('Failed to save settings');
      } else {
        // Clear the client-side cache so changes take effect immediately
        clearSettingsCache();
        
        // Log admin action
        await logAdminAction({
          action: 'update',
          resource_type: 'platform_settings',
          resource_id: 'monetization',
          details: {
            monetization_enabled: settings.monetization_enabled,
            pay_per_contact_enabled: settings.pay_per_contact_enabled,
            pay_to_be_visible_enabled: settings.pay_to_be_visible_enabled,
          },
        });

        toast.success('Settings saved successfully');
        fetchSettings(); // Refresh to get updated timestamp
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof MonetizationSettings>(
    key: K,
    value: MonetizationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Monetization Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure monetization for Home Services / Artisans category
            </p>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Warning Banner */}
        {settings.monetization_enabled && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Monetization is currently ENABLED
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    Users will be charged according to the rules below. Toggle the master switch to disable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Master Switch */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Master Monetization Switch
            </CardTitle>
            <CardDescription>
              Enable or disable the entire monetization system. When OFF, all features are free (no paywalls).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="monetization-enabled" className="text-base font-semibold">
                  Enable Monetization
                </Label>
                <p className="text-sm text-muted-foreground">
                  Turn the monetization system ON or OFF globally
                </p>
              </div>
              <Switch
                id="monetization-enabled"
                checked={settings.monetization_enabled}
                onCheckedChange={(checked) => updateSetting('monetization_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Feature Toggles
            </CardTitle>
            <CardDescription>
              Enable or disable individual monetization features (requires monetization to be ON)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label
                  htmlFor="pay-per-contact"
                  className={`text-base font-semibold ${!settings.monetization_enabled ? 'text-muted-foreground' : ''}`}
                >
                  Pay-per-Contact
                </Label>
                <p className="text-sm text-muted-foreground">
                  Customers pay to reveal artisan phone numbers
                </p>
              </div>
              <Switch
                id="pay-per-contact"
                checked={settings.pay_per_contact_enabled}
                onCheckedChange={(checked) => updateSetting('pay_per_contact_enabled', checked)}
                disabled={!settings.monetization_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label
                  htmlFor="pay-to-be-visible"
                  className={`text-base font-semibold ${!settings.monetization_enabled ? 'text-muted-foreground' : ''}`}
                >
                  Pay-to-be-Visible (Boost)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Artisans can boost their visibility with wallet credits
                </p>
              </div>
              <Switch
                id="pay-to-be-visible"
                checked={settings.pay_to_be_visible_enabled}
                onCheckedChange={(checked) => updateSetting('pay_to_be_visible_enabled', checked)}
                disabled={!settings.monetization_enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pricing Configuration
            </CardTitle>
            <CardDescription>
              Set pricing and duration for monetization features (in Moroccan Dirham - MAD)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-fee">
                  Contact Reveal Fee (MAD)
                </Label>
                <Input
                  id="contact-fee"
                  type="number"
                  min="0"
                  value={settings.contact_reveal_fee_mad}
                  onChange={(e) => updateSetting('contact_reveal_fee_mad', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Price customers pay to reveal phone numbers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="artisan-min-wallet">
                  Artisan Minimum Wallet (MAD)
                </Label>
                <Input
                  id="artisan-min-wallet"
                  type="number"
                  min="0"
                  value={settings.artisan_min_wallet_mad}
                  onChange={(e) => updateSetting('artisan_min_wallet_mad', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum balance required for artisan boost
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pass-duration">
                  Contact Pass Duration (Hours)
                </Label>
                <Input
                  id="pass-duration"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.contact_pass_duration_hours}
                  onChange={(e) => updateSetting('contact_pass_duration_hours', parseInt(e.target.value) || 12)}
                />
                <p className="text-xs text-muted-foreground">
                  How long access lasts for same city + service category
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Pay-per-Contact:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Customers pay once to reveal artisan phone numbers</li>
                <li>Access lasts for specified duration (default 12 hours)</li>
                <li>Access is scoped to: same city + same service category</li>
                <li>During the pass window, customer can view ALL matching artisans for free</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Pay-to-be-Visible (Boost):</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Artisans can enable boost if wallet balance ≥ minimum</li>
                <li>Boosted artisans rank higher in search results</li>
                <li>Boost is optional - non-boosted artisans still appear normally</li>
                <li>No automatic charges - artisan controls their boost status</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Wallet Top-ups:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Currently manual only (admin top-up via Users page)</li>
                <li>Future: integrate Stripe/payment gateway</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
