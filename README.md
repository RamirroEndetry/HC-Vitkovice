# Vítkovice VIP – dotykový kiosek

Webový prototyp pro sdílenou obrazovku ve VIP zóně. Repozitář: https://github.com/RamirroEndetry/HC-Vitkovice

## Návštěvník

1. Úvodní spořič „Dotkni se obrazovky“.
2. Jedna karta konkrétního zápasu s týmy, termínem a odpočtem do otevření tipování. Návštěvník utkání nevybírá; zadá jméno, výsledek 1/X/2, povinné přesné skóre a volitelně počet gólů (0–5 / 6 a více).
3. Po potvrzení poděkování; za 12 sekund čistý úvod pro dalšího návštěvníka. Po 90 sekundách nečinnosti se rozpracovaný formulář vymaže.
4. Vstup „Průběžné pořadí a vítězové“ zobrazí tabulku všech tipů v aktuálním zápase: jméno, tipované skóre, odchylku a sdílené pořadí. Při dostupném aktuálním skóre zvýrazní průběžné lídry, po potvrzení výsledku konečné vítěze a vyzvednutí ceny ve VIP zóně.

Veškeré tipy jsou za základní hrací dobu, bez prodloužení a nájezdů. Tipování se automaticky OTEVŘE v plánovaném začátku zápasu a běží do konce 3. třetiny. Uzavření po 3. třetině potvrzuje obsluha; neodvozuje se z 60 minut běžného času, protože hokej má přestávky a přerušení. Bez potvrzení obsluhy zůstává tipování otevřené i po skutečném konci třetiny. Živý poskytovatel zatím není připojený. Připravené rozhraní po připojení platných dat automaticky uzavře tipy při stavu `regulation_end`; bez dat je nutné ruční uzavření obsluhou. Stav soutěže se kontroluje také při odeslání. Každý návštěvník má samostatný záznam; potvrzení záznam nenahrazuje. Jeden tip na normalizované jméno a zápas na tomto zařízení. Ověření totožnosti ani synchronizace dalších kiosků zatím neexistuje. Staré tipy předchozího osobního prototypu se do kioskové soutěže nepřenášejí.

## Obsluha a vyhodnocení

Klikněte na malé ozubené kolečko vpravo dole a zadejte dohodnuté administrátorské heslo. Také `/#obsluha` vyžaduje heslo. Zvolte aktivní utkání pro celou VIP zónu. Volba se ukládá na tomto zařízení a po obnovení stránky zůstane stejné utkání i po jeho začátku nebo skončení; kiosek nepřeskočí na další zápas. Při úplně prvním spuštění se předvybere nejbližší budoucí zápas (pokud žádný není, poslední uvedený); obsluha jej před akcí ověří. Návštěvnické obrazovky nemají výběr zápasu.

Při konci 3. třetiny stiskněte **Konec 3. třetiny — uzavřít tipy**. Uzavření se uloží a již nelze přidávat tipy ani po restartu. Potom zadejte ověřené skóre po 60 minutách a potvrďte vyhodnocení. Před uzavřením tipování nelze výsledek potvrdit. Potvrzený výsledek je v UI uzamčený.

Vyhrává nejmenší součet absolutních odchylek domácího a hostujícího skóre; přesný tip má odchylku nula. Při shodě rozhoduje správný volitelný tip na počet gólů, pak se vyhlásí všichni společně. Výběr 1/X/2 musí odpovídat zadanému skóre; nepřiděluje samostatné body. Bez tipů není vyhlášen vítěz. Pravidla, rozdělení cen při shodě a postup při odložení musí potvrdit pořadatel.

## Zkušební tipování administrátora

Po odemknutí klikněte na **Spustit zkušební tipování**. Formulář lze použít i před začátkem utkání. Je výrazně označený jako zkušební. Zkouška projde stejnou validací a potvrzením jako návštěvnický tip, ale ukládá se jen do dočasné paměti administrátora; nikdy do soutěžních tipů ani vyhodnocení vítězů. Čas utkání a skutečný stav tipování se nemění.

Volba **Zpět do administrace** umožní pokračovat v práci. Návrat na úvod, 90 sekund nečinnosti nebo obnovení stránky administraci zamkne a testovací režim ukončí. Potvrzení tipu se za 12 sekund vrací na zamčený úvod. Heslo se neukládá do localStorage a odemčení nepřetrvá obnovení stránky.

## Omezení prototypu

Data jsou pouze v localStorage tohoto prohlížeče; při vymazání úložiště se ztratí. Administrace má pouze místní heslovou bránu v JavaScriptu. Heslo lze zjistit ze zdrojového kódu; nejde o serverové zabezpečení a není vhodné k ostré soutěži. Jména nejsou ověřená. Před sběrem skutečných návštěvníků je potřeba serverová databáze, přihlášení obsluhy, serverové uzávěrky a pravidla zpracování a uchování jmen. Výsledky zadává obsluha ručně, Tipsport není připojen. Rozpis je statický, ověřený 19. 10. 2026; termíny se nesynchronizují. Nejde o nasazenou produkční soutěž.

Klubový obsah je v `dist/club-content.js`: stažená soupiska s profily a fotografiemi, kariérní údaje tam, kde je klub zveřejňuje, sezónní statistiky a partnerská loga. Starý ukázkový výběr v `dist/data.js` se v galerii nepoužívá.

## Spuštění a kontroly

- `python -m http.server 5173 --directory dist`
- `npm run check` – testy vyhodnocování a toku kiosku s pevným časem.
- `npm run dev` – místní Cloudflare náhled přes Wrangler.

## Cloudflare

`wrangler.jsonc` připravuje Worker s obsluhou `/api/live` a statickými soubory. Samotný statický HTTP server obslouží UI a demo, ale živé API běží až přes Wrangler nebo nasazený Worker. V Cloudflare připojte GitHub repozitář přes Workers Builds, se sestavovacím příkazem `npm run build` a příkazem nasazení `npx wrangler deploy`. Alternativně po `npx wrangler login` spusťte `npm run deploy`. Samotná konfigurace neprovádí nasazení ani nezajišťuje VIP přístup.

Zdroje loga, rozpisu a hráčů: https://www.hc-vitkovice.cz/ a https://www.hc-vitkovice.cz/soupiska/MUZ


## Demoverze zápasu

Po odemknutí administrace zvolte **Spustit demo zápasu**. Demo založí přesně 3 ukázkové tipy s náhodnými, různými jmény a skóre 2:1, 1:1 a 3:2. Každých 5 sekund posune událost: začátek, góly, přestávky, všechny tři třetiny a konec 3:2. Tabulka se přepočítává stejnou funkcí jako skutečná soutěž. Průběžný lídr je odlišen od konečného vítěze.

Ovládání: **Pozastavit / Pokračovat**, **Další událost**, **Spustit znovu**, návrat do administrace nebo zamknutí. Demo nepřidává tipy do localStorage, nemění skutečný výsledek a neuzavírá skutečný zápas. Opuštěním administrace nebo obnovením stránky zanikne.

## Připojení živého skóre – připravené rozhraní, bez poskytovatele

Klient každých 15 sekund po začátku utkání požaduje `GET /api/live?matchId=lib` (analogicky `kom`, `tri`). Bez zdroje vrací Worker HTTP 503 s kódem `LIVE_FEED_NOT_CONFIGURED`; UI neukazuje vymyšlené skóre ani lídra. Dotazy neběží během demoverze a po potvrzení konečného výsledku. Výpadek nebo data starší 90 sekund zruší průběžné pořadí; jména a tipy zůstanou vidět. Starší odpověď nepřepíše novější skóre. Potvrzené konečné výsledky nejsou omezené dobou platnosti živých dat.

Až bude dostupný poskytovatel a jeho dokumentace, je potřeba implementovat adaptér a mapování ID utkání. Proměnná prostředí `LIVE_FEED_URL` určuje HTTPS adresu normalizovaného feedu; Worker přidává parametr `matchId`. Volitelný `LIVE_FEED_TOKEN` patří do Cloudflare Secrets, posílá se pouze poskytovateli hlavičkou Bearer a nesmí být v klientském JavaScriptu ani v repozitáři. Žádné skutečné přístupové údaje nejsou nastavené a žádné přímé Tipsport API nyní není integrováno.

Normalizovaná JSON odpověď adaptéru:

```json
{
  "matchId": "lib",
  "home": 2,
  "away": 1,
  "phase": "period3",
  "clock": "08:41",
  "updatedAt": "2026-10-20T17:20:00Z"
}
```

`updatedAt` musí být aktuální čas posledního ověření zdroje (nikoli pouze čas posledního gólu). `clock` je čas zbývající ve třetině. Povolené fáze: `scheduled`, `period1`, `break1`, `period2`, `break2`, `period3`, `regulation_end`. Skóre musí být výhradně za základní hrací dobu; prodloužení a nájezdy do této soutěže nepatří. Po přijetí `regulation_end` se tipy uzavřou, ale konečné vítěze stále potvrzuje obsluha přes výsledkový formulář. To brání záměně průběžného lídra za definitivního vítěze.

Kontroly: `npm run check` ověřuje ranking, celou demoverzi, oddělení dat, chybějící/opožděný feed a serverové rozhraní pomocí simulovaných odpovědí. Skutečné napojení na poskytovatele ani vizuální kontrola v prohlížeči nebyly provedeny.


## Spořič obrazovky s intro videem

Když úvodní obrazovka kiosku 45 sekund nikdo nepoužije (a hned po spuštění), přes celou obrazovku se ve smyčce přehrává 24s intro. Na panelu na výšku se použije `dist/assets/intro/intro-portrait.mp4` (1080×1920), na šířku `intro.mp4` (1920×1080). Dotyk nebo klávesa spořič zavře a vrátí úvod; dotyk nestiskne nic pod ním. Logika je v `dist/screensaver.js`.

Videa skládá `npm run intro:render` (na šířku) a `npm run intro:render -- --portrait` (na výšku) (Python, Pillow, numpy, ffmpeg) z loga a fotek hráčů stažených z webu klubu. Hráče a texty lze změnit v hlavičce `scripts/render-intro.py`.

## Loga českých klubů

`dist/teams.js` obsahuje všech 14 extraligových klubů ověřených na oficiálním webu HC Vítkovice dne 19. 10. 2026. Aktuální zápas používá stabilní `awayTeamId`, podle kterého se samo vybere správné logo soupeře. Nejde o katalog všech nižších soutěží v Česku.

- `npm run logos:sync` stáhne a ověří místní PNG/SVG kopie do `dist/assets/teams/`.
- `npm run build` provede stejnou synchronizaci před nasazením; může vyžadovat přístup k síti.
- Adresy se znovu zjišťují z oficiálního webu podle jmen klubů; pokud se název nenajde, použije se známá adresa.
- `sources.json` zaznamenává zdroj, čas stažení, velikost a kontrolní součet každého souboru.
- Kiosek nejdříve používá místní kopii, při selhání zkusí známou vzdálenou adresu a pak zobrazí zkratku klubu. Běžné zobrazování proto nevyžaduje opakované stahování od klubového webu.

Při přidání nového účastníka extraligy se rozšíří registr týmů; změna loga stávajícího klubu se promítne při další synchronizaci.

## Ověřené možnosti živých výsledků

Živá data existují; dosud chybí konkrétní přístup aplikace k poskytovateli, nikoli technická možnost integrace.

- Sportradar výslovně uvádí Czech Extraliga v Global Ice Hockey API: https://developer.sportradar.com/ice-hockey/reference/global-ice-hockey-overview
- Goalserve uvádí českou extraligu v seznamu pokrytí včetně livescores: https://www.goalserve.com/frort-data-feeds/sport-data-feeds/ice-hockey-api/coverage a nabízí žádost o trial: https://www.goalserve.com/ruores/contact-us
- API-Sports Hockey nabízí testovací tarif 100 požadavků denně: https://api-sports.io/sports/hockey a dokumentuje aktualizace zápasů po 15 sekundách: https://api-sports.io/documentation/hockey/v1 . Pokrytí konkrétní extraligové sezóny a přístup zvoleného tarifu je potřeba ověřit přes účet/API; samotná dokumentace země Czech-Republic to negarantuje.

Pro dvaapůlhodinový zápas při aktualizaci po 15 sekundách vychází přibližně 600 požadavků na jeden sdílený zdroj. Tarif 100 požadavků denně tedy poslouží na ověření, nikoli na celou takto častou aktualizaci zápasu. Do aplikace nebyl bez klíče aktivován žádný z těchto poskytovatelů.


## Klubové úspěchy, hráčské profily a partneři

Na úvodní obrazovce jsou tlačítka **Úspěchy klubu** a **Profily hráčů**. Úspěchy stručně shrnují dva ligové tituly a devět stříbrných sezón podle https://www.hc-vitkovice.cz/nejvetsi-uspechy-klubu . Galerie hráčů má filtr postů a vlastní detail každého profilu s fotografií, základními údaji, statistikami a dostupnými kariérními fakty. Pokud klub kariéru neuvádí, aplikace to výslovně oznámí. Každý detail uvádí datum stažení a odkaz na původní profil. Statistiky nejsou živé.

Aktuální místní snapshot: 32 hráčů a 134 partnerů ze stránek https://www.hc-vitkovice.cz/soupiska/MUZ a https://www.hc-vitkovice.cz/partneri . Počty se při příštím stažení mohou změnit. Obnovíte příkazem `npm run content:sync` (Python 3, síťový přístup). Import používá jen oficiální klubový web a jeho obrazové CDN; obrázky ukládá do `dist/assets/players` a `dist/assets/partners`. Výstupní dataset se přepíše až po dokončení importu.

Spodní partnerský pás je viditelný na všech běžných obrazovkách. Generální partner je pevný, ostatní partneři rotují po trojicích každých 8 sekund s přechodem směrem dolů. Nevynechávají se žádné importované partnerské kategorie. Tlačítka umožňují rotaci pozastavit a posunout ručně; při systémové volbě omezení pohybu se pohybová animace vypne.

## Vyhlášení s pohárem

Po potvrzení konečného výsledku aplikace spočítá vítěze a automaticky zobrazí pohár, gratulaci, jméno nebo jména, tip, odchylku a pokyn k vyzvednutí ceny ve VIP zóně. Bez přesného tipu se vyhlásí nejbližší podle stejných pravidel jako v tabulce. Při shodě zůstávají všichni společnými vítězi. Bez platných tipů se pohár nezobrazuje.

Vyhlášení má vlastní časovač přesně 300 sekund. Běžný návrat po 90 sekundách jej nepřeruší. Celou obrazovku lze zavřít dotykem/kliknutím, klávesou Escape nebo po uplynutí pěti minut; potom se zobrazí výsledková tabulka. Na výsledkové obrazovce lze pohár znovu otevřít tlačítkem **Zobrazit pohár**. Stejná obrazovka se spustí na konci demoverze a je označená jako demo. Průběžný lídr pohár nespouští. Interaktivní prvky pod vyhlášením jsou po dobu zobrazení nedostupné.

Testy pokrývají mimo jiné celou pětiminutovou životnost i zavření dotykem, oddělení demoverze, obsah profilů, přítomnost obrázků a rotaci/pozastavení partnerů. Vizuální kontrola celé aplikace v prohlížeči zůstává neprovedená.
