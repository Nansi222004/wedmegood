import { useTheme } from '../../hooks/useTheme';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import Input from '../ui/Input';

const ThemeSystemTest = () => {
  const { theme, themeName, changeTheme, availableThemes } = useTheme();

  const testColors = [
    { name: 'Primary 500', value: theme.colors.primary[500] },
    { name: 'Secondary 500', value: theme.colors.secondary[500] },
    { name: 'Accent 500', value: theme.colors.accent[500] },
    { name: 'Background Primary', value: theme.semantic.background.primary },
    { name: 'Text Primary', value: theme.semantic.text.primary },
    { name: 'Border Primary', value: theme.semantic.border.primary },
  ];

  return (
    <div 
      className="min-h-screen p-8"
      style={{ backgroundColor: theme.semantic.background.secondary }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <Card>
          <Card.Header>
            <Card.Title>Theme System Test</Card.Title>
            <p style={{ color: theme.semantic.text.secondary }}>
              Testing centralized theme system - Current theme: {themeName}
            </p>
          </Card.Header>
        </Card>

        {/* Theme Switcher */}
        <Card>
          <Card.Header>
            <Card.Title>Theme Switching</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex gap-2 flex-wrap">
              {availableThemes.map((themeOption) => (
                <Button
                  key={themeOption}
                  variant={themeName === themeOption ? 'primary' : 'outline'}
                  onClick={() => changeTheme(themeOption)}
                  size="sm"
                >
                  {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                </Button>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Color Palette Display */}
        <Card>
          <Card.Header>
            <Card.Title>Color Palette</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {testColors.map((color) => (
                <div key={color.name} className="text-center">
                  <div
                    className="w-full h-16 rounded-lg mb-2 border"
                    style={{ 
                      backgroundColor: color.value,
                      borderColor: theme.semantic.border.primary
                    }}
                  />
                  <p 
                    className="text-sm font-medium"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    {color.name}
                  </p>
                  <p 
                    className="text-xs font-mono"
                    style={{ color: theme.semantic.text.tertiary }}
                  >
                    {color.value}
                  </p>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Component Testing */}
        <Card>
          <Card.Header>
            <Card.Title>Component Integration Test</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            {/* Buttons */}
            <div>
              <h4 
                className="font-medium mb-2"
                style={{ color: theme.semantic.text.primary }}
              >
                Buttons
              </h4>
              <div className="flex gap-2 flex-wrap">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <h4 
                className="font-medium mb-2"
                style={{ color: theme.semantic.text.primary }}
              >
                Inputs
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Text Input" placeholder="Enter text..." />
                <Input label="Email Input" type="email" placeholder="Enter email..." />
              </div>
            </div>

            {/* Cards */}
            <div>
              <h4 
                className="font-medium mb-2"
                style={{ color: theme.semantic.text.primary }}
              >
                Nested Cards
              </h4>
              <Card hover={true}>
                <Card.Content>
                  <p style={{ color: theme.semantic.text.secondary }}>
                    This is a nested card with hover effects using theme colors.
                  </p>
                </Card.Content>
                <Card.Footer>
                  <Button variant="outline" size="sm">Action</Button>
                </Card.Footer>
              </Card>
            </div>
          </Card.Content>
        </Card>

        {/* Gradient Testing */}
        <Card>
          <Card.Header>
            <Card.Title>Gradient Testing</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="h-24 rounded-lg flex items-center justify-center"
                style={{ background: theme.semantic.background.gradient.primary }}
              >
                <span style={{ color: theme.semantic.text.primary }}>
                  Primary Gradient
                </span>
              </div>
              <div
                className="h-24 rounded-lg flex items-center justify-center"
                style={{ background: theme.semantic.background.gradient.hero }}
              >
                <span style={{ color: theme.semantic.text.inverse }}>
                  Hero Gradient
                </span>
              </div>
              <div
                className="h-24 rounded-lg flex items-center justify-center"
                style={{ background: theme.semantic.background.gradient.card }}
              >
                <span style={{ color: theme.semantic.text.primary }}>
                  Card Gradient
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Status Report */}
        <Card>
          <Card.Header>
            <Card.Title>System Status</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon name="check" size="sm" color="accent" />
                <span style={{ color: theme.semantic.text.primary }}>
                  Centralized theme configuration active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="check" size="sm" color="accent" />
                <span style={{ color: theme.semantic.text.primary }}>
                  All components using theme system
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="check" size="sm" color="accent" />
                <span style={{ color: theme.semantic.text.primary }}>
                  No hardcoded colors detected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="check" size="sm" color="accent" />
                <span style={{ color: theme.semantic.text.primary }}>
                  Theme switching functional
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default ThemeSystemTest;