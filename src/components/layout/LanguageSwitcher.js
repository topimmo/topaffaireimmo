import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
];
export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const currentLanguage = languages.find((l) => l.code === language);
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "gap-2", children: [_jsx(Globe, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: currentLanguage?.flag })] }) }), _jsx(DropdownMenuContent, { align: "end", children: languages.map((lang) => (_jsxs(DropdownMenuItem, { onClick: () => setLanguage(lang.code), className: language === lang.code ? 'bg-muted' : '', children: [_jsx("span", { className: "mr-2", children: lang.flag }), lang.label] }, lang.code))) })] }));
}
