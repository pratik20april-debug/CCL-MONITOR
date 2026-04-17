import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, Polygon, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';

import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, where, doc, updateDoc, getDocs, addDoc } from 'firebase/firestore';
import { Progress } from '@/src/components/ui/progress';
import { MapPin, Activity, DollarSign, Search, Edit3, Save, Trash2, Camera, Eye, X, Upload } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { toast } from 'sonner';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';

// Fix for default marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getMarkerIcon = (status: string) => {
  let color = '#94a3b8';
  if (status === 'COMPLETED') color = '#22c55e';
  if (status === 'ONGOING' || status === 'ACTIVE') color = '#eab308';
  if (status === 'DELAYED') color = '#ef4444';

  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

function MapUpdater({ center, zoom }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, map, zoom]);
  return null;
}

// Drawing Control Component
function DrawControl({ 
  onPolygonComplete, 
  onMarkerComplete 
}: { 
  onPolygonComplete: (coords: [number, number][]) => void,
  onMarkerComplete: (lat: number, lng: number) => void
}) {
  const map = useMap();
  const featureGroupRef = React.useRef<L.FeatureGroup>(new L.FeatureGroup());

  React.useEffect(() => {
    map.addLayer(featureGroupRef.current);

    const drawControl = new (L as any).Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          drawError: { border: '#e1e1e1', message: 'No intersections allowed' },
          shapeOptions: { color: 'var(--primary)', fillOpacity: 0.2 }
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: true,
        circlemarker: false,
      },
      edit: {
        featureGroup: featureGroupRef.current,
        remove: true
      }
    });

    map.addControl(drawControl);

    const onDrawCreated = (e: any) => {
      const { layerType, layer } = e;
      featureGroupRef.current.addLayer(layer);
      
      if (layerType === 'polygon') {
        const latlngs = layer.getLatLngs()[0];
        const coords = latlngs.map((ll: any) => [ll.lat, ll.lng]);
        onPolygonComplete(coords);
      } else if (layerType === 'marker') {
        const { lat, lng } = layer.getLatLng();
        onMarkerComplete(lat, lng);
      }
    };

    map.on((L as any).Draw.Event.CREATED, onDrawCreated);

    return () => {
      map.off((L as any).Draw.Event.CREATED, onDrawCreated);
      map.removeControl(drawControl);
    };
  }, [map, onPolygonComplete, onMarkerComplete]);

  return null;
}

export default function GISDashboard() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mapCenter, setMapCenter] = React.useState<[number, number]>([20.5937, 78.9629]); // India center
  const [zoom, setZoom] = React.useState(5);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedProject, setSelectedProject] = React.useState<any>(null);
  const [budgetData, setBudgetData] = React.useState<any>(null);
  const [reports, setReports] = React.useState<any[]>([]);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedNotes, setEditedNotes] = React.useState('');
  const [editedProgress, setEditedProgress] = React.useState('0');
  const [editedStatus, setEditedStatus] = React.useState('ACTIVE');

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'projects'), where('isEliminated', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, []);

  const fetchProjectDetails = async (project: any) => {
    try {
      // Fetch budget
      const budgetQ = query(collection(db, 'budget_tracking'), where('projectId', '==', project.id));
      const budgetSnap = await getDocs(budgetQ);
      const bData = budgetSnap.docs.length > 0 ? budgetSnap.docs[0].data() : null;
      setBudgetData(bData);

      // Fetch reports (for geotaggs)
      const reportsQ = query(collection(db, `projects/${project.id}/reports`));
      const reportsSnap = await getDocs(reportsQ);
      const rData = reportsSnap.docs.map(d => d.data());
      setReports(rData);

      setSelectedProject(project);
      setEditedNotes(project.description || '');
      setEditedProgress((project.physicalProgress || 0).toString());
      setEditedStatus(project.status || 'ACTIVE');
      
      if (project.location?.lat && project.location?.lng) {
        setMapCenter([project.location.lat, project.location.lng]);
        setZoom(12);
      }
    } catch (error) {
      toast.error("Error fetching detailed insights");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const queryStr = searchQuery.toLowerCase();
    const found = projects.find(p => 
      p.name.toLowerCase().includes(queryStr) || 
      p.location?.address?.toLowerCase().includes(queryStr)
    );

    if (found) {
      fetchProjectDetails(found);
      toast.success(`Accessing record: ${found.name}`);
    } else {
      toast.error("Project identity not found in operational areas");
    }
  };

  const saveBoundary = async (coords: [number, number][]) => {
    if (!selectedProject) {
      toast.error("Please select a project before marking boundaries");
      return;
    }

    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        boundary: coords,
        updatedAt: Date.now()
      });
      toast.success("Project operational boundary marked and saved");
      setSelectedProject({ ...selectedProject, boundary: coords });
    } catch (error) {
      toast.error("Failed to commit boundary to system");
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedProject) return;
    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        description: editedNotes,
        physicalProgress: parseInt(editedProgress),
        status: editedStatus,
        updatedAt: Date.now()
      });
      setIsEditing(false);
      setSelectedProject({ 
        ...selectedProject, 
        description: editedNotes,
        physicalProgress: parseInt(editedProgress),
        status: editedStatus
      });
      toast.success("Project intelligence updated successfully");
    } catch (error) {
      toast.error("Critical error while saving field data");
    }
  };

  const markProjectLocation = async (lat: number, lng: number) => {
    if (!selectedProject) {
      toast.error("Search or select a project before marking its core coordinates");
      return;
    }
    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        location: { ...selectedProject.location, lat, lng },
        updatedAt: Date.now()
      });
      setSelectedProject({ ...selectedProject, location: { ...selectedProject.location, lat, lng } });
      toast.success("Core project coordinate marked and locked");
    } catch (error) {
      toast.error("Failed to mark location");
    }
  };

  const handleGeotagUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const mockUrl = `https://picsum.photos/seed/${Math.random()}/800/600`;
    
    try {
      await addDoc(collection(db, `projects/${selectedProject.id}/reports`), {
        projectId: selectedProject.id,
        date: Date.now(),
        geotaggedPhotos: [mockUrl],
        progressText: "Instant Geotag Submission via Project Overview",
        status: "VERIFIED",
        submittedBy: auth.currentUser?.email || 'System'
      });
      
      setReports(prev => [...prev, { geotaggedPhotos: [mockUrl] }]);
      toast.success("Field evidence uploaded and synced");
    } catch (error) {
      toast.error("Upload synchronization failed");
    }
  };

  if (loading) return <div className="flex justify-center py-24 font-black tracking-widest animate-pulse">SYNCHRONIZING GIS DATA...</div>;

  return (
    <div className="flex h-[calc(100vh-160px)] gap-6 relative overflow-hidden p-2">
      {/* Sidebar Panel */}
      <AnimatePresence mode="wait">
        {selectedProject ? (
          <motion.div 
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="w-[450px] flex flex-col gap-6 z-10"
          >
            <Card className="flex-1 border-none shadow-2xl bg-card/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden flex flex-col relative group">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-6 right-6 z-20 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
                onClick={() => setSelectedProject(null)}
              >
                <X size={18} />
              </Button>

              <div className="h-48 bg-primary relative overflow-hidden p-8 flex flex-col justify-end">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="relative z-10 space-y-2">
                  <Badge className="bg-white/20 text-white border-none px-3 font-black text-[10px] uppercase tracking-widest">{selectedProject.sector}</Badge>
                  <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{selectedProject.name}</h3>
                </div>
              </div>

              <ScrollArea className="flex-1 p-8">
                <div className="space-y-8">
                  {/* Financial Quick Look */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Allocated fund</p>
                      <p className="text-xl font-black">₹{budgetData?.allocatedFund?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div className="bg-orange-500/5 p-4 rounded-3xl border border-orange-500/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 mb-1">Expenditure</p>
                      <p className="text-xl font-black">₹{budgetData?.expenditure?.toLocaleString() || '0'}</p>
                    </div>
                  </div>

                  {/* Status Progress */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span>Work Completion</span>
                        <span>{selectedProject.physicalProgress || 0}%</span>
                      </div>
                      <Progress value={selectedProject.physicalProgress || 0} className="h-2 rounded-full" />
                    </div>
                  </div>

                  {/* MOU & Status Section */}
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">MOU & Contract Intel</h4>
                    <div className="grid grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                        <p className="text-sm font-black">{selectedProject.mouDetails?.duration || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">FY</p>
                        <p className="text-sm font-black">{selectedProject.mouDetails?.financialYear || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Commencement</p>
                        <p className="text-sm font-black">{selectedProject.mouDetails?.dateOfCommencement ? new Date(selectedProject.mouDetails.dateOfCommencement).toLocaleDateString() : 'Pending'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Current Status</p>
                        <Badge className="text-[10px] font-black">{selectedProject.status}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Operational Intel */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Activity size={16} /> Operational Notes
                      </h4>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? <Save className="text-green-600" size={16} onClick={handleSaveDetails} /> : <Edit3 size={16} />}
                      </Button>
                    </div>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Status</Label>
                           <Select value={editedStatus} onValueChange={setEditedStatus}>
                             <SelectTrigger className="bg-white border-slate-200 h-10 rounded-xl">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                               <SelectItem value="ONGOING">ONGOING</SelectItem>
                               <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                               <SelectItem value="DELAYED">DELAYED</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Physical Progress (%)</Label>
                           <Input 
                              type="number" 
                              value={editedProgress} 
                              onChange={(e) => setEditedProgress(e.target.value)}
                              className="bg-white border-slate-200 h-10 rounded-xl"
                           />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes / Recon</Label>
                          <textarea 
                            className="w-full h-32 bg-white rounded-2xl p-4 text-sm font-medium border-2 border-primary/20 focus:outline-none"
                            value={editedNotes}
                            onChange={(e) => setEditedNotes(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-medium leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-2xl italic">
                        {selectedProject.description || "Operational reconnaissance pending. Mark boundary or update status to begin tracking."}
                      </p>
                    )}
                  </div>

                  {/* Geotagged Intelligence */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Camera size={16} /> Geotagged Field Evidence
                      </h4>
                      <div className="relative">
                        <input 
                          type="file" 
                          id="geotag-upload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleGeotagUpload}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                          onClick={() => document.getElementById('geotag-upload')?.click()}
                        >
                          <Upload size={16} />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {reports.filter(r => r.geotaggedPhotos?.length > 0).map((r, i) => (
                        r.geotaggedPhotos.map((url: string, j: number) => (
                          <div key={`${i}-${j}`} className="aspect-square rounded-2xl overflow-hidden group/img relative">
                            <img src={url} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                                <Eye size={16} />
                              </Button>
                            </div>
                          </div>
                        ))
                      ))}
                      {reports.length === 0 && <div className="col-span-2 py-8 text-center bg-slate-50 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-400">No field submissions found</div>}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-6 border-t border-border/10">
                <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-tight gap-2 shadow-lg shadow-primary/20">
                  <Save size={18} /> COMMIT ALL INTELLIGENCE
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-96 flex flex-col gap-6"
          >
            <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] p-8 space-y-8">
              <div className="space-y-2 text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} />
                </div>
                <h3 className="text-2xl font-black tracking-tighter uppercase">Project Census</h3>
                <p className="text-xs font-medium text-muted-foreground">Identify and manage projects across operational zones</p>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Input 
                    placeholder="Input Project Identity..." 
                    className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-2xl font-black uppercase tracking-tight gap-2">
                  <Search size={18} /> EXECUTE SEARCH
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Active Nodes</span>
                <span className="text-foreground">{projects.length}</span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Explorer */}
      <div className="flex-1 rounded-[3rem] overflow-hidden border-4 border-card shadow-inner relative group isolate">
        <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} zoom={zoom} />
          
          <FeatureGroup>
            <DrawControl 
              onPolygonComplete={saveBoundary} 
              onMarkerComplete={markProjectLocation}
            />
          </FeatureGroup>

          {projects.map((project) => {
            if (!project.location?.lat || !project.location?.lng) return null;
            return (
              <React.Fragment key={project.id}>
                <Marker 
                  position={[project.location.lat, project.location.lng]}
                  icon={getMarkerIcon(project.status)}
                  eventHandlers={{
                    click: () => fetchProjectDetails(project)
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 font-black uppercase tracking-tighter">{project.name}</div>
                  </Popup>
                </Marker>
                {project.boundary && (
                  <Polygon 
                    positions={project.boundary} 
                    pathOptions={{ 
                      color: project.id === selectedProject?.id ? 'var(--primary)' : '#94a3b8',
                      fillOpacity: 0.2,
                      weight: project.id === selectedProject?.id ? 4 : 2
                    }} 
                  >
                    <Popup>{project.name} Operational Boundary</Popup>
                  </Polygon>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2">
          <Badge className="bg-white text-black border-none px-4 py-2 font-black text-[12px] shadow-2xl backdrop-blur-md rounded-full">
            GIS SCALE: INDIA {zoom >= 10 ? 'ZONE DETAIL' : 'COUNTRY VIEW'}
          </Badge>
          <div className="bg-white/80 p-4 rounded-3xl shadow-xl backdrop-blur-xl border border-white/40 space-y-2">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-[10px] font-black uppercase">Active / Ongoing</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-[10px] font-black uppercase">Completed</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[10px] font-black uppercase">Delayed</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
