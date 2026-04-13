export type UserRole = 'CCL_EMPLOYEE' | 'NGO';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  dob?: string; // For CCL
  uniqueCode?: string; // For CCL
  mobile?: string; // For NGO
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  status: 'INCOMPLETE' | 'ONGOING' | 'DELAYED' | 'COMPLETED' | 'PENDING';
  sections: ProjectSections;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  isEliminated?: boolean;
  eliminatedAt?: number;
  restoredAt?: number;
}

export interface ProjectSections {
  projectName: string;
  applicableSection: string;
  timeline: string;
  costAndScope: string;
  location: string;
  primaryBeneficiaries: string;
  noOfBeneficiaries: number;
  background: string;
  objectives: string;
  baselineAssessment: string;
  implementationPlan: string;
  outcome: string;
  monitoringMechanism: string;
  sustainability: string;
  impactAssessmentPlan: string;
  otherInfo: string;
  benefitsToCompany: string;
}

export interface ProgressReport {
  id: string;
  projectId: string;
  date: number;
  area: string;
  progressText: string;
  impactAssessment: string;
  geotaggedPhotos: string[]; // URLs
  location: {
    lat: number;
    lng: number;
  };
}
