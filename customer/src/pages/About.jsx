import LegacyPage from '../components/LegacyPage';
import html from './fragments/about.body.html?raw';

export default function About() {
  return <LegacyPage html={html} cssHref="/css/about.css" jsSrc="/js/about.js" />;
}
