import LegacyPage from '../components/LegacyPage';
import html from './fragments/faq.body.html?raw';

export default function Faq() {
  return <LegacyPage html={html} cssHref="/css/faq.css" jsSrc="/js/faq.js" />;
}
