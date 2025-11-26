
import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface LocationInputProps {
  city: string;
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (city: string, lat: number, lng: number) => void;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  city,
  latitude,
  longitude,
  onLocationChange,
}) => {
  const [cityInput, setCityInput] = useState(city);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Try to get city name from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
          );
          const data = await response.json();
          
          const cityName = data.address?.city || 
                          data.address?.town || 
                          data.address?.village || 
                          data.address?.county || 
                          'Unknown Location';
          
          setCityInput(cityName);
          onLocationChange(cityName, lat, lng);
          toast.success('Location updated successfully');
        } catch (error) {
          console.error('Error getting city name:', error);
          setCityInput('My Location');
          onLocationChange('My Location', lat, lng);
          toast.success('Coordinates saved, please enter your city name');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        console.error('Error getting location:', error);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out');
            break;
          default:
            toast.error('Failed to get location');
        }
      }
    );
  };

  const handleCityChange = (newCity: string) => {
    setCityInput(newCity);
    // If we already have coordinates, update city only
    if (latitude && longitude) {
      onLocationChange(newCity, latitude, longitude);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="city">City/Location</Label>
        <div className="flex gap-2">
          <Input
            id="city"
            placeholder="Enter your city"
            value={cityInput}
            onChange={(e) => handleCityChange(e.target.value)}
            maxLength={100}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            title="Get current location"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
        </div>
        {latitude && longitude && (
          <p className="text-xs text-muted-foreground">
            Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Your location helps other users find books near them
        </p>
      </div>
    </div>
  );
};
