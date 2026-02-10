import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ArtisanLayout from "@/components/layout/ArtisanLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Phone,
  MessageSquare,
  Mail,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
  Wrench,
  Calendar,
  MessageCircle,
  PhoneCall,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock leads data
const mockLeads = [
  {
    id: "1",
    type: "call",
    name: "Ahmed Benali",
    phone: "+212 6XX XXX XXX",
    date: "2024-01-15T10:30:00",
    status: "new",
    service: "Plomberie",
    city: "Casablanca",
    neighborhood: "Maarif",
    message: "Fuite d'eau dans la salle de bain, besoin d'intervention urgente.",
  },
  {
    id: "2",
    type: "whatsapp",
    name: "Fatima Moussaoui",
    phone: "+212 6XX XXX XXX",
    date: "2024-01-15T09:15:00",
    status: "new",
    service: "Électricité",
    city: "Casablanca",
    neighborhood: "Anfa",
    message: "Installation de prises électriques dans un nouveau bureau.",
  },
  {
    id: "3",
    type: "message",
    name: "Youssef Kabbaj",
    phone: "+212 6XX XXX XXX",
    date: "2024-01-14T16:45:00",
    status: "in_progress",
    service: "Plomberie",
    city: "Rabat",
    neighborhood: "Agdal",
    message: "Changement de chauffe-eau, besoin d'un devis.",
  },
  {
    id: "4",
    type: "call",
    name: "Sara Lahlou",
    phone: "+212 6XX XXX XXX",
    date: "2024-01-14T14:20:00",
    status: "completed",
    service: "Peinture",
    city: "Casablanca",
    neighborhood: "Bourgogne",
    message: "Peinture complète d'un appartement 3 chambres.",
  },
  {
    id: "5",
    type: "whatsapp",
    name: "Omar Tazi",
    phone: "+212 6XX XXX XXX",
    date: "2024-01-13T11:00:00",
    status: "archived",
    service: "Électricité",
    city: "Casablanca",
    neighborhood: "Gauthier",
    message: "Dépannage tableau électrique.",
  },
];

type LeadStatus = "new" | "in_progress" | "completed" | "archived";

export default function ArtisanLeads() {
  const { isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesType = typeFilter === "all" || lead.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: LeadStatus) => {
    const config = {
      new: { label: isRTL ? "جديد" : "Nouveau", class: "bg-blue-100 text-blue-700" },
      in_progress: { label: isRTL ? "قيد التنفيذ" : "En cours", class: "bg-yellow-100 text-yellow-700" },
      completed: { label: isRTL ? "مكتمل" : "Terminé", class: "bg-green-100 text-green-700" },
      archived: { label: isRTL ? "مؤرشف" : "Archivé", class: "bg-gray-100 text-gray-700" },
    };
    return <Badge className={config[status].class}>{config[status].label}</Badge>;
  };

  const getLeadIcon = (type: string) => {
    switch (type) {
      case "call":
        return <PhoneCall className="w-5 h-5 text-green-600" />;
      case "whatsapp":
        return <MessageCircle className="w-5 h-5 text-emerald-600" />;
      case "message":
        return <Mail className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const updateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    // In production, update via Supabase
    toast.success(
      isRTL
        ? `تم تحديث حالة العميل`
        : `Statut du lead mis à jour`
    );
  };

  const leadCounts = {
    all: mockLeads.length,
    new: mockLeads.filter((l) => l.status === "new").length,
    in_progress: mockLeads.filter((l) => l.status === "in_progress").length,
    completed: mockLeads.filter((l) => l.status === "completed").length,
    archived: mockLeads.filter((l) => l.status === "archived").length,
  };

  const currentLead = selectedLead
    ? mockLeads.find((l) => l.id === selectedLead)
    : null;

  return (
    <ArtisanLayout>
      <div className="p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">
            {isRTL ? "العملاء المحتملون" : "Boîte de leads"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL
              ? "إدارة جميع طلبات العملاء"
              : "Gérez toutes les demandes de vos clients"}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                {isRTL ? "الكل" : "Tous"}
                <Badge variant="secondary" className="ml-1">{leadCounts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                {isRTL ? "جديد" : "Nouveaux"}
                <Badge variant="secondary" className="ml-1">{leadCounts.new}</Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="gap-2">
                {isRTL ? "قيد التنفيذ" : "En cours"}
                <Badge variant="secondary" className="ml-1">{leadCounts.in_progress}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2 hidden sm:flex">
                {isRTL ? "مكتمل" : "Terminés"}
                <Badge variant="secondary" className="ml-1">{leadCounts.completed}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={isRTL ? "بحث..." : "Rechercher..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "كل الأنواع" : "Tous types"}</SelectItem>
                  <SelectItem value="call">{isRTL ? "مكالمات" : "Appels"}</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="message">{isRTL ? "رسائل" : "Messages"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Leads List */}
            <div className="lg:col-span-2 space-y-3">
              <TabsContent value="all" className="m-0 space-y-3">
                {filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isRTL={isRTL}
                    isSelected={selectedLead === lead.id}
                    onClick={() => setSelectedLead(lead.id)}
                    onStatusChange={updateLeadStatus}
                    getStatusBadge={getStatusBadge}
                    getLeadIcon={getLeadIcon}
                  />
                ))}
              </TabsContent>
              <TabsContent value="new" className="m-0 space-y-3">
                {filteredLeads.filter((l) => l.status === "new").map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isRTL={isRTL}
                    isSelected={selectedLead === lead.id}
                    onClick={() => setSelectedLead(lead.id)}
                    onStatusChange={updateLeadStatus}
                    getStatusBadge={getStatusBadge}
                    getLeadIcon={getLeadIcon}
                  />
                ))}
              </TabsContent>
              <TabsContent value="in_progress" className="m-0 space-y-3">
                {filteredLeads.filter((l) => l.status === "in_progress").map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isRTL={isRTL}
                    isSelected={selectedLead === lead.id}
                    onClick={() => setSelectedLead(lead.id)}
                    onStatusChange={updateLeadStatus}
                    getStatusBadge={getStatusBadge}
                    getLeadIcon={getLeadIcon}
                  />
                ))}
              </TabsContent>
              <TabsContent value="completed" className="m-0 space-y-3">
                {filteredLeads.filter((l) => l.status === "completed").map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isRTL={isRTL}
                    isSelected={selectedLead === lead.id}
                    onClick={() => setSelectedLead(lead.id)}
                    onStatusChange={updateLeadStatus}
                    getStatusBadge={getStatusBadge}
                    getLeadIcon={getLeadIcon}
                  />
                ))}
              </TabsContent>
            </div>

            {/* Lead Details Panel */}
            <div className="hidden lg:block">
              {currentLead ? (
                <Card className="sticky top-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{currentLead.name}</CardTitle>
                          <CardDescription>{currentLead.phone}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(currentLead.status as LeadStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Lead Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {isRTL ? "الخدمة:" : "Service:"}
                        </span>
                        <span className="font-medium">{currentLead.service}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {isRTL ? "الموقع:" : "Lieu:"}
                        </span>
                        <span className="font-medium">
                          {currentLead.neighborhood}, {currentLead.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {isRTL ? "التاريخ:" : "Date:"}
                        </span>
                        <span className="font-medium">
                          {new Date(currentLead.date).toLocaleDateString(
                            isRTL ? "ar-MA" : "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">
                        {isRTL ? "الرسالة:" : "Message:"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentLead.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button className="gap-2">
                        <Phone className="w-4 h-4" />
                        {isRTL ? "اتصال" : "Appeler"}
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    </div>

                    {/* Status Update */}
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">
                        {isRTL ? "تحديث الحالة:" : "Mettre à jour le statut:"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateLeadStatus(currentLead.id, "in_progress")}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {isRTL ? "قيد التنفيذ" : "En cours"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateLeadStatus(currentLead.id, "completed")}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {isRTL ? "مكتمل" : "Terminé"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateLeadStatus(currentLead.id, "archived")}
                        >
                          <Archive className="w-3 h-3 mr-1" />
                          {isRTL ? "أرشفة" : "Archiver"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {isRTL
                        ? "اختر عميل لعرض التفاصيل"
                        : "Sélectionnez un lead pour voir les détails"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </ArtisanLayout>
  );
}

// Lead Card Component
function LeadCard({
  lead,
  isRTL,
  isSelected,
  onClick,
  onStatusChange,
  getStatusBadge,
  getLeadIcon,
}: {
  lead: typeof mockLeads[0];
  isRTL: boolean;
  isSelected: boolean;
  onClick: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  getStatusBadge: (status: LeadStatus) => JSX.Element;
  getLeadIcon: (type: string) => JSX.Element | null;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary",
        lead.status === "new" && "border-l-4 border-l-blue-500"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {getLeadIcon(lead.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{lead.name}</h3>
              <div className="flex items-center gap-2">
                {getStatusBadge(lead.status as LeadStatus)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onStatusChange(lead.id, "in_progress")}>
                      <Clock className="w-4 h-4 mr-2" />
                      {isRTL ? "قيد التنفيذ" : "En cours"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(lead.id, "completed")}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {isRTL ? "مكتمل" : "Terminé"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(lead.id, "archived")}>
                      <Archive className="w-4 h-4 mr-2" />
                      {isRTL ? "أرشفة" : "Archiver"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                {lead.service}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {lead.neighborhood}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(lead.date).toLocaleTimeString(isRTL ? "ar-MA" : "fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {lead.message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
