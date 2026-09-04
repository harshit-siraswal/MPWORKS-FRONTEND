import { readLegacyPage } from '../legacy-page-data';
import LegacyPage from '../legacy-page';

export default function MpPage() {
  return <LegacyPage {...readLegacyPage('mp.html')} entry="mp" />;
}
