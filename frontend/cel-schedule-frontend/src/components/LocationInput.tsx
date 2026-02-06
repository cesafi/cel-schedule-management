import React, { useState, useCallback, useRef } from 'react';
import { Form, Input, Card, Alert } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { EventLocation } from '../types';

interface LocationInputProps {
  value?: EventLocation;
  onChange?: (location: EventLocation | undefined) => void;
  disabled?: boolean;
}

const libraries: ("places")[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 14.5995, // Philippines center
  lng: 120.9842,
};

export const LocationInput: React.FC<LocationInputProps> = ({ value, onChange, disabled }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries,
  });

  const [mapCenter, setMapCenter] = useState(value ? { lat: value.lat, lng: value.lng } : defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(value ? { lat: value.lat, lng: value.lng } : null);
  const [inputValue, setInputValue] = useState(value?.address || '');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Update input value when external value changes
  React.useEffect(() => {
    if (value?.address) {
      setInputValue(value.address);
    }
  }, [value?.address]);

  const onPlaceSelected = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || '';
        const placeId = place.place_id;

        const location: EventLocation = {
          address,
          lat,
          lng,
          placeId,
        };

        setInputValue(address);
        setMapCenter({ lat, lng });
        setMarkerPosition({ lat, lng });
        onChange?.(location);
      }
    }
  }, [onChange]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (disabled || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // Reverse geocode to get address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location: EventLocation = {
          address: results[0].formatted_address,
          lat,
          lng,
          placeId: results[0].place_id,
        };

        setInputValue(results[0].formatted_address);
        setMarkerPosition({ lat, lng });
        onChange?.(location);
      } else {
        // Fallback if geocoding fails
        const location: EventLocation = {
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng,
        };

        setInputValue(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setMarkerPosition({ lat, lng });
        onChange?.(location);
      }
    });
  }, [disabled, onChange]);

  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (disabled || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // Reverse geocode to get address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location: EventLocation = {
          address: results[0].formatted_address,
          lat,
          lng,
          placeId: results[0].place_id,
        };

        setInputValue(results[0].formatted_address);
        setMarkerPosition({ lat, lng });
        onChange?.(location);
      }
    });
  }, [disabled, onChange]);

  if (loadError) {
    return <Alert message="Error loading Google Maps" type="error" showIcon />;
  }

  if (!apiKey) {
    return (
      <Alert
        message="Google Maps API Key Required"
        description="Please set VITE_GOOGLE_MAPS_API_KEY in your .env file"
        type="warning"
        showIcon
      />
    );
  }

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <div>
      <Form.Item label="Search Location" style={{ marginBottom: 16 }}>
        <Autocomplete
          onLoad={(autocomplete) => {
            autocompleteRef.current = autocomplete;
          }}
          onPlaceChanged={onPlaceSelected}
        >
          <Input
            prefix={<EnvironmentOutlined />}
            placeholder="Search for a location..."
            disabled={disabled}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </Autocomplete>
      </Form.Item>

      {value?.address && (
        <div style={{ marginBottom: 8, color: '#666' }}>
          <small>Selected: {value.address}</small>
        </div>
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={markerPosition ? 15 : 11}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={!disabled}
              onDragEnd={onMarkerDragEnd}
            />
          )}
        </GoogleMap>
      </Card>

      <small style={{ color: '#999' }}>
        Click on the map or drag the marker to set a precise location
      </small>
    </div>
  );
};
