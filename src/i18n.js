const LANGUAGE_KEY = 'mpworks-language';

const translations = {
  'Government of India': 'भारत सरकार',
  'Public data explorer for MPLADS': 'एमपीएलएडीएस के लिए सार्वजनिक डेटा एक्सप्लोरर',
  'Dashboard': 'डैशबोर्ड',
  'Recommended works': 'अनुशंसित कार्य',
  'Completed works': 'पूर्ण कार्य',
  'MP profiles': 'सांसद प्रोफ़ाइल',
  'Developer API': 'डेवलपर API',
  'Methodology': 'कार्यप्रणाली',
  'Official eSAKSHI ↗': 'आधिकारिक eSAKSHI ↗',
  'MPLADS public register': 'एमपीएलएडीएस सार्वजनिक रजिस्टर',
  'Public works register': 'सार्वजनिक कार्य रजिस्टर',
  'Find a work record': 'कार्य रिकॉर्ड खोजें',
  'Search and filter': 'खोजें और फ़िल्टर करें',
  'Search and filter this register': 'इस रजिस्टर में खोजें और फ़िल्टर करें',
  'Clear all': 'सब हटाएँ',
  'House of Parliament': 'संसद का सदन',
  'Parliamentary term': 'संसदीय कार्यकाल',
  'State / Union Territory': 'राज्य / केंद्र शासित प्रदेश',
  'All States / UTs': 'सभी राज्य / केंद्र शासित प्रदेश',
  'All districts': 'सभी ज़िले',
  'All houses': 'सभी सदन',
  'All terms': 'सभी कार्यकाल',
  'All constituencies': 'सभी निर्वाचन क्षेत्र',
  'All categories': 'सभी श्रेणियाँ',
  'All work statuses': 'सभी कार्य स्थितियाँ',
  'District': 'ज़िला',
  'Constituency': 'निर्वाचन क्षेत्र',
  'Work category': 'कार्य श्रेणी',
  'Work status': 'कार्य स्थिति',
  'Search MP, work, village or location': 'सांसद, कार्य, गाँव या स्थान खोजें',
  'Search work, village, MP or constituency': 'कार्य, गाँव, सांसद या निर्वाचन क्षेत्र खोजें',
  'Search projects': 'कार्य खोजें',
  'Recommended works': 'अनुशंसित कार्य',
  'Completed works': 'पूर्ण कार्य',
  'MP profiles': 'सांसद प्रोफ़ाइल',
  'Source records': 'स्रोत रिकॉर्ड',
  'Work records': 'कार्य रिकॉर्ड',
  'Location view': 'स्थान दृश्य',
  'District map': 'ज़िला मानचित्र',
  'Selected scope totals': 'चयनित क्षेत्र का कुल विवरण',
  'Official dashboard fields': 'आधिकारिक डैशबोर्ड फ़ील्ड',
  'Allocated limit': 'आवंटित सीमा',
  'Amount used': 'उपयोग की गई राशि',
  'Works recommended': 'अनुशंसित कार्य',
  'Works sanctioned': 'स्वीकृत कार्य',
  'Works ongoing': 'चल रहे कार्य',
  'Works completed': 'पूर्ण कार्य',
  'Source files': 'स्रोत फ़ाइलें',
  'Images and PDFs': 'चित्र और PDF',
  'Project map': 'कार्य का मानचित्र',
  'Administrative details': 'प्रशासनिक विवरण',
  'Member profile': 'सांसद प्रोफ़ाइल',
  'Work record': 'कार्य रिकॉर्ड',
  'Back to dashboard': 'डैशबोर्ड पर वापस जाएँ',
  'Back to MP profiles': 'सांसद प्रोफ़ाइल पर वापस जाएँ',
  'Open record ↗': 'रिकॉर्ड खोलें ↗',
  'View details ↗': 'विवरण देखें ↗',
  'Load more records': 'और रिकॉर्ड लोड करें',
  'No source records match these filters.': 'इन फ़िल्टर से कोई स्रोत रिकॉर्ड नहीं मिला।',
  'No work record was selected.': 'कोई कार्य रिकॉर्ड चयनित नहीं है।',
  'Evidence and analysis': 'साक्ष्य और विश्लेषण',
  'Community feedback': 'सामुदायिक प्रतिक्रिया',
  'Send feedback': 'प्रतिक्रिया भेजें',
  'Open official source ↗': 'आधिकारिक स्रोत खोलें ↗',
  'View PDF here': 'PDF यहाँ देखें',
  'View image here': 'चित्र यहाँ देखें',
  'Open in new tab ↗': 'नए टैब में खोलें ↗',
  'Open street view ↗': 'स्ट्रीट व्यू खोलें ↗',
  'Fetch exact photo location': 'चित्र का सटीक स्थान प्राप्त करें',
  'Fetch images / PDFs and analyse': 'चित्र / PDF प्राप्त कर विश्लेषण करें',
  'Evidence is available, but a full AI comparison has not been completed for this record.': 'साक्ष्य उपलब्ध है, लेकिन इस रिकॉर्ड का पूर्ण AI मिलान अभी पूरा नहीं हुआ है।',
  'No public comments yet.': 'अभी कोई सार्वजनिक टिप्पणी नहीं है।',
  'Public comment': 'सार्वजनिक टिप्पणी',
  'Undo photo': 'चित्र वापस लें',
  'Undo comment': 'टिप्पणी वापस लें',
  'Undo rating': 'रेटिंग वापस लें',
};

function translate(value) {
  const text = String(value ?? '').trim();
  return translations[text] || value;
}

function translateAttributes(root) {
  root.querySelectorAll('[placeholder], [aria-label], [title]').forEach((node) => {
    for (const attribute of ['placeholder', 'aria-label', 'title']) {
      if (node.hasAttribute(attribute)) node.setAttribute(attribute, translate(node.getAttribute(attribute)));
    }
  });
}

function translateText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (node.parentElement?.closest('script, style, code, pre')) return;
    const next = translate(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  });
  translateAttributes(root);
}

function ensureLanguageControl() {
  let actions = document.querySelector('.utility-actions');
  if (!actions) {
    const utility = document.createElement('div');
    utility.className = 'utility-bar';
    utility.innerHTML = '<div class="site-width utility-inner"><a href="https://www.india.gov.in/" target="_blank" rel="noreferrer">भारत सरकार · Government of India</a><div class="utility-actions"><button type="button" data-font="decrease" aria-label="Decrease text size">A−</button><button type="button" data-font="reset" aria-label="Reset text size">A</button><button type="button" data-font="increase" aria-label="Increase text size">A+</button></div></div>';
    document.body.prepend(utility);
    actions = utility.querySelector('.utility-actions');
  }
  let select = actions.querySelector('#languageSelect');
  if (!select) {
    select = document.createElement('select');
    select.id = 'languageSelect';
    select.setAttribute('aria-label', 'Language');
    actions.append(select);
  }
  select.innerHTML = '<option value="en">English</option><option value="hi">हिन्दी</option>';
  select.value = localStorage.getItem(LANGUAGE_KEY) === 'hi' ? 'hi' : 'en';
  select.addEventListener('change', () => setLanguage(select.value));
  return select;
}

export function setLanguage(language) {
  const selected = language === 'hi' ? 'hi' : 'en';
  localStorage.setItem(LANGUAGE_KEY, selected);
  document.documentElement.lang = selected === 'hi' ? 'hi' : 'en';
  document.documentElement.classList.toggle('lang-hi', selected === 'hi');
  const select = document.querySelector('#languageSelect');
  if (select) select.value = selected;
  if (selected === 'hi') translateText(document.body);
  else window.location.reload();
}

export function initializeLanguage() {
  const select = ensureLanguageControl();
  if (!document.querySelector('.gov-footer')) {
    document.body.insertAdjacentHTML('beforeend', '<footer class="gov-footer"><div class="site-width footer-grid"><div><strong>MP Works</strong><span>Independent public data explorer</span></div><p>Source: Ministry of Statistics and Programme Implementation · MPLADS eSAKSHI</p><div><a href="https://mplads.mospi.gov.in/digigov/dashboard.html" target="_blank" rel="noreferrer">Official portal ↗</a><a href="https://www.ux4g.gov.in/" target="_blank" rel="noreferrer">UX4G Design System ↗</a></div></div></footer>');
  }
  const selected = localStorage.getItem(LANGUAGE_KEY) === 'hi' ? 'hi' : 'en';
  document.documentElement.lang = selected === 'hi' ? 'hi' : 'en';
  document.documentElement.classList.toggle('lang-hi', selected === 'hi');
  if (select) select.value = selected;
  if (selected === 'hi') {
    translateText(document.body);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) translateText(node);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

initializeLanguage();
