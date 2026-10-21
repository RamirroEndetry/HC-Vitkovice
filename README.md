# Vítkovice VIP – dotykový kiosek

Webový prototyp pro sdílenou obrazovku ve VIP zóně. Repozitář: https://github.com/RamirroEndetry/HC-Vitkovice

## Návštěvník

1. Úvodní spořič „Dotkni se obrazovky“.
2. Jedna karta konkrétního zápasu s týmy, termínem a odpočtem do otevření tipování. Návštěvník utkání nevybírá; zadá jméno, výsledek 1/X/2, povinné přesné skóre a jako volitelný 4. tip „Ano, prodloužení nebo nájezdy“ (jedna sloučená volba). S tímto tipem zadává konečné skóre o jeden gól (např. 3:2), které se pro 60 minut počítá jako remíza (2:2).
3. Po potvrzení poděkování; za 12 sekund čistý úvod pro dalšího návštěvníka. Po 90 sekundách nečinnosti se rozpracovaný formulář vymaže.
4. Vstup „Průběžné pořadí a vítězové“ zobrazí tabulku všech tipů v aktuálním zápase: jméno, tipované skóre, odchylku a sdílené pořadí. Při dostupném aktuálním skóre zvýrazní průběžné lídry, po potvrzení výsledku konečné vítěze a vyzvednutí ceny ve VIP zóně.

Veškeré tipy jsou za základní hrací dobu, bez prodloužení a nájezdů. Tipování se automaticky OTEVŘE 30 minut před plánovaným začátkem zápasu a automaticky se ZAMKNE 10 minut po něm; potom kiosek žádný tip nepřijme (férovost — nikdo netipuje s výhodou rozehraného zápasu). Obsluha nic nepotvrzuje.

## Ceny a přehled soutěžících

Úvodní obrazovka má pod kartou zápasu dva panely (na širokém displeji po stranách): vlevo „Co můžeš vyhrát – Ceny pro tento zápas“ se seznamem cen pro aktivní zápas, vpravo „Kdo už tipuje“ s posledními čtyřmi tipy a počtem všech. Bez tipů ukazuje výzvu „Zatím nikdo nehrál. Buď první a tipuj!“. Ceny jsou uložené pro každý zápas zvlášť (`state.prizes[matchId]`), obsluha je upravuje v administraci v bloku „Ceny pro tento zápas“ (až šest položek, název + poznámka); dokud je neuloží, platí výchozí trojice. První cena se zmiňuje i při vyhlášení vítěze.

## Obsluha a vyhodnocení

Klikněte na malé ozubené kolečko vpravo dole a zadejte dohodnuté administrátorské heslo. Také `/#obsluha` vyžaduje heslo. Zvolte aktivní utkání pro celou VIP zónu. Volba se ukládá na tomto zařízení a po obnovení stránky zůstane stejné utkání i po jeho začátku nebo skončení; kiosek nepřeskočí na další zápas. Při úplně prvním spuštění se předvybere nejbližší budoucí zápas (pokud žádný není, poslední uvedený); obsluha jej před akcí ověří. Návštěvnické obrazovky nemají výběr zápasu.

Tipy se zamknou samy 10 minut po začátku (administrace ukazuje přesné časové okno zápasu). Výsledek po 60 minutách se po oficiálním konci zápasu zapíše sám z hokej.cz (viz Živé skóre z hokej.cz). Při výpadku zdroje jej obsluha zadá ručně; před uzavřením tipování to nejde. Potvrzený výsledek je v UI uzamčený.

Vyhrává nejmenší součet absolutních odchylek od skóre **po 60 minutách**; přesný tip má odchylku nula. Tip s prodloužením / nájezdy (`decision: "extra"`, skóre o jeden gól; starší tipy mohou mít `overtime` / `shootout` a počítají se stejně) se porovnává jako remíza o gól nižší (`Competition.regulationOf`: 3:2 → 2:2). Při shodě rozhoduje 1) menší odchylka od konečného skóre včetně prodloužení a nájezdů (`total`, tedy kdo trefil vítěze), 2) dřívější čas. Jestli zápas rozhodlo prodloužení, nebo až nájezdy, na pořadí nemá vliv. Příklad 2:2 po 60 minutách, Vítkovice vyhrály 3:2 v nájezdech: 3:2 s prodloužením/nájezdy > 2:2 > 2:3 s prodloužením/nájezdy > 3:2 v základní době. Když zápas skončí 3:2 v základní době, vyhraje naopak tip 3:2 bez prodloužení. Poté rozhoduje dřívější čas odeslání tipu (`savedAt`) — kdo tipuje dřív a stejně přesně, vyhrává sám. Tipy bez časového razítka se řadí za ostatní. Dřívější tip na počet gólů (0–5 / 6 a více) formulář už nenabízí; u starších uložených tipů se při shodě započítá až po tipu na prodloužení / nájezdy. Tabulka pořadí i vyhlášení ukazují čas tipu.

## Dotyková klávesnice

Přihlášení do administrace má vlastní dotykovou klávesnici (číslice, písmena bez háčků a čárek, Shift, mazání, mezera) v klubovém vzhledu s logem; fyzická klávesnice funguje dál. V administraci je navíc přepínač **⌨ Klávesnice: zapnuta/vypnuta** – po zapnutí se dole nad partnery ukotví klávesnice i s českými znaky (ě š č ř ž ý á í é ú ů ď ť ň), která píše do naposledy aktivního pole: ceny a výsledek v administraci i jméno návštěvníka ve formuláři tipu. Tlačítko „Další pole“ přeskočí na následující vstup. Volba se ukládá do zařízení (`localStorage` klíč `kiosk-keyboard`). Rozvržení je v `keyboardMarkup()` v `dist/app.js`.

## Zkušební tipování administrátora

Po odemknutí klikněte na **Spustit zkušební tipování**. Formulář lze použít i před začátkem utkání. Je výrazně označený jako zkušební. Zkouška projde stejnou validací a potvrzením jako návštěvnický tip, ale ukládá se jen do dočasné paměti administrátora; nikdy do soutěžních tipů ani vyhodnocení vítězů. Čas utkání a skutečný stav tipování se nemění.

Volba **Zpět do administrace** umožní pokračovat v práci. Návrat na úvod, 90 sekund nečinnosti nebo obnovení stránky administraci zamkne a testovací režim ukončí. Potvrzení tipu se za 12 sekund vrací na zamčený úvod. Heslo se neukládá do localStorage a odemčení nepřetrvá obnovení stránky.

## Omezení prototypu

Data jsou pouze v localStorage tohoto prohlížeče; při vymazání úložiště se ztratí. Administrace má pouze místní heslovou bránu v JavaScriptu. Heslo lze zjistit ze zdrojového kódu; nejde o serverové zabezpečení a není vhodné k ostré soutěži. Jména nejsou ověřená. Před sběrem skutečných návštěvníků je potřeba serverová databáze, přihlášení obsluhy, serverové uzávěrky a pravidla zpracování a uchování jmen. Výsledky se načítají z veřejného výsledkového zdroje hokej.cz bez smlouvy; při změně jeho formátu je potřeba upravit adaptér. Rozpis je statický, ověřený 19. 10. 2026; termíny se nesynchronizují. Nejde o nasazenou produkční soutěž.

Klubový obsah je v `dist/club-content.js`: stažená soupiska s profily a fotografiemi, kariérní údaje tam, kde je klub zveřejňuje, sezónní statistiky a partnerská loga. Starý ukázkový výběr v `dist/data.js` se v galerii nepoužívá.

## Spuštění a kontroly

- `python -m http.server 5173 --directory dist`
- `npm run check` – testy vyhodnocování a toku kiosku s pevným časem.
- `npm run dev` – místní Cloudflare náhled přes Wrangler.

## GitHub Pages

Workflow `.github/workflows/pages.yml` při každém pushi do `main` publikuje složku `dist` (a do `index.html` vepíše verzi commitu místo `__V__`, aby kiosky nedržely staré skripty a styly v cache) na https://ramirroendetry.github.io/HC-Vitkovice/. Jde o statický web; živé skóre si kiosek stahuje přímo z hokej.cz, takže na Pages funguje celé. Funguje se Settings → Pages → Source: GitHub Actions i s „Deploy from a branch“ (main, kořen): v tom případě kořenový `index.html` přesměruje na `dist/`.

## Cloudflare

`wrangler.jsonc` připravuje Worker s obsluhou `/api/live` a statickými soubory. Kiosek ho pro živé skóre nepotřebuje. V Cloudflare připojte GitHub repozitář přes Workers Builds, se sestavovacím příkazem `npm run build` a příkazem nasazení `npx wrangler deploy`. Alternativně po `npx wrangler login` spusťte `npm run deploy`. Samotná konfigurace neprovádí nasazení ani nezajišťuje VIP přístup.

Zdroje loga, rozpisu a hráčů: https://www.hc-vitkovice.cz/ a https://www.hc-vitkovice.cz/soupiska/MUZ


## Demoverze zápasu

Po odemknutí administrace zvolte **Spustit demo zápasu**. Demo založí přesně 3 ukázkové tipy s náhodnými, různými jmény a skóre 2:1, 1:1 a 3:2. Každých 5 sekund posune událost: začátek, góly, přestávky, všechny tři třetiny a konec 3:2. Tabulka se přepočítává stejnou funkcí jako skutečná soutěž. Průběžný lídr je odlišen od konečného vítěze.

Ovládání: **Pozastavit / Pokračovat**, **Další událost**, **Spustit znovu**, návrat do administrace nebo zamknutí. Demo nepřidává tipy do localStorage, nemění skutečný výsledek a neuzavírá skutečný zápas. Opuštěním administrace nebo obnovením stránky zanikne.

## Živé skóre z hokej.cz

Kiosek po začátku utkání každých 15 s (časový limit 8 s) stahuje přímo z prohlížeče oficiální výsledkový JSON, ze kterého čte i hokej.cz: `https://json.esports.cz/hokejcz/scoreboard/onlajny/RRRR-MM-DD.json`. Zdroj je veřejný, bez klíče a s povoleným CORS, takže funguje i na GitHub Pages bez Workeru. Během zápasu ho hokej.cz obnovuje po 5 s. Utkání se dohledá podle data z `dist/data.js` a zkratek týmů (`VIT` + `short` soupeře z `dist/teams.js`); když hrají Vítkovice venku, skóre se otočí, aby vždy byly první.

Skóre pro soutěž je **součet tří třetin** (`score_period`), nikdy celkové skóre, takže góly v prodloužení a nájezdy se nezapočítají (např. VIT–LIB 20. 10. 2026: oficiálně 3:2 po nájezdech, pro soutěž 2:2). Stav se mapuje na fáze `scheduled`, `period1–3`, `break1–2` a `regulation_end`; místo zbývajícího času se ukazuje odehraná minuta (např. 47'). Adaptér je `LiveMatch.fromScoreboard` v `dist/live.js`.

- Konec 3. třetiny (i prodloužení) tipování uzavře.
- Jakmile hokej.cz označí zápas jako **„po zápase“**, výsledek po 60 minutách se **zapíše automaticky** (`results[matchId].source = "hokej.cz"`) a na úvodní obrazovce nebo výsledkové tabulce se hned spustí vyhlášení s pohárem; spořič se přitom sám zavře. Obsluha nic nepotvrzuje.
- Zapíše se i způsob rozhodnutí (`decision`: `regulation` / `overtime` / `shootout` podle stavu K / KP / KN) a konečné skóre (`total`). Kiosek pak ukazuje např. „2 : 2 po 60 minutách · rozhodly nájezdy, konečné skóre 3 : 2“.
- Ruční zadání výsledku v administraci zůstává jen jako záloha při výpadku zdroje; při remíze po 60 minutách musí obsluha vybrat, kdo vyhrál prodloužení nebo nájezdy (z toho se dopočítá konečné skóre).
- Výpadek zdroje zruší průběžné pořadí (jména a tipy zůstanou vidět) a při dalším úspěšném dotazu se vše obnoví. Dotazy neběží v demoverzi a po zapsání výsledku.
- Zrušený nebo odložený zápas se ohlásí jako chyba, výsledek se nezapíše.

Volitelně `worker.mjs` nabízí totéž na serveru: `GET /api/live?matchId=lib&date=2026-10-20&opponent=LIB` vrací normalizovaný snapshot (`matchId, home, away, phase, clock, updatedAt, final`). Kiosek ho nepotřebuje.

`npm run check` ověřuje adaptér na skutečném záznamu zápasu VIT–LIB a na simulovaných živých stavech (třetiny, přestávky, prodloužení, zápas venku, zrušení), automatické vyhlášení i výpadek zdroje. Proti skutečnému zdroji je ověřené načtení odehraného zápasu v prohlížeči; průběh živého zápasu (přesné názvy stavů během hry) se ověří až při nejbližším utkání.

## Panel na výšku

Na displeji na výšku (od 900 px šířky a 1400 px výšky, typicky 1080×1920) se zapne samostatné rozvržení ve stylu intro videa. Úvod se vejde na celou obrazovku bez posouvání, dotykové prvky jsou velké a za logem jsou reflektory a paprsky. Pravidla jsou v bloku `@media (orientation:portrait)` na konci `dist/style.css`. Rozvržení na šířku a pro mobily zůstává beze změny. Kiosek nikde neukazuje posuvníky (posouvání dotykem funguje dál), aby se na panelu neobjevila postranní lišta.

## Spořič obrazovky s intro videem

Když úvodní obrazovka kiosku 45 sekund nikdo nepoužije (a hned po spuštění), přes celou obrazovku se ve smyčce přehrává 24s intro. Na panelu na výšku se použije `dist/assets/intro/intro-portrait.mp4` (1080×1920), na šířku `intro.mp4` (1920×1080). Dotyk nebo klávesa spořič zavře a vrátí úvod; dotyk nestiskne nic pod ním. Logika je v `dist/screensaver.js`. Když systém panelu hlásí špatnou orientaci, otevři kiosek jednou s `?video=vyska` (nebo `?video=sirka`); volba se na zařízení zapamatuje, `?video=auto` ji zruší.

Videa skládá `npm run intro:render` (na šířku) a `npm run intro:render -- --portrait` (na výšku) (Python, Pillow, numpy, ffmpeg) z loga a fotek hráčů stažených z webu klubu. Hráče a texty lze změnit v hlavičce `scripts/render-intro.py`.

## Historie klubu

Obrazovka „Úspěchy klubu“ ukazuje časovou osu 41 mezníků z oficiální historie klubu (1928–2022) se 17 dobovými fotografiemi, filtr podle období, přehled titulů a stříbrných sezón. Data stahuje `python scripts/sync-club-content.py --history-only` (texty z hc-vitkovice.cz/historie-klubu; fotografie tam mají mrtvé odkazy, skript je proto bere ze snímků Wayback Machine a ukládá do `dist/assets/history`).

## Mobil a malé displeje

Na telefonech se spořič nespouští (není to kiosek a mobilní prohlížeče často blokují autoplay) a lišta partnerů není připnutá – je to poslední blok stránky.

## Loga partnerů

`python scripts/trim-partner-logos.py` ořeže bílé okraje stažených log partnerů, aby vyplnila dlaždice v liště; `scripts/sync-club-content.py` to dělá automaticky po každém stažení.

## Loga českých klubů

`dist/teams.js` obsahuje všech 14 extraligových klubů ověřených na oficiálním webu HC Vítkovice dne 19. 10. 2026. Aktuální zápas používá stabilní `awayTeamId`, podle kterého se samo vybere správné logo soupeře. Nejde o katalog všech nižších soutěží v Česku.

- `npm run logos:sync` stáhne a ověří místní PNG/SVG kopie do `dist/assets/teams/`.
- `npm run build` provede stejnou synchronizaci před nasazením; může vyžadovat přístup k síti.
- Adresy se znovu zjišťují z oficiálního webu podle jmen klubů; pokud se název nenajde, použije se známá adresa.
- `sources.json` zaznamenává zdroj, čas stažení, velikost a kontrolní součet každého souboru.
- Kiosek nejdříve používá místní kopii, při selhání zkusí známou vzdálenou adresu a pak zobrazí zkratku klubu. Běžné zobrazování proto nevyžaduje opakované stahování od klubového webu.

Při přidání nového účastníka extraligy se rozšíří registr týmů; změna loga stávajícího klubu se promítne při další synchronizaci.

## Klubové úspěchy, hráčské profily a partneři

Na úvodní obrazovce jsou tlačítka **Úspěchy klubu** a **Profily hráčů**. Úspěchy stručně shrnují dva ligové tituly a devět stříbrných sezón podle https://www.hc-vitkovice.cz/nejvetsi-uspechy-klubu . Galerie hráčů má filtr postů a vlastní detail každého profilu s fotografií, základními údaji, statistikami a dostupnými kariérními fakty. Pokud klub kariéru neuvádí, aplikace to výslovně oznámí. Každý detail uvádí datum stažení a odkaz na původní profil. Statistiky nejsou živé.

Aktuální místní snapshot: 32 hráčů a 134 partnerů ze stránek https://www.hc-vitkovice.cz/soupiska/MUZ a https://www.hc-vitkovice.cz/partneri . Počty se při příštím stažení mohou změnit. Obnovíte příkazem `npm run content:sync` (Python 3, síťový přístup). Import používá jen oficiální klubový web a jeho obrazové CDN; obrázky ukládá do `dist/assets/players` a `dist/assets/partners`. Výstupní dataset se přepíše až po dokončení importu.

Spodní partnerský pás je viditelný na všech běžných obrazovkách. Generální partner je pevný, ostatní partneři rotují po trojicích každých 8 sekund s přechodem směrem dolů. Nevynechávají se žádné importované partnerské kategorie. Tlačítka umožňují rotaci pozastavit a posunout ručně; při systémové volbě omezení pohybu se pohybová animace vypne.

## Vyhlášení s pohárem

Po potvrzení konečného výsledku aplikace spočítá vítěze a automaticky zobrazí pohár, gratulaci, jméno nebo jména, tip, odchylku a pokyn k vyzvednutí ceny ve VIP zóně. Bez přesného tipu se vyhlásí nejbližší podle stejných pravidel jako v tabulce. Při shodě zůstávají všichni společnými vítězi. Bez platných tipů se pohár nezobrazuje.

Vyhlášení má vlastní časovač přesně 300 sekund. Běžný návrat po 90 sekundách jej nepřeruší. Celou obrazovku lze zavřít dotykem/kliknutím, klávesou Escape nebo po uplynutí pěti minut; potom se zobrazí výsledková tabulka. Na výsledkové obrazovce lze pohár znovu otevřít tlačítkem **Zobrazit pohár**. Stejná obrazovka se spustí na konci demoverze a je označená jako demo. Průběžný lídr pohár nespouští. Interaktivní prvky pod vyhlášením jsou po dobu zobrazení nedostupné.

Testy pokrývají mimo jiné celou pětiminutovou životnost i zavření dotykem, oddělení demoverze, obsah profilů, přítomnost obrázků a rotaci/pozastavení partnerů. Vizuální kontrola celé aplikace v prohlížeči zůstává neprovedená.
