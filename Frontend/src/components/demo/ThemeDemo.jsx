import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import Card from '../ui/Card';
import Button from '../ui/Button';

const ThemeDemo = () => {
  const { theme, themeName, changeTheme, availableThemes } = useTheme();

  return (
    <Card className="max-w-2xl mx-auto">
      <Card.Header>
        <Card.Title>Theme System Demo</Card.Title>
        <p className="text-theme-secondary">
          Current theme: <span className="font-semibold">{themeName}</span>
        </p>
      </Card.Header>

      <Card.Content className="space-y-6">
        {/* Theme Switcher */}
        <div>
          <h4 className="font-medium text-theme-primary mb-3">Switch Theme:</h4>
          <div className="flex gap-2 flex-wrap">
            {availableThemes.map((theme) => (
              <Button
                key={theme}
                variant={themeName === theme ? 'primary' : 'outline'}
                size="sm"
                onClick={() => changeTheme(theme)}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Color Palette Demo */}
        <div>
          <h4 className="font-medium text-theme-primary mb-3">Color Palette:</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-theme-primary rounded-lg mx-auto mb-2"></div>
              <p className="text-sm text-theme-secondary">Primary</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-theme-secondary rounded-lg mx-auto mb-2"></div>
              <p className="text-sm text-theme-secondary">Secondary</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-theme-accent rounded-lg mx-auto mb-2"></div>
              <p className="text-sm text-theme-secondary">Accent</p>
            </div>
          </div>
        </div>

        {/* Button Variants */}
        <div>
          <h4 className="font-medium text-theme-primary mb-3">Button Variants:</h4>
          <div className="flex gap-2 flex-wrap">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>

        {/* Text Colors */}
        <div>
          <h4 className="font-medium text-theme-primary mb-3">Text Colors:</h4>
          <div className="space-y-1">
            <p className="text-theme-primary">Primary text color</p>
            <p className="text-theme-secondary">Secondary text color</p>
            <p className="text-theme-tertiary">Tertiary text color</p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};

export default ThemeDemo;