import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Donation {
  id: string;
  food_type: string;
  quantity: string;
  location: string;
  description: string | null;
}

interface DonationMapProps {
  donations: Donation[];
}

// Simple geocoding cache for Kenya locations
const locationCoordinates: Record<string, [number, number]> = {
  'nairobi': [-1.2921, 36.8219],
  'mombasa': [-4.0435, 39.6682],
  'kisumu': [-0.0917, 34.7680],
  'nakuru': [-0.3031, 36.0800],
  'eldoret': [0.5143, 35.2698],
  'karen': [-1.3199, 36.7076],
  'westlands': [-1.2676, 36.8108],
  'kiambu': [-1.1714, 36.8356],
  'thika': [-1.0332, 37.0694],
  'machakos': [-1.5177, 37.2634],
};

const getCoordinates = (location: string): [number, number] => {
  const normalizedLocation = location.toLowerCase().trim();
  
  if (locationCoordinates[normalizedLocation]) {
    return locationCoordinates[normalizedLocation];
  }
  
  for (const [city, coords] of Object.entries(locationCoordinates)) {
    if (normalizedLocation.includes(city)) {
      return coords;
    }
  }
  
  return locationCoordinates['nairobi'];
};

const DonationMap = ({ donations }: DonationMapProps) => {
  const [mappedDonations, setMappedDonations] = useState<Array<Donation & { coords: [number, number] }>>([]);

  useEffect(() => {
    const donationsWithCoords = donations.map(donation => ({
      ...donation,
      coords: getCoordinates(donation.location)
    }));
    
    setMappedDonations(donationsWithCoords);
  }, [donations]);

  const position: [number, number] = [-1.2921, 36.8219];

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer 
        // @ts-ignore
        center={position} 
        zoom={7} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {mappedDonations.map((donation) => (
          <Marker key={donation.id} position={donation.coords}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{donation.food_type}</h3>
                <p className="text-sm"><strong>Quantity:</strong> {donation.quantity}</p>
                <p className="text-sm"><strong>Location:</strong> {donation.location}</p>
                {donation.description && (
                  <p className="text-sm mt-2">{donation.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DonationMap;
