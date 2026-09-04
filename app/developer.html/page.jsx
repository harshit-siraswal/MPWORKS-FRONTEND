import { readLegacyPage } from '../legacy-page-data';
import LegacyPage from '../legacy-page';

export default function DeveloperPage() {
  return <LegacyPage {...readLegacyPage('developer.html')} entry="developer" />;
}
