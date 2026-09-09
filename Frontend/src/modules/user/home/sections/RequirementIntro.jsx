import { useNavigate } from 'react-router-dom';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Icon from '../../../../components/ui/Icon';
import { useTheme } from '../../../../hooks/useTheme';

const RequirementIntro = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <Card className="shadow-lg overflow-hidden">
      {/* Visual Planning Banner */}
      <div className="relative h-32">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=128&fit=crop&q=80"
          alt="Wedding Planning"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-between px-6">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="sparkles" size="sm" color="white" />
              <span className="font-medium">Plan</span>
            </div>
            <p className="text-xs opacity-90">Get personalized recommendations</p>
          </div>
          <Button 
            onClick={() => navigate('/user/requirements')}
            variant="secondary"
            size="sm"
            style={{
              backgroundColor: 'white',
              color: theme.colors.primary[600],
              borderColor: 'white'
            }}
            className="shadow-lg hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            Start
            <Icon name="arrow" size="xs" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RequirementIntro;