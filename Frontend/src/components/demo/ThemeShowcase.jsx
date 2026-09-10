import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import Input from '../ui/Input';

const ThemeShowcase = () => {
  const { themeName, changeTheme, availableThemes } = useTheme();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-theme-primary mb-4">
          Utsavo Theme System
        </h1>
        <p className="text-lg text-theme-secondary">
          Centralized, flexible theming with CSS variables and Tailwind CSS
        </p>
      </div>

      {/* Theme Switcher */}
      <Card>
        <Card.Header>
          <Card.Title>Theme Switcher</Card.Title>
          <p className="text-theme-secondary">
            Current theme: <span className="font-semibold capitalize">{themeName}</span>
          </p>
        </Card.Header>
        <Card.Content>
          <div className="flex gap-3 flex-wrap">
            {availableThemes.map((theme) => (
              <Button
                key={theme}
                variant={themeName === theme ? 'primary' : 'outline'}
                onClick={() => changeTheme(theme)}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Button>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Components Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buttons */}
        <Card>
          <Card.Header>
            <Card.Title>Button Variants</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-3">
            <Button variant="primary" className="w-full">Primary Button</Button>
            <Button variant="secondary" className="w-full">Secondary Button</Button>
            <Button variant="outline" className="w-full">Outline Button</Button>
            <Button variant="ghost" className="w-full">Ghost Button</Button>
          </Card.Content>
        </Card>

        {/* Form Elements */}
        <Card>
          <Card.Header>
            <Card.Title>Form Elements</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Input label="Name" placeholder="Enter your name" />
            <Input label="Email" type="email" placeholder="Enter your email" />
            <Input label="Phone" type="tel" placeholder="Enter your phone" />
          </Card.Content>
        </Card>
      </div>

      {/* Color Palette */}
      <Card>
        <Card.Header>
          <Card.Title>Color Palette</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-theme-primary rounded-lg mx-auto mb-3 shadow-theme-card"></div>
              <p className="font-medium text-theme-primary">Primary</p>
              <p className="text-sm text-theme-secondary">Main brand color</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-theme-secondary rounded-lg mx-auto mb-3 shadow-theme-card"></div>
              <p className="font-medium text-theme-primary">Secondary</p>
              <p className="text-sm text-theme-secondary">Supporting color</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-theme-accent rounded-lg mx-auto mb-3 shadow-theme-card"></div>
              <p className="font-medium text-theme-primary">Accent</p>
              <p className="text-sm text-theme-secondary">Highlight color</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-theme-card border-2 border-theme-card rounded-lg mx-auto mb-3 shadow-theme-card"></div>
              <p className="font-medium text-theme-primary">Card</p>
              <p className="text-sm text-theme-secondary">Surface color</p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Typography */}
      <Card>
        <Card.Header>
          <Card.Title>Typography</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <h1 className="text-3xl font-bold text-theme-primary">Heading 1</h1>
          <h2 className="text-2xl font-semibold text-theme-primary">Heading 2</h2>
          <h3 className="text-xl font-medium text-theme-primary">Heading 3</h3>
          <p className="text-theme-primary">Primary text - Main content and headings</p>
          <p className="text-theme-secondary">Secondary text - Supporting information</p>
          <p className="text-theme-tertiary">Tertiary text - Subtle details and metadata</p>
        </Card.Content>
      </Card>

      {/* Features */}
      <Card>
        <Card.Header>
          <Card.Title>Theme System Features</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Icon name="check" size="lg" color="accent" />
              <div>
                <h4 className="font-medium text-theme-primary">Centralized Colors</h4>
                <p className="text-sm text-theme-secondary">All colors defined in one place</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Icon name="check" size="lg" color="accent" />
              <div>
                <h4 className="font-medium text-theme-primary">CSS Variables</h4>
                <p className="text-sm text-theme-secondary">Dynamic theme switching</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Icon name="check" size="lg" color="accent" />
              <div>
                <h4 className="font-medium text-theme-primary">Tailwind Integration</h4>
                <p className="text-sm text-theme-secondary">Seamless utility classes</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Icon name="check" size="lg" color="accent" />
              <div>
                <h4 className="font-medium text-theme-primary">No Hardcoded Colors</h4>
                <p className="text-sm text-theme-secondary">Consistent theming everywhere</p>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ThemeShowcase;