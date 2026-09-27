import LegacyPage from '../components/LegacyPage';
import html from './fragments/services.body.html?raw';

export default function Services() {
  return <LegacyPage html={html} cssHref="/css/services.css" jsSrc="/js/services.js" />;
}
