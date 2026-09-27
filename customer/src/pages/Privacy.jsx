import LegacyPage from '../components/LegacyPage';
import html from './fragments/privacy.body.html?raw';

export default function Privacy() {
  return <LegacyPage html={html} cssHref="/css/privacy.css" jsSrc="/js/privacy.js" />;
}
