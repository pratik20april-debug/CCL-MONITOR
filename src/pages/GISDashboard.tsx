import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Sample GeoJSON for Jharkhand boundaries (simplified)
const JHARKHAND_GEOJSON: any = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Jharkhand Boundary" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [83.3, 25.3], [87.9, 25.3], [87.9, 22.0], [83.3, 22.0], [83.3, 25.3]
        ]]
      }
    }
  ]
};
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Progress } from '@/src/components/ui/progress';
import { MapPin, Activity, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getMarkerIcon = (status: string) => {
  let color = '#94a3b8'; // Default slate
  if (status === 'COMPLETED') color = '#22c55e'; // Green
  if (status === 'ONGOING' || status === 'ACTIVE') color = '#eab308'; // Yellow
  if (status === 'DELAYED') color = '#ef4444'; // Red

  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function GISDashboard() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mapCenter, setMapCenter] = React.useState<[number, number]>([23.3441, 85.3096]); // Ranchi center

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'projects'), where('isEliminated', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setProjects(projectsData);
      
      // If there are projects with coordinates, center on the first one
      const withCoords = projectsData.filter(p => p.location?.lat && p.location?.lng);
      if (withCoords.length > 0) {
        setMapCenter([withCoords[0].location.lat, withCoords[0].location.lng]);
      }
      
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, []);

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    ongoing: projects.filter(p => p.status === 'ONGOING' || p.status === 'ACTIVE').length,
    delayed: projects.filter(p => p.status === 'DELAYED').length,
    totalBudget: projects.reduce((acc, p) => acc + (p.mouDetails?.cost || 0), 0)
  };

  if (loading) return <div className="flex justify-center py-12">Loading GIS Dashboard...</div>;

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-black">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Completed</p>
              <p className="text-2xl font-black">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-600">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ongoing</p>
              <p className="text-2xl font-black">{stats.ongoing}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Budget</p>
              <p className="text-lg font-black">₹{(stats.totalBudget / 10000000).toFixed(2)} Cr</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-h-[600px] rounded-[2.5rem] overflow-hidden border-4 border-card shadow-2xl relative z-0">
        <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON 
            data={JHARKHAND_GEOJSON} 
            style={{ color: '#oklch(0.55 0.15 240)', weight: 2, fillOpacity: 0.05 }} 
          />
          <MapUpdater center={mapCenter} />
          {projects.map((project) => {
            if (!project.location?.lat || !project.location?.lng) return null;
            
            return (
              <Marker 
                key={project.id} 
                position={[project.location.lat, project.location.lng]}
                icon={getMarkerIcon(project.status)}
              >
                <Popup className="custom-popup">
                  <div className="p-2 space-y-3 min-w-[200px]">
                    <div className="space-y-1">
                      <h3 className="font-black text-lg tracking-tight leading-none">{project.name}</h3>
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">ID: {project.id.slice(0, 8)}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span>Physical Progress</span>
                        <span>{project.physicalProgress || 0}%</span>
                      </div>
                      <Progress value={project.physicalProgress || 0} className="h-1.5" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span>Financial Progress</span>
                        <span>{project.financialProgress || 0}%</span>
                      </div>
                      <Progress value={project.financialProgress || 0} className="h-1.5 bg-blue-100" />
                    </div>

                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
                      <Badge className={cn(
                        "text-[10px] font-black",
                        project.status === 'COMPLETED' ? "bg-green-500" : 
                        project.status === 'DELAYED' ? "bg-red-500" : "bg-yellow-500"
                      )}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
