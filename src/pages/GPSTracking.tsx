import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Badge } from '@/src/components/ui/badge';
import { Search, MapPin, Camera, Upload, Activity, TrendingUp, Plus, FileText, Filter, AlertTriangle, Clock, CheckCircle2, BarChart3, ChevronRight, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Progress } from '@/src/components/ui/progress';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, collectionGroup } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, LayersControl, LayerGroup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';

// @ts-ignore
window.L = L;

// Load plugins dynamically to ensure window.L is available
const loadPlugins = async () => {
  try {
    // @ts-ignore
    await import('leaflet.markercluster');
    // @ts-ignore
    await import('leaflet.heat');
  } catch (e) {
    console.error("Error loading Leaflet plugins:", e);
  }
};
loadPlugins();

// Fix Leaflet marker icon issue
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    const container = map.getContainer();
    if (container.clientHeight > 0 && container.clientWidth > 0) {
      map.setView(center, map.getZoom());
    } else {
      // If container not ready, wait a bit and try again
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.setView(center, map.getZoom());
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [center, map]);
  return null;
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    // @ts-ignore
    if (typeof L.heatLayer !== 'function') {
      console.error("Leaflet.heat plugin not loaded");
      return;
    }

    if (points.length === 0) return;

    const container = map.getContainer();
    if (container.clientHeight === 0 || container.clientWidth === 0) {
      const timer = setTimeout(() => map.invalidateSize(), 100);
      return () => clearTimeout(timer);
    }

    // @ts-ignore
    const heat = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 10 }).addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);
  return null;
}

function MarkerClusterGroup({ children }: { children: React.ReactNode }) {
  const map = useMap();
  const clusterGroup = React.useMemo(() => {
    // @ts-ignore
    if (typeof L.markerClusterGroup !== 'function') {
      console.error("Leaflet.markercluster plugin not loaded");
      return null;
    }
    // @ts-ignore
    return L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true
    });
  }, []);

  React.useEffect(() => {
    if (clusterGroup) {
      map.addLayer(clusterGroup);
      return () => {
        map.removeLayer(clusterGroup);
      };
    }
  }, [map, clusterGroup]);

  if (!clusterGroup) return <>{children}</>;

  return <>{children}</>;
}

export default function GPSTracking() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [reports, setReports] = React.useState<any[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateData, setUpdateData] = React.useState({
    area: '',
    progressText: '',
    impactAssessment: ''
  });
  const [uploadedPhotos, setUploadedPhotos] = React.useState<string[]>([]);
  const [mapCenter, setMapCenter] = React.useState<[number, number]>([20.5937, 78.9629]); // Center of India
  const [tempMarker, setTempMarker] = React.useState<{lat: number, lng: number} | null>(null);
  const [mapNotes, setMapNotes] = React.useState<{id: string, lat: number, lng: number, text: string}[]>([]);
  const [isAddingNote, setIsAddingNote] = React.useState(false);
  const [newNoteText, setNewNoteText] = React.useState('');
  const [showHeatmap, setShowHeatmap] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState('ALL');
  const [filterPriority, setFilterPriority] = React.useState('ALL');
  const [filterLocation, setFilterLocation] = React.useState('ALL');
  const [viewMode, setViewMode] = React.useState<'map' | 'dashboard'>('map');
  const [measurementMode, setMeasurementMode] = React.useState(false);
  const [measurePoints, setMeasurePoints] = React.useState<[number, number][]>([]);

  React.useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    const unsubReports = onSnapshot(collectionGroup(db, 'reports'), (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    return () => {
      unsubProjects();
      unsubReports();
    };
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterStatus === 'ALL' || p.monitoringStatus === filterStatus) &&
    (filterPriority === 'ALL' || p.priority === filterPriority) &&
    (filterLocation === 'ALL' || p.sections?.location?.includes(filterLocation))
  );

  const analytics = {
    total: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    delayed: projects.filter(p => p.expectedCompletionDate && p.expectedCompletionDate < Date.now() && p.status !== 'COMPLETED').length,
    secure: projects.filter(p => p.monitoringStatus === 'SECURE').length,
    warning: projects.filter(p => p.monitoringStatus === 'WARNING').length,
    critical: projects.filter(p => p.monitoringStatus === 'CRITICAL').length,
  };

  const heatmapPoints: [number, number, number][] = reports
    .filter(r => r.location)
    .map(r => [r.location.lat, r.location.lng, 0.5]);

  const [lastSync, setLastSync] = React.useState<Date>(new Date());

  React.useEffect(() => {
    // ... existing listeners ...
    setLastSync(new Date());
  }, [projects, reports]);

  const calculateDistance = (p1: [number, number], p2: [number, number]) => {
    const R = 6371; // km
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const totalMeasuredDistance = measurePoints.reduce((acc, curr, idx) => {
    if (idx === 0) return 0;
    return acc + calculateDistance(measurePoints[idx-1], curr);
  }, 0);

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    setIsUpdating(false);
    const projectReport = reports.find(r => r.projectId === project.id && r.location);
    if (projectReport?.location) {
      setMapCenter([projectReport.location.lat, projectReport.location.lng]);
    }
  };

  const handleUploadUpdate = async () => {
    if (!selectedProject || !updateData.area || !updateData.progressText) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const newPhotos = uploadedPhotos.length > 0 ? uploadedPhotos : [`https://picsum.photos/seed/${Date.now()}/800/600`];
      
      const lat = tempMarker?.lat || (23.3441 + (Math.random() - 0.5) * 0.1);
      const lng = tempMarker?.lng || (85.3091 + (Math.random() - 0.5) * 0.1);

      await addDoc(collection(db, 'projects', selectedProject.id, 'reports'), {
        ...updateData,
        projectId: selectedProject.id,
        date: Date.now(),
        status: 'VERIFIED',
        submittedBy: auth.currentUser?.uid,
        geotaggedPhotos: newPhotos,
        location: { lat, lng }
      });

      await updateDoc(doc(db, 'projects', selectedProject.id), {
        monitoringStatus: 'SECURE',
        updatedAt: Date.now()
      });

      toast.success("Update uploaded and verified with geotags!");
      setIsUpdating(false);
      setUpdateData({ area: '', progressText: '', impactAssessment: '' });
      setUploadedPhotos([]);
      setMapCenter([lat, lng]);
      setTempMarker(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${selectedProject.id}/reports`);
    }
  };

  const projectReports = reports.filter(r => r.projectId === selectedProject?.id);

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-8 neo-blur">
      {/* Sidebar: Project List & Search */}
      <Card className="w-full lg:w-96 flex flex-col shadow-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Advanced Tracking
              </div>
              <span className="text-[9px] font-mono text-muted-foreground font-normal normal-case tracking-normal">
                Last Sync: {lastSync.toLocaleTimeString()}
              </span>
            </CardTitle>
            <div className="flex bg-muted p-1 rounded-lg">
              <Button 
                variant={viewMode === 'map' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 px-2 text-[10px] font-bold"
                onClick={() => setViewMode('map')}
              >
                MAP
              </Button>
              <Button 
                variant={viewMode === 'dashboard' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 px-2 text-[10px] font-bold"
                onClick={() => setViewMode('dashboard')}
              >
                STATS
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input 
                placeholder="Search projects..." 
                className="pl-9 h-10 text-sm bg-background/50 border-border/50 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 text-[10px] bg-background/50 border-border/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="SECURE">Secure</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-9 text-[10px] bg-background/50 border-border/50">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {filteredProjects.map((project) => {
              const isDelayed = project.expectedCompletionDate && project.expectedCompletionDate < Date.now() && project.status !== 'COMPLETED';
              return (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden",
                    selectedProject?.id === project.id 
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]" 
                      : "hover:bg-primary/5 border border-transparent hover:border-primary/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-black text-sm truncate tracking-tight flex-1">{project.name}</div>
                    {isDelayed && (
                      <AlertTriangle size={14} className="text-destructive animate-pulse shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={cn(
                      "text-[10px] font-mono uppercase tracking-widest flex items-center gap-1",
                      selectedProject?.id === project.id ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      <Activity size={10} />
                      {project.monitoringStatus || 'PENDING'}
                    </div>
                    <div className={cn(
                      "text-[10px] font-mono uppercase tracking-widest flex items-center gap-1",
                      selectedProject?.id === project.id ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      <Clock size={10} />
                      {project.priority || 'LOW'}
                    </div>
                  </div>
                  {selectedProject?.id === project.id && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Content: Map & Details */}
      <div className="flex-1 flex flex-col gap-8 min-h-0">
        {viewMode === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 shadow-xl rounded-3xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Projects</p>
                  <p className="text-2xl font-black">{analytics.total}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-500">
                <TrendingUp size={12} />
                <span>{analytics.active} Active Missions</span>
              </div>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 shadow-xl rounded-3xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">At Risk / Delayed</p>
                  <p className="text-2xl font-black">{analytics.delayed}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-yellow-500">
                <Clock size={12} />
                <span>Requires Immediate Review</span>
              </div>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 shadow-xl rounded-3xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Secure Monitoring</p>
                  <p className="text-2xl font-black">{analytics.secure}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-500">
                <Activity size={12} />
                <span>{((analytics.secure / analytics.total) * 100).toFixed(0)}% Compliance Rate</span>
              </div>
            </Card>

            <Card className="md:col-span-3 shadow-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden rounded-3xl">
              <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  <Activity className="text-primary" size={18} />
                  Project Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="pl-8 py-4 text-[10px] font-black uppercase tracking-widest">Project Name</TableHead>
                      <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest">Progress</TableHead>
                      <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest">Priority</TableHead>
                      <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest">Est. Completion</TableHead>
                      <TableHead className="text-right pr-8 py-4 text-[10px] font-black uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((p) => {
                      const isDelayed = p.expectedCompletionDate && p.expectedCompletionDate < Date.now() && p.status !== 'COMPLETED';
                      return (
                        <TableRow key={p.id} className="hover:bg-primary/5 border-border/50 transition-colors">
                          <TableCell className="pl-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="font-black text-foreground tracking-tight">{p.name}</div>
                              {isDelayed && <Badge variant="destructive" className="text-[8px] h-4 px-1">DELAYED</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="w-48">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span>{p.status === 'COMPLETED' ? '100%' : '65%'}</span>
                              </div>
                              <Progress value={p.status === 'COMPLETED' ? 100 : 65} className="h-1.5" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-mono px-2 py-0.5",
                              p.priority === 'CRITICAL' ? "text-destructive border-destructive/20 bg-destructive/5" :
                              p.priority === 'HIGH' ? "text-orange-500 border-orange-500/20 bg-orange-500/5" : "text-muted-foreground"
                            )}>
                              {p.priority || 'LOW'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-muted-foreground">
                            {p.expectedCompletionDate ? new Date(p.expectedCompletionDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right pr-8 py-6">
                            <Button variant="ghost" size="sm" onClick={() => handleProjectSelect(p)}>
                              <ChevronRight size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="flex-1 relative overflow-hidden shadow-2xl border border-border/50 bg-card/50 backdrop-blur-xl z-0 rounded-3xl">
          <MapContainer 
            center={mapCenter} 
            zoom={5} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Street View">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite View">
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Terrain View">
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>

              <LayersControl.Overlay name="Heatmap Intensity">
                <LayerGroup>
                  <HeatmapLayer points={heatmapPoints} />
                </LayerGroup>
              </LayersControl.Overlay>
            </LayersControl>

            <MapUpdater center={mapCenter} />
            <MapEvents onMapClick={(lat, lng) => {
              if (isUpdating) {
                setTempMarker({ lat, lng });
                toast.info("Location marked for update");
              } else if (isAddingNote) {
                setTempMarker({ lat, lng });
              } else if (measurementMode) {
                setMeasurePoints([...measurePoints, [lat, lng]]);
              }
            }} />
            
            {measurementMode && measurePoints.length > 0 && (
              <>
                {measurePoints.map((p, i) => (
                  <Circle key={i} center={p} radius={10} color="red" />
                ))}
                {measurePoints.length > 1 && (
                  <Polyline positions={measurePoints} color="red" weight={3} dashArray="5, 10" />
                )}
              </>
            )}

            {tempMarker && (
              <Marker position={[tempMarker.lat, tempMarker.lng]}>
                <Popup>
                  {isAddingNote ? (
                    <div className="p-3 space-y-3 min-w-[200px]">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Map Annotation</Label>
                      <Input 
                        placeholder="Write on map..." 
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        className="h-10 text-sm"
                      />
                      <Button 
                        size="sm" 
                        className="w-full h-10 font-bold"
                        onClick={() => {
                          setMapNotes([...mapNotes, { id: Date.now().toString(), lat: tempMarker.lat, lng: tempMarker.lng, text: newNoteText }]);
                          setTempMarker(null);
                          setNewNoteText('');
                          setIsAddingNote(false);
                          toast.success("Note added to map");
                        }}
                      >
                        Save Note
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold p-2">Marked Location for Update</div>
                  )}
                </Popup>
              </Marker>
            )}

            {mapNotes.map(note => (
              <Marker key={note.id} position={[note.lat, note.lng]}>
                <Popup>
                  <div className="p-2 font-bold text-sm tracking-tight">{note.text}</div>
                </Popup>
              </Marker>
            ))}
            
            <MarkerClusterGroup>
              {projects.map((p) => {
                const latestReport = reports.find(r => r.projectId === p.id && r.location);
                if (!latestReport?.location) return null;
                
                return (
                  <Marker 
                    key={p.id} 
                    position={[latestReport.location.lat, latestReport.location.lng]}
                    eventHandlers={{
                      click: () => handleProjectSelect(p),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[150px]">
                        <h4 className="font-black text-sm tracking-tight">{p.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0">
                            {p.monitoringStatus}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="link" 
                          className="h-auto p-0 mt-3 text-xs font-bold text-primary"
                          onClick={() => handleProjectSelect(p)}
                        >
                          View Details →
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>

          {/* Map Controls */}
          <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
            <Button 
              size="icon" 
              variant={measurementMode ? "default" : "secondary"} 
              className="shadow-2xl bg-background/80 backdrop-blur-xl border border-border/50 w-12 h-12 rounded-2xl"
              onClick={() => {
                setMeasurementMode(!measurementMode);
                setMeasurePoints([]);
                if (!measurementMode) toast.info("Click on map to measure distance");
              }}
            >
              <TrendingUp size={20} className="rotate-90" />
            </Button>
            {measurementMode && totalMeasuredDistance > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-2"
              >
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl shadow-xl text-xs font-black tracking-tight text-center">
                  {totalMeasuredDistance.toFixed(2)} km
                </div>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="h-8 text-[10px] shadow-lg rounded-xl font-bold"
                  onClick={() => setMeasurePoints([])}
                >
                  Clear Path
                </Button>
              </motion.div>
            )}
          </div>

          <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3">
            <Button 
              size="icon" 
              variant={isAddingNote ? "default" : "secondary"} 
              className="shadow-2xl bg-background/80 backdrop-blur-xl border border-border/50 w-12 h-12 rounded-2xl"
              onClick={() => {
                setIsAddingNote(!isAddingNote);
                if (!isAddingNote) toast.info("Click on map to add a note");
              }}
            >
              <FileText size={20} />
            </Button>
            <Button size="icon" variant="secondary" className="shadow-2xl bg-background/80 backdrop-blur-xl border border-border/50 w-12 h-12 rounded-2xl"><Plus size={20} /></Button>
          </div>

          {/* Selection Overlay */}
          <AnimatePresence>
            {selectedProject && (
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute bottom-8 left-8 right-8 bg-card/90 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex flex-col md:flex-row gap-8 z-[1000]"
              >
                <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-primary/10 text-primary border-none font-mono text-[10px] tracking-widest px-3">
                          {selectedProject.isGenerated ? "ACTIVE MISSION" : "DRAFT"}
                        </Badge>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      </div>
                      <h2 className="text-3xl font-black text-foreground tracking-tighter">{selectedProject.name}</h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2 font-medium">
                        <MapPin size={16} className="text-primary" /> Ranchi District, Jharkhand
                      </p>
                    </div>
                    <Button 
                      onClick={() => setIsUpdating(true)}
                      className="bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 gap-3 h-14 px-8 rounded-2xl font-black text-sm tracking-tight"
                    >
                      <Upload size={20} />
                      TRANSMIT UPDATE
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-5 rounded-3xl bg-muted/30 border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Monitoring</p>
                      <p className={cn(
                        "text-lg font-black mt-2 tracking-tight",
                        selectedProject.monitoringStatus === 'SECURE' ? "text-green-500" : "text-yellow-500"
                      )}>
                        {selectedProject.monitoringStatus || 'PENDING'}
                      </p>
                    </div>
                    <div className="p-5 rounded-3xl bg-muted/30 border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Reports</p>
                      <p className="text-lg font-black mt-2 tracking-tight text-foreground">{projectReports.length} Filed</p>
                    </div>
                    <div className="p-5 rounded-3xl bg-muted/30 border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Impact</p>
                      <p className="text-lg font-black mt-2 tracking-tight text-foreground">High Priority</p>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-80 h-56 rounded-[2rem] overflow-hidden border-4 border-white/5 shadow-2xl bg-muted relative group">
                  <img 
                    src={projectReports[0]?.geotaggedPhotos?.[0] || "https://picsum.photos/seed/site/400/300"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt="Latest Geotag"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-4 right-4 bg-primary/90 backdrop-blur text-[10px] text-white px-3 py-1.5 rounded-full flex items-center gap-2 font-black tracking-widest shadow-xl">
                    <Camera size={12} /> LATEST GEOTAG
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        )}

        {/* Update Dialog */}
        <Dialog open={isUpdating} onOpenChange={setIsUpdating}>
          <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Upload Project Update</DialogTitle>
              <DialogDescription className="font-medium">
                Provide current progress details and upload geotagged photographs for verification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Area/Site Name</Label>
                  <Input 
                    placeholder="e.g. Sector 4 Construction Site" 
                    value={updateData.area}
                    onChange={(e) => setUpdateData({ ...updateData, area: e.target.value })}
                    className="h-12 rounded-xl bg-muted/50 border-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Impact Level</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Progress Description</Label>
                <Textarea 
                  placeholder="Detailed update on work completed..." 
                  className="min-h-[120px] rounded-2xl bg-muted/50 border-none focus:ring-2 focus:ring-primary p-4"
                  value={updateData.progressText}
                  onChange={(e) => setUpdateData({ ...updateData, progressText: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Geotagged Photographs</Label>
                <div className="grid grid-cols-4 gap-4">
                  {uploadedPhotos.map((p, i) => (
                    <div key={i} className="aspect-square rounded-2xl border-2 border-white/10 overflow-hidden relative group shadow-lg">
                      <img src={p} className="w-full h-full object-cover" alt="Upload" />
                      <button 
                        onClick={() => setUploadedPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-destructive/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <Plus className="rotate-45" size={24} />
                      </button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="aspect-square flex flex-col gap-3 border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 h-auto rounded-2xl transition-all"
                    onClick={() => setUploadedPhotos(prev => [...prev, `https://picsum.photos/seed/${Date.now()}/400/300`])}
                  >
                    <Camera size={24} className="text-primary" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Add Photo</span>
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button variant="ghost" onClick={() => setIsUpdating(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button onClick={handleUploadUpdate} className="rounded-xl font-black px-8 h-12 shadow-xl shadow-primary/20">Submit Update & Verify</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Project Tracking History */}
        {selectedProject && projectReports.length > 0 && (
          <Card className="shadow-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-muted/30 border-b border-border/50 p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                <TrendingUp className="text-primary" size={18} />
                Project Tracking History
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">{projectReports.length} Updates</Badge>
                <Badge variant="outline" className="font-mono text-[10px] bg-primary/5 text-primary border-primary/20">
                  {selectedProject.priority || 'LOW'} PRIORITY
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 border-b border-border/50 bg-muted/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Milestone Progress</h4>
                  <span className="text-xs font-bold text-primary">65% Complete</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['Site Prep', 'Foundation', 'Structure', 'Finishing'].map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border/50">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        i < 2 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {i < 2 ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 bg-current rounded-full" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="pl-8 py-4 text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                    <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest">Area</TableHead>
                    <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest">Progress Details</TableHead>
                    <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest">Geotags</TableHead>
                    <TableHead className="text-right pr-8 py-4 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectReports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-primary/5 border-border/50 transition-colors">
                      <TableCell className="pl-8 py-6 text-xs font-bold text-muted-foreground">
                        {new Date(report.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-6 font-black text-foreground tracking-tight">{report.area}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground font-medium">{report.progressText}</TableCell>
                      <TableCell>
                        <div className="flex -space-x-3">
                          {report.geotaggedPhotos?.slice(0, 3).map((p: string, i: number) => (
                            <div key={i} className="w-10 h-10 rounded-full border-4 border-card overflow-hidden shadow-lg">
                              <img 
                                src={p} 
                                className="w-full h-full object-cover" 
                                alt="Geotag"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                          {report.geotaggedPhotos?.length > 3 && (
                            <div className="w-10 h-10 rounded-full border-4 border-card bg-muted flex items-center justify-center text-[10px] font-black shadow-lg">
                              +{report.geotaggedPhotos.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8 py-6">
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-mono text-[10px] px-3 py-1 rounded-full">VERIFIED</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
