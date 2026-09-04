import { readLegacyPage } from './legacy-page-data';
import LegacyPage from './legacy-page';

export default function HomePage() {
  return <LegacyPage {...readLegacyPage('index.html')} entry="main" />;
}
