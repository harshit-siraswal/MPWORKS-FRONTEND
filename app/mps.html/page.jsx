import { readLegacyPage } from '../legacy-page-data';
import LegacyPage from '../legacy-page';

export default function MpsPage() {
  return <LegacyPage {...readLegacyPage('mps.html')} entry="mps" />;
}
