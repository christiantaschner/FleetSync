
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressAutocompleteInputProps extends React.ComponentPropsWithoutRef<typeof Input> {
  value: string;
  onValueChange: (value: string) => void;
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({ value, onValueChange, onLocationSelect, className, ...props }) => {
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [geocodingService, setGeocodingService] = useState<google.maps.Geocoder | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  const places = useMapsLibrary('places');
  const geocoding = useMapsLibrary('geocoding');

  useEffect(() => {
    if (places) setAutocompleteService(new places.AutocompleteService());
    if (geocoding) setGeocodingService(new geocoding.Geocoder());
  }, [places, geocoding]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onValueChange(newValue);

    if (autocompleteService && newValue) {
      setShowPredictions(true);
      setIsFetching(true);
      autocompleteService.getPlacePredictions(
        { input: newValue },
        (newPredictions, status) => {
          setIsFetching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && newPredictions) {
            setPredictions(newPredictions);
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      setShowPredictions(false);
      setPredictions([]);
    }
  };

  const handleSuggestionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    onValueChange(prediction.description);
    setPredictions([]);
    setShowPredictions(false);

    if (geocodingService && prediction.place_id) {
      geocodingService.geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          onLocationSelect({
            address: prediction.description,
            lat: location.lat(),
            lng: location.lng(),
          });
        }
      });
    }
  };
  
  const shouldShowPopover = showPredictions && value.length > 0;

  return (
    <Popover open={shouldShowPopover} onOpenChange={setShowPredictions}>
      <PopoverAnchor asChild>
        <Input
          {...props}
          value={value}
          onChange={handleInputChange}
          onFocus={() => { if (value) setShowPredictions(true); }}
          className={cn(className)}
          autoComplete="off"
        />
      </PopoverAnchor>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" 
        onOpenAutoFocus={(e) => e.preventDefault()}
        align="start"
      >
        <div className="max-h-60 overflow-y-auto">
          {isFetching && (
            <div className="p-3 text-sm text-muted-foreground flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}
          {!isFetching && predictions.length === 0 && value.length > 2 && (
             <div className="p-3 text-sm text-muted-foreground">No results found.</div>
          )}
          {!isFetching && predictions.map((prediction) => (
            <div
              key={prediction.place_id}
              className="p-3 text-sm cursor-pointer hover:bg-accent flex items-center gap-2"
              onClick={() => handleSuggestionClick(prediction)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{prediction.description}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddressAutocompleteInput;
