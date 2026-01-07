import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { 
  Settings as SettingsIcon, 
  Brain, 
  Shield, 
  Bell, 
  Database,
  User,
  Cpu,
  Save,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  
  // États pour les paramètres
  const [modelSettings, setModelSettings] = useState({
    version: "v2.1",
    confidenceThreshold: 0.85,
    autoAnalysis: true,
    batchProcessing: false
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    systemAlerts: true,
    weeklyReports: false,
    criticalFindings: true
  });

  const [systemSettings, setSystemSettings] = useState({
    language: "fr",
    timezone: "Europe/Paris",
    dataRetention: "365",
    backupFrequency: "daily"
  });

  const handleSaveSettings = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos modifications ont été enregistrées avec succès."
    });
  };

  const handleResetModel = () => {
    toast({
      title: "Modèle réinitialisé",
      description: "Le modèle IA a été réinitialisé aux paramètres par défaut."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Paramètres Système</h2>
          <p className="text-muted-foreground">
            Configuration et gestion du système de diagnostic IA
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Paramètres principaux */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration du Modèle IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Configuration du Modèle IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model-version">Version du Modèle</Label>
                    <Select value={modelSettings.version} onValueChange={(value) => 
                      setModelSettings(prev => ({...prev, version: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v2.1">v2.1 (Actuel)</SelectItem>
                        <SelectItem value="v2.0">v2.0 (Stable)</SelectItem>
                        <SelectItem value="v1.9">v1.9 (Legacy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confidence">Seuil de Confiance</Label>
                    <Input
                      id="confidence"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={modelSettings.confidenceThreshold}
                      onChange={(e) => setModelSettings(prev => ({
                        ...prev, 
                        confidenceThreshold: parseFloat(e.target.value)
                      }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Analyse Automatique</Label>
                      <p className="text-sm text-muted-foreground">
                        Traitement automatique des nouvelles images
                      </p>
                    </div>
                    <Switch
                      checked={modelSettings.autoAnalysis}
                      onCheckedChange={(checked) => 
                        setModelSettings(prev => ({...prev, autoAnalysis: checked}))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Traitement par Lot</Label>
                      <p className="text-sm text-muted-foreground">
                        Activer le traitement par batch pour les volumes importants
                      </p>
                    </div>
                    <Switch
                      checked={modelSettings.batchProcessing}
                      onCheckedChange={(checked) => 
                        setModelSettings(prev => ({...prev, batchProcessing: checked}))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Alertes Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir les notifications par email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({...prev, emailAlerts: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Alertes Système</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications dans l'interface
                    </p>
                  </div>
                  <Switch
                    checked={notifications.systemAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({...prev, systemAlerts: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Rapports Hebdomadaires</Label>
                    <p className="text-sm text-muted-foreground">
                      Rapport automatique chaque semaine
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({...prev, weeklyReports: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Découvertes Critiques</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerte immédiate pour les cas urgents
                    </p>
                  </div>
                  <Switch
                    checked={notifications.criticalFindings}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({...prev, criticalFindings: checked}))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Paramètres Système */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Paramètres Système
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Langue</Label>
                    <Select value={systemSettings.language} onValueChange={(value) => 
                      setSystemSettings(prev => ({...prev, language: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fuseau Horaire</Label>
                    <Select value={systemSettings.timezone} onValueChange={(value) => 
                      setSystemSettings(prev => ({...prev, timezone: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
                        <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                        <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rétention des Données</Label>
                    <Select value={systemSettings.dataRetention} onValueChange={(value) => 
                      setSystemSettings(prev => ({...prev, dataRetention: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90 jours</SelectItem>
                        <SelectItem value="365">1 an</SelectItem>
                        <SelectItem value="1095">3 ans</SelectItem>
                        <SelectItem value="unlimited">Illimité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fréquence de Sauvegarde</Label>
                    <Select value={systemSettings.backupFrequency} onValueChange={(value) => 
                      setSystemSettings(prev => ({...prev, backupFrequency: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            {/* État du système */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  État du Système
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant="default" className="bg-success">En ligne</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Modèle IA</span>
                  <Badge variant="outline">v2.1</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Dernière Mise à Jour</span>
                  <span className="text-sm text-muted-foreground">15/01/2024</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="text-sm text-muted-foreground">99.9%</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={handleSaveSettings}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleResetModel}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser Modèle
                </Button>

                <Button variant="destructive" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Mode Maintenance
                </Button>
              </CardContent>
            </Card>

            {/* Sécurité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Authentification à 2 Facteurs</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Activée</span>
                    <Badge variant="default" className="bg-success">✓</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Chiffrement des Données</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">AES-256</span>
                    <Badge variant="default" className="bg-success">✓</Badge>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Gestion des Utilisateurs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;