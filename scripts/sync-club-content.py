"""Refresh public roster/profile facts and partner images from the official club site."""
import concurrent.futures
import importlib.util
import datetime
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://www.hc-vitkovice.cz'
ALLOWED = {'www.hc-vitkovice.cz', 'hc-vitkovice.esports.cz'}

class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []
    def all(self, tag=None):
        for child in self.children:
            if isinstance(child, Node):
                if tag is None or child.tag == tag:
                    yield child
                yield from child.all(tag)
    def first(self, tag):
        return next(self.all(tag), None)
    def text(self):
        return re.sub(r'\s+', ' ', ''.join(c.text() if isinstance(c, Node) else c for c in self.children)).strip()

class Tree(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node('root')
        self.stack = [self.root]
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.stack.append(node)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break
    def handle_data(self, text):
        self.stack[-1].children.append(text)

def read(url):
    if urllib.parse.urlparse(url).hostname not in ALLOWED:
        raise ValueError('Unexpected content host')
    req = urllib.request.Request(url, headers={'User-Agent':'VitkoviceVIP-ContentSync/1.0'})
    with urllib.request.urlopen(req, timeout=25) as response:
        if urllib.parse.urlparse(response.url).hostname not in ALLOWED:
            raise ValueError('Unexpected redirect')
        return response.read(8*1024*1024), response.headers.get_content_type()

def page(url):
    data, _ = read(url)
    tree = Tree(data.decode('utf-8'))
    main = tree.root.first('main')
    if not main:
        raise ValueError('Main content missing: '+url)
    return main

_spec = importlib.util.spec_from_file_location('trim_partner_logos', Path(__file__).with_name('trim-partner-logos.py'))
_trim = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_trim)
trim_partner_logo = _trim.trim

def asset(url, folder, identity):
    url = urllib.parse.urljoin(BASE, url)
    data, kind = read(url)
    ext = {'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/svg+xml':'.svg','image/gif':'.gif'}.get(kind)
    if not ext:
        raise ValueError('Not an image: '+url)
    relative = Path('assets') / folder / (str(identity)+ext)
    target = ROOT/'dist'/relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return relative.as_posix()

def profile(url):
    main = page(url)
    section = main.first('section')
    name = main.first('h1').text()
    fields, stats = {}, {}
    for li in section.all('li'):
        label = li.first('b')
        spans = list(li.all('span'))
        if label and spans:
            fields[label.text().rstrip(':')] = spans[-1].text()
        elif len(spans) == 2:
            stats[spans[0].text()] = spans[1].text()
    number = next((n.text().lstrip('#') for n in section.all('span') if re.fullmatch(r'#\d+',n.text())), '')
    photo = section.first('img')
    pid = url.rsplit('/',1)[-1]
    career = []
    typo = next((n for n in main.all('div') if 'typo' in n.attrs.get('class','').split()), None)
    if typo:
        # Extract factual career fields, not a copy of the complete biography.
        for p in typo.all('p'):
            text = p.text()
            for label in ['Odchovanec:', 'Předchozí kluby:', 'Reprezentace:', 'Dosavadní úspěchy:', 'Draft NHL:']:
                if label in text:
                    value = text.split(label,1)[1]
                    value = re.split(r'(?:Reprezentace:|Dosavadní úspěchy:|Draft NHL:)',value)[0].strip()
                    if label == 'Odchovanec:':
                        value = value.split('Předchozí kluby:',1)[0]
                    career.append({'label':label.rstrip(':'),'value':' '.join(value.split()[:100])})
    result = {'id':pid,'name':name,'number':number,'position':fields.get('Pozice',''),'born':fields.get('Datum narození',''),'measurements':fields.get('Výška / váha',''),'stick':fields.get('Držení hole',''),'stats':stats,'career':career[:5],'source':url,'photo':''}
    if photo:
        result['photo'] = asset(photo.attrs['src'],'players',pid)
    return result

def main():
    roster = page(BASE+'/soupiska/MUZ')
    urls = list(dict.fromkeys(urllib.parse.urljoin(BASE,a.attrs['href']) for a in roster.all('a') if re.fullmatch(r'/player/\d+',a.attrs.get('href',''))))
    if len(urls)<15:
        raise ValueError('Roster unexpectedly short; previous snapshot preserved')
    partner_page = page(BASE+'/partneri')
    partners, seen = [], set()
    for section in partner_page.all('section'):
        heading = section.first('h3')
        if not heading:
            continue
        category = heading.text()
        for a in section.all('a'):
            image = a.first('img')
            if not image or 'db_partners/logos/' not in image.attrs.get('src',''):
                continue
            source = urllib.parse.urljoin(BASE,image.attrs['src'])
            identity = hashlib.sha256(urllib.parse.urlsplit(source).path.encode()).hexdigest()[:12]
            if identity in seen:
                continue
            seen.add(identity)
            partners.append({'id':identity,'name':image.attrs.get('alt','Partner klubu'),'category':category,'sourceLogo':source,'url':urllib.parse.urljoin(BASE,a.attrs.get('href','/partneri'))})
    if len(partners)<10:
        raise ValueError('Partners unexpectedly short; previous snapshot preserved')
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        players = list(pool.map(profile,urls))
        def download_partner(partner):
            logo = asset(partner['sourceLogo'],'partners',partner['id'])
            if logo.endswith('.png'):
                trim_partner_logo(ROOT/'dist'/logo)
            return {**partner,'logo':logo}
        partners = list(pool.map(download_partner,partners))
    data = {'updatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'rosterSource':BASE+'/soupiska/MUZ','partnersSource':BASE+'/partneri','players':players,'partners':partners}
    output = '(function(root){const content='+json.dumps(data,ensure_ascii=False)+';if(typeof module!=="undefined")module.exports=content;else root.ClubContent=content;})(globalThis);\n'
    (ROOT/'dist'/'club-content.js').write_text(output,encoding='utf-8')
    print(f'Downloaded {len(players)} profiles/photos and {len(partners)} partner logos.')

if __name__ == '__main__':
    main()
