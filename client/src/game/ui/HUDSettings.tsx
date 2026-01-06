// HUD Settings Component - Allows customization of HUD position and size

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X, Settings, Move, Maximize2 } from 'lucide-react';

export interface HUDConfig {
  position: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: 'small' | 'medium' | 'large';
  opacity: number;
  showScore: boolean;
  showLives: boolean;
  showTime: boolean;
  showPowerUps: boolean;
  showMinimap: boolean;
  controlsPosition: 'left' | 'right' | 'both';
  controlsSize: number;
  controlsOpacity: number;
}

const defaultConfig: HUDConfig = {
  position: 'top',
  size: 'medium',
  opacity: 100,
  showScore: true,
  showLives: true,
  showTime: true,
  showPowerUps: true,
  showMinimap: false,
  controlsPosition: 'both',
  controlsSize: 100,
  controlsOpacity: 80,
};

interface HUDSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: HUDConfig;
  onConfigChange: (config: HUDConfig) => void;
}

export function HUDSettings({ isOpen, onClose, config, onConfigChange }: HUDSettingsProps) {
  const [localConfig, setLocalConfig] = useState<HUDConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = <K extends keyof HUDConfig>(key: K, value: HUDConfig[K]) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
    saveConfig(newConfig);
  };

  const resetToDefaults = () => {
    setLocalConfig(defaultConfig);
    onConfigChange(defaultConfig);
    saveConfig(defaultConfig);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-900/95 border-white/20 text-white max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            HUD Settings
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* HUD Position */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Move className="w-4 h-4" />
              HUD Position
            </Label>
            <Select
              value={localConfig.position}
              onValueChange={(value) => handleChange('position', value as HUDConfig['position'])}
            >
              <SelectTrigger className="bg-white/10 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20">
                <SelectItem value="top">Top Center</SelectItem>
                <SelectItem value="bottom">Bottom Center</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* HUD Size */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              HUD Size
            </Label>
            <Select
              value={localConfig.size}
              onValueChange={(value) => handleChange('size', value as HUDConfig['size'])}
            >
              <SelectTrigger className="bg-white/10 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20">
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* HUD Opacity */}
          <div className="space-y-2">
            <Label>HUD Opacity: {localConfig.opacity}%</Label>
            <Slider
              value={[localConfig.opacity]}
              onValueChange={([value]) => handleChange('opacity', value)}
              min={20}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* HUD Elements */}
          <div className="space-y-3">
            <Label>Show Elements</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Score</span>
                <Switch
                  checked={localConfig.showScore}
                  onCheckedChange={(checked) => handleChange('showScore', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Lives</span>
                <Switch
                  checked={localConfig.showLives}
                  onCheckedChange={(checked) => handleChange('showLives', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Time</span>
                <Switch
                  checked={localConfig.showTime}
                  onCheckedChange={(checked) => handleChange('showTime', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Power-ups</span>
                <Switch
                  checked={localConfig.showPowerUps}
                  onCheckedChange={(checked) => handleChange('showPowerUps', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Minimap</span>
                <Switch
                  checked={localConfig.showMinimap}
                  onCheckedChange={(checked) => handleChange('showMinimap', checked)}
                />
              </div>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <Label className="text-lg">Mobile Controls</Label>
            
            <div className="space-y-2">
              <Label>Controls Position</Label>
              <Select
                value={localConfig.controlsPosition}
                onValueChange={(value) => handleChange('controlsPosition', value as HUDConfig['controlsPosition'])}
              >
                <SelectTrigger className="bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value="left">Left Side</SelectItem>
                  <SelectItem value="right">Right Side</SelectItem>
                  <SelectItem value="both">Both Sides (D-pad left, buttons right)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Controls Size: {localConfig.controlsSize}%</Label>
              <Slider
                value={[localConfig.controlsSize]}
                onValueChange={([value]) => handleChange('controlsSize', value)}
                min={50}
                max={150}
                step={10}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Controls Opacity: {localConfig.controlsOpacity}%</Label>
              <Slider
                value={[localConfig.controlsOpacity]}
                onValueChange={([value]) => handleChange('controlsOpacity', value)}
                min={20}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-white/20"
              onClick={resetToDefaults}
            >
              Reset to Defaults
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Save/Load config from localStorage
export function saveConfig(config: HUDConfig): void {
  try {
    localStorage.setItem('bomberman_hud_config', JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save HUD config:', e);
  }
}

export function loadConfig(): HUDConfig {
  try {
    const saved = localStorage.getItem('bomberman_hud_config');
    if (saved) {
      return { ...defaultConfig, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load HUD config:', e);
  }
  return defaultConfig;
}

export { defaultConfig };
