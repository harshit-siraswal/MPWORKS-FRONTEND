import { readLegacyPage } from '../legacy-page-data';
import LegacyPage from '../legacy-page';

export default function ProjectPage() {
  return <LegacyPage {...readLegacyPage('project.html')} entry="project" />;
}
