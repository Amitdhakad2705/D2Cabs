import LegacyPage from '../components/LegacyPage';
import html from './fragments/index.body.html?raw';

export default function Home() {
  return <LegacyPage html={html} cssHref="/css/index.css" jsSrc="/js/index.js" />;
}
