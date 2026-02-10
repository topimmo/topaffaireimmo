import { ReactNode, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Filter, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFilterDrawerProps {
  children: ReactNode;
  title?: string;
  activeFiltersCount?: number;
  onReset?: () => void;
  onApply?: () => void;
}

export default function MobileFilterDrawer({
  children,
  title,
  activeFiltersCount = 0,
  onReset,
  onApply,
}: MobileFilterDrawerProps) {
  const { isRTL } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onApply?.();
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="lg:hidden gap-2 relative">
          <Filter className="w-4 h-4" />
          {isRTL ? "فلتر" : "Filtrer"}
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle>
              {title || (isRTL ? "فلترة النتائج" : "Filtrer les résultats")}
            </DrawerTitle>
            {activeFiltersCount > 0 && onReset && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                {isRTL ? "إعادة تعيين" : "Réinitialiser"}
              </Button>
            )}
          </div>
        </DrawerHeader>
        
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
          {children}
        </div>
        
        <DrawerFooter className="border-t">
          <div className="flex gap-3">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                {isRTL ? "إلغاء" : "Annuler"}
              </Button>
            </DrawerClose>
            <Button onClick={handleApply} className="flex-1 gap-2">
              <Check className="w-4 h-4" />
              {isRTL ? "تطبيق" : "Appliquer"}
              {activeFiltersCount > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
