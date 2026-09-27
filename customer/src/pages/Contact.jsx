import LegacyPage from '../components/LegacyPage';
import html from './fragments/contact.body.html?raw';

export default function Contact() {
  return <LegacyPage html={html} cssHref="/css/contact.css" jsSrc="/js/contact.js" />;
}
