import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = "newest" | "price-asc" | "price-desc";

interface SortSelectProps {
  value: SortOption;
  onValueChange: (value: SortOption) => void;
  className?: string;
}

export default function SortSelect({ value, onValueChange, className }: SortSelectProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[140px] sm:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
