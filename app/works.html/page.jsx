import { readLegacyPage } from '../legacy-page-data';
import LegacyPage from '../legacy-page';

export default function WorksPage() {
  return <LegacyPage {...readLegacyPage('works.html')} entry="works" />;
}
