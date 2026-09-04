import { readLegacyPage } from '../legacy-page-data';
import LegacyPage from '../legacy-page';

export default function DistrictPage() {
  return <LegacyPage {...readLegacyPage('district.html')} entry="district" />;
}
