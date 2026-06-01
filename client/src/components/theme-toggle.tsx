import { Button } from '@/components/ui/button';
import { useTheme } from './theme-provider';
import { ThemeToggleIcon } from '@/components/icons/Furious5Icons';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      data-testid="theme-toggle"
      className="h-9 w-9"
    >
      <ThemeToggleIcon className="h-4 w-4 transition-transform duration-200 dark:rotate-45" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
